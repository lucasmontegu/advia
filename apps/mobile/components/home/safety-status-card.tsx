// apps/mobile/components/home/safety-status-card.tsx
import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useTranslation } from '@/lib/i18n';
import { Icon, type IconName } from '@/components/icons';
import { colors as themeColors } from '@/theme/colors';

export type SafetyStatus = 'safe' | 'caution' | 'warning' | 'danger';

type SafetyStatusCardProps = {
  status: SafetyStatus;
  message?: string;
  detailMessage?: string;
  temperature?: number;
  onPress?: () => void;
  onExpand?: (expanded: boolean) => void;
};

const STATUS_CONFIG: Record<
  SafetyStatus,
  { icon: IconName; defaultMessageKey: string }
> = {
  safe: { icon: 'weather', defaultMessageKey: 'safetyStatus.safe' },
  caution: { icon: 'alert', defaultMessageKey: 'safetyStatus.caution' },
  warning: { icon: 'storm', defaultMessageKey: 'safetyStatus.warning' },
  danger: { icon: 'alert', defaultMessageKey: 'safetyStatus.danger' },
};

const COLLAPSED_HEIGHT = 56;
const EXPANDED_HEIGHT = 140;

export function SafetyStatusCard({
  status,
  message,
  detailMessage,
  temperature,
  onPress,
  onExpand,
}: SafetyStatusCardProps) {
  const colors = useThemeColors();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const config = STATUS_CONFIG[status];
  const safetyColors = themeColors.safety[status];

  const backgroundColor = isDark ? safetyColors.bgDark : safetyColors.bg;
  const textColor = isDark ? safetyColors.textDark : safetyColors.text;
  const iconColor = safetyColors.icon;

  const displayMessage = message || t(config.defaultMessageKey, { time: '3 PM' });

  // Animation values
  const expandProgress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const iconPulse = useSharedValue(1);

  // Danger/warning pulse animation
  useEffect(() => {
    if (status === 'danger' || status === 'warning') {
      // Outer pulse ring animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1000 }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 0 }),
          withTiming(0, { duration: 1000 })
        ),
        -1
      );

      // Icon subtle pulse
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
      iconPulse.value = 1;
    }
  }, [status]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const iconPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  const toggleExpanded = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    expandProgress.value = withSpring(newExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    onExpand?.(newExpanded);
  }, [isExpanded, expandProgress, onExpand]);

  // Swipe gesture to collapse/expand
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldExpand = event.translationY > 30;
      const shouldCollapse = event.translationY < -30;

      if (shouldExpand && !isExpanded) {
        runOnJS(toggleExpanded)();
      } else if (shouldCollapse && isExpanded) {
        runOnJS(toggleExpanded)();
      }

      translateY.value = withSpring(0);
    });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      expandProgress.value,
      [0, 1],
      [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
      Extrapolation.CLAMP
    ),
    transform: [{ translateY: translateY.value * 0.3 }],
  }));

  const detailsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [10, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(expandProgress.value, [0, 1], [0, 180])}deg`,
      },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor },
          containerAnimatedStyle,
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${displayMessage}. ${t('safetyStatus.tapToExpand')}`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Pressable
          onPress={onPress || toggleExpanded}
          style={styles.pressableContent}
          accessibilityRole="button"
        >
          {/* Main row - always visible */}
          <View style={styles.mainRow}>
            {/* Status icon with pulse effect for danger/warning */}
            <View style={styles.iconWrapper}>
              {/* Pulse ring animation for urgent states */}
              {(status === 'danger' || status === 'warning') && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { backgroundColor: iconColor },
                    pulseRingStyle,
                  ]}
                />
              )}
              <Animated.View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }, iconPulseStyle]}>
                <Icon name={config.icon} size={22} color={iconColor} />
              </Animated.View>
            </View>

            {/* Text content */}
            <View style={styles.textContainer}>
              <Text style={[styles.statusText, { color: textColor }]} numberOfLines={1}>
                {displayMessage}
              </Text>
              {!isExpanded && (
                <Text style={[styles.hintText, { color: textColor + '80' }]}>
                  {t('safetyStatus.tapToExpand')}
                </Text>
              )}
            </View>

            {/* Temperature (if available) */}
            {temperature !== undefined && (
              <View style={styles.tempContainer}>
                <Text style={[styles.tempText, { color: textColor }]}>
                  {Math.round(temperature)}°
                </Text>
              </View>
            )}

            {/* Expand/collapse chevron */}
            <Animated.View style={chevronAnimatedStyle}>
              <Icon name="chevron-down" size={18} color={textColor} />
            </Animated.View>
          </View>

          {/* Expanded details */}
          <Animated.View style={[styles.detailsContainer, detailsAnimatedStyle]}>
            <View style={[styles.divider, { backgroundColor: textColor + '20' }]} />

            {/* Detail message */}
            {detailMessage && (
              <Text style={[styles.detailText, { color: textColor }]}>
                {detailMessage}
              </Text>
            )}

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: iconColor + '20' }]}
                accessibilityRole="button"
                accessibilityLabel={t('safetyStatus.viewOnMap')}
              >
                <Icon name="route" size={16} color={iconColor} />
                <Text style={[styles.actionText, { color: iconColor }]}>
                  {t('safetyStatus.viewOnMap')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                accessibilityRole="button"
                accessibilityLabel={t('safetyStatus.setAlert')}
              >
                <Icon name="notification" size={16} color={colors.foreground} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>
                  {t('safetyStatus.setAlert')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>

        {/* Drag handle indicator */}
        <View style={styles.dragHandle}>
          <View style={[styles.handleBar, { backgroundColor: textColor + '30' }]} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pressableContent: {
    flex: 1,
    padding: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  hintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  tempContainer: {
    marginRight: 4,
  },
  tempText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  detailsContainer: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  handleBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
});
