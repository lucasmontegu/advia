// apps/mobile/components/home/ai-copilot-button.tsx
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { Icon } from '@/components/icons';

export type AICopilotState = 'idle' | 'has-suggestion' | 'listening' | 'speaking';

type AICopilotButtonProps = {
  state?: AICopilotState;
  suggestionCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AICopilotButton({
  state = 'idle',
  suggestionCount = 0,
  onPress,
  onLongPress,
}: AICopilotButtonProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const getAccessibilityLabel = () => {
    switch (state) {
      case 'listening':
        return t('aiCopilot.listening');
      case 'speaking':
        return t('aiCopilot.thinking');
      case 'has-suggestion':
        return `AI Copilot. ${suggestionCount} suggestions available`;
      default:
        return 'AI Copilot. Tap to open, hold to speak';
    }
  };

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const waveProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Manage animations based on state
  useEffect(() => {
    // Reset animations
    cancelAnimation(pulseScale);
    cancelAnimation(glowOpacity);
    cancelAnimation(waveProgress);

    switch (state) {
      case 'has-suggestion':
        // Pulse animation
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        );
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 800 }),
            withTiming(0.2, { duration: 800 })
          ),
          -1
        );
        break;

      case 'listening':
      case 'speaking':
        // Waveform animation
        waveProgress.value = withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.linear }),
          -1
        );
        pulseScale.value = 1;
        glowOpacity.value = withTiming(0.4);
        break;

      default:
        pulseScale.value = withSpring(1);
        glowOpacity.value = withTiming(0);
        waveProgress.value = 0;
    }
  }, [state, pulseScale, glowOpacity, waveProgress]);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { scale: buttonScale.value },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value * 1.3 }],
  }));

  const getIcon = () => {
    switch (state) {
      case 'listening':
        return 'voice';
      case 'speaking':
        return 'voice';
      default:
        return 'storm'; // AI avatar icon
    }
  };

  const showBadge = state === 'has-suggestion' && suggestionCount > 0;
  const showWaveform = state === 'listening' || state === 'speaking';

  return (
    <View style={styles.wrapper}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          { backgroundColor: colors.primary },
          glowAnimatedStyle,
        ]}
      />

      {/* Main button */}
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityState={{
          busy: state === 'listening' || state === 'speaking',
        }}
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          containerAnimatedStyle,
        ]}
      >
        {/* Icon or waveform */}
        {showWaveform ? (
          <WaveformAnimation
            progress={waveProgress}
            isListening={state === 'listening'}
          />
        ) : (
          <Icon name={getIcon()} size={26} color="#FFFFFF" />
        )}

        {/* Suggestion badge */}
        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {suggestionCount > 9 ? '9+' : suggestionCount}
            </Text>
          </View>
        )}
      </AnimatedPressable>

      {/* State label (for listening/speaking) */}
      {showWaveform && (
        <Animated.View style={styles.stateLabel}>
          <Text style={[styles.stateLabelText, { color: colors.primary }]}>
            {state === 'listening' ? t('aiCopilot.listening') : t('aiCopilot.thinking')}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// Waveform animation component
function WaveformAnimation({
  progress,
  isListening,
}: {
  progress: SharedValue<number>;
  isListening: boolean;
}) {
  const bars = [0, 1, 2, 3, 4];

  return (
    <View style={styles.waveformContainer}>
      {bars.map((index) => (
        <WaveformBar
          key={index}
          index={index}
          progress={progress}
          isListening={isListening}
        />
      ))}
    </View>
  );
}

function WaveformBar({
  index,
  progress,
  isListening,
}: {
  index: number;
  progress: SharedValue<number>;
  isListening: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const phase = (progress.value * 2 * Math.PI) + (index * 0.8);
    const height = isListening
      ? 8 + Math.sin(phase) * 10
      : 6 + Math.sin(phase) * 6;

    return {
      height: Math.max(4, height),
    };
  });

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        animatedStyle,
      ]}
    />
  );
}

const BUTTON_SIZE = 60;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  stateLabel: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  stateLabelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
});
