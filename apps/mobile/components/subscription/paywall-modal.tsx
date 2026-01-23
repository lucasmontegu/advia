// apps/mobile/components/subscription/paywall-modal.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';
import { useSubscriptionCheckout, useIsPremium } from '@/hooks/use-subscription';
import { Icon } from '@/components/icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type PaywallModalProps = {
  visible: boolean;
  onDismiss?: () => void;
  allowDismiss?: boolean;
};

const FEATURES = [
  {
    icon: 'route' as const,
    title: 'Rutas ilimitadas',
    description: 'Planifica todos tus viajes con clima en tiempo real',
  },
  {
    icon: 'storm' as const,
    title: 'Alertas proactivas',
    description: 'Te avisamos antes de que el clima sea peligroso',
  },
  {
    icon: 'shield' as const,
    title: 'Refugios cercanos',
    description: 'Encuentra lugares seguros cuando los necesites',
  },
  {
    icon: 'voice' as const,
    title: 'Copiloto por voz',
    description: 'Habla con Driwet mientras conduces',
  },
];

export function PaywallModal({
  visible,
  onDismiss,
  allowDismiss = false,
}: PaywallModalProps) {
  const colors = useThemeColors();
  const { checkout } = useSubscriptionCheckout();
  const { isSubscribed } = useIsPremium();
  const { trialStartDate } = useTrialStore();
  const [isLoading, setIsLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Auto-dismiss when subscription is active
  useEffect(() => {
    if (isSubscribed && visible) {
      onDismiss?.();
    }
  }, [isSubscribed, visible, onDismiss]);

  const handleSubscribe = useCallback(async () => {
    setIsLoading(selectedPlan);
    try {
      await checkout(selectedPlan);
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Error',
        'No se pudo iniciar el proceso de pago. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(null);
    }
  }, [checkout, selectedPlan]);

  const handleDismiss = useCallback(() => {
    if (allowDismiss) {
      onDismiss?.();
    }
  }, [allowDismiss, onDismiss]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          disabled={!allowDismiss}
        />
      </Animated.View>

      {/* Content */}
      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header gradient */}
        <LinearGradient
          colors={[colors.primary + '30', 'transparent']}
          style={styles.headerGradient}
        />

        {/* Close button (if dismissible) */}
        {allowDismiss && (
          <Pressable style={styles.closeButton} onPress={handleDismiss}>
            <Icon name="close" size={24} color={colors.mutedForeground} />
          </Pressable>
        )}

        {/* Trial ended badge */}
        {trialStartDate && (
          <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
            <Icon name="clock" size={14} color={colors.warning} />
            <Text style={[styles.badgeText, { color: colors.warning }]}>
              Tu prueba gratuita ha terminado
            </Text>
          </View>
        )}

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Continúa protegido{'\n'}con Driwet Premium
        </Text>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View
                style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}
              >
                <Icon name={feature.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {feature.title}
                </Text>
                <Text
                  style={[styles.featureDescription, { color: colors.mutedForeground }]}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selection */}
        <View style={styles.plans}>
          {/* Yearly plan */}
          <Pressable
            onPress={() => setSelectedPlan('yearly')}
            style={[
              styles.planCard,
              {
                backgroundColor: selectedPlan === 'yearly' ? colors.primary + '15' : colors.muted,
                borderColor: selectedPlan === 'yearly' ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selectedPlan === 'yearly' ? colors.primary : colors.border,
                    backgroundColor:
                      selectedPlan === 'yearly' ? colors.primary : 'transparent',
                  },
                ]}
              >
                {selectedPlan === 'yearly' && (
                  <Icon name="checkmark" size={12} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: colors.foreground }]}>Anual</Text>
                <Text style={[styles.planPrice, { color: colors.foreground }]}>
                  $49.99/año
                </Text>
              </View>
              <View style={[styles.saveBadge, { backgroundColor: colors.safe }]}>
                <Text style={styles.saveText}>-17%</Text>
              </View>
            </View>
            <Text style={[styles.planEquivalent, { color: colors.mutedForeground }]}>
              $4.17/mes
            </Text>
          </Pressable>

          {/* Monthly plan */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            style={[
              styles.planCard,
              {
                backgroundColor: selectedPlan === 'monthly' ? colors.primary + '15' : colors.muted,
                borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
                    backgroundColor:
                      selectedPlan === 'monthly' ? colors.primary : 'transparent',
                  },
                ]}
              >
                {selectedPlan === 'monthly' && (
                  <Icon name="checkmark" size={12} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: colors.foreground }]}>Mensual</Text>
                <Text style={[styles.planPrice, { color: colors.foreground }]}>
                  $4.99/mes
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={handleSubscribe}
          disabled={isLoading !== null}
          style={[
            styles.ctaButton,
            { backgroundColor: colors.primary },
            isLoading && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.ctaText}>
            {isLoading
              ? 'Procesando...'
              : selectedPlan === 'yearly'
                ? 'Suscribirme por $49.99/año'
                : 'Suscribirme por $4.99/mes'}
          </Text>
        </Pressable>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Cancela cuando quieras · Pago seguro con Stripe
        </Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.92,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 24,
  },
  features: {
    gap: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  plans: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  planPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  planEquivalent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 34,
  },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  ctaButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
