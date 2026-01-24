import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';
import { TypingIndicator } from './typing-indicator';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  timestamp?: Date;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onCopy?: (content: string) => void;
  onSpeak?: (content: string) => void;
  isSpeaking?: boolean;
}

export function ChatMessage({
  message,
  onCopy,
  onSpeak,
  isSpeaking = false,
}: ChatMessageProps) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.systemContainer, { backgroundColor: colors.muted }]}
      >
        <Icon name="storm" size={14} color={colors.mutedForeground} />
        <Text style={[styles.systemText, { color: colors.mutedForeground }]}>
          {message.content}
        </Text>
      </Animated.View>
    );
  }

  // Show typing indicator while streaming and no content yet
  if (message.isStreaming && !message.content) {
    return (
      <Animated.View
        entering={FadeInUp.duration(200)}
        style={styles.assistantRow}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Icon name="storm" size={16} color={colors.primaryForeground} />
        </View>
        <TypingIndicator size="md" />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.assistantRow,
      ]}
    >
      {/* Avatar for assistant */}
      {isAssistant && (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Icon name="storm" size={16} color={colors.primaryForeground} />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          {
            backgroundColor: isUser ? colors.primary : colors.muted,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: isUser ? colors.primaryForeground : colors.foreground,
            },
          ]}
        >
          {message.content}
          {message.isStreaming && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>

        {/* Actions for assistant messages */}
        {isAssistant && !message.isStreaming && message.content && (
          <View style={styles.actionsRow}>
            {onCopy && (
              <Pressable
                onPress={() => onCopy(message.content)}
                style={[styles.actionButton, { backgroundColor: colors.background + '80' }]}
                hitSlop={8}
              >
                <Icon name="copy" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
            {onSpeak && (
              <Pressable
                onPress={() => onSpeak(message.content)}
                style={[
                  styles.actionButton,
                  { backgroundColor: isSpeaking ? colors.primary + '20' : colors.background + '80' },
                ]}
                hitSlop={8}
              >
                <Icon
                  name="voice"
                  size={14}
                  color={isSpeaking ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Spacer for user messages (to align right) */}
      {isUser && <View style={styles.avatar} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  cursor: {
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 8,
  },
  systemText: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 12,
  },
});
