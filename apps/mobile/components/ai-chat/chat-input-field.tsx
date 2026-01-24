import { useCallback, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Button, Spinner } from 'heroui-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 120;

interface ChatInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onVoicePress?: () => void;
  onStopGeneration?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  isGenerating?: boolean;
  isRecording?: boolean;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

export function ChatInputField({
  value,
  onChangeText,
  onSubmit,
  onVoicePress,
  onStopGeneration,
  placeholder = 'Escribe un mensaje...',
  isLoading = false,
  isGenerating = false,
  isRecording = false,
  disabled = false,
  maxLength = 500,
  autoFocus = false,
}: ChatInputFieldProps) {
  const colors = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(MIN_HEIGHT);
  const focusProgress = useSharedValue(0);

  const handleFocus = useCallback(() => {
    focusProgress.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [focusProgress]);

  const handleBlur = useCallback(() => {
    focusProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
  }, [focusProgress]);

  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const newHeight = Math.min(
        Math.max(e.nativeEvent.contentSize.height, MIN_HEIGHT),
        MAX_HEIGHT
      );
      setInputHeight(newHeight);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (value.trim() && !disabled && !isLoading) {
      onSubmit();
    }
  }, [value, disabled, isLoading, onSubmit]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(
      focusProgress.value,
      [0, 1],
      [1, 2],
      Extrapolation.CLAMP
    );
    return {
      borderWidth,
    };
  });

  const canSend = value.trim().length > 0 && !disabled && !isLoading;
  const showStopButton = isGenerating && onStopGeneration;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          containerAnimatedStyle,
          {
            backgroundColor: colors.muted,
            borderColor: focusProgress.value > 0 ? colors.primary : colors.border,
          },
        ]}
      >
        {/* Voice button */}
        {onVoicePress && (
          <Pressable
            onPress={onVoicePress}
            disabled={disabled || isLoading}
            style={[
              styles.voiceButton,
              {
                backgroundColor: isRecording ? colors.danger : 'transparent',
              },
            ]}
          >
            <Icon
              name="voice"
              size={20}
              color={isRecording ? '#FFFFFF' : colors.mutedForeground}
            />
          </Pressable>
        )}

        {/* Text input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          editable={!disabled}
          maxLength={maxLength}
          multiline
          returnKeyType="send"
          blurOnSubmit={false}
          autoFocus={autoFocus}
          style={[
            styles.input,
            {
              color: colors.foreground,
              height: inputHeight,
              maxHeight: MAX_HEIGHT,
            },
          ]}
        />

        {/* Action button */}
        <View style={styles.actionContainer}>
          {showStopButton ? (
            <Pressable
              onPress={onStopGeneration}
              style={[styles.stopButton, { backgroundColor: colors.danger }]}
            >
              <View style={[styles.stopIcon, { backgroundColor: '#FFFFFF' }]} />
            </Pressable>
          ) : isLoading ? (
            <View style={styles.spinnerContainer}>
              <Spinner size="sm" color="primary" />
            </View>
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={!canSend}
              style={[
                styles.sendButton,
                {
                  backgroundColor: canSend ? colors.primary : colors.muted,
                  opacity: canSend ? 1 : 0.5,
                },
              ]}
            >
              <Icon
                name="send"
                size={18}
                color={canSend ? colors.primaryForeground : colors.mutedForeground}
              />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    textAlignVertical: 'center',
  },
  actionContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  spinnerContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
