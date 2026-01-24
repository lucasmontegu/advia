import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { useLocation } from '@/hooks/use-location';
import { useSendChatMessage } from '@/hooks/use-api';
import { useTextToSpeech, speakAgentResponse } from '@/hooks/use-text-to-speech';
import { Icon } from '@/components/icons';
import { Analytics } from '@/lib/analytics';
import {
  ChatMessage,
  ChatInputField,
  type ChatMessageData,
} from '@/components/ai-chat';

export function ChatBottomSheet() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { location } = useLocation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<FlatList>(null);
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const sendMessage = useSendChatMessage();
  const tts = useTextToSpeech({ language: 'es-ES' });

  const quickSuggestions = [
    { icon: 'route' as const, text: t('map.suggestions.workRoute') || '¿Cómo está el clima en mi ruta?' },
    { icon: 'alert' as const, text: t('map.suggestions.nearbyAlerts') || '¿Hay alertas cerca?' },
    { icon: 'rain' as const, text: t('map.suggestions.willItRain') || '¿Va a llover hoy?' },
  ];

  // Stop TTS when user starts typing
  useEffect(() => {
    if (input.length > 0 && tts.isSpeaking) {
      tts.stop();
    }
  }, [input, tts]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, [tts]);

  const handleSheetChange = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || sendMessage.isPending) return;

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreamingContent('');
    Analytics.chatMessageSent();

    // Expand bottom sheet when sending
    bottomSheetRef.current?.snapToIndex(1);

    const streamingId = (Date.now() + 1).toString();

    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendMessage.mutateAsync({
        message: trimmedInput,
        history,
        location: location
          ? { latitude: location.latitude, longitude: location.longitude }
          : undefined,
        onChunk: (chunk) => {
          setStreamingContent(chunk);
        },
      });

      // Replace streaming content with final message
      setStreamingContent('');
      const assistantMessage: ChatMessageData = {
        id: streamingId,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response using TTS
      speakAgentResponse(tts, response, { skipIfShort: true, minLength: 15 });
    } catch (error) {
      console.error('Chat error:', error);
      setStreamingContent('');
      const errorMessage: ChatMessageData = {
        id: streamingId,
        role: 'assistant',
        content: t('chat.error') || 'Lo siento, hubo un error. Intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [input, messages, location, sendMessage, t, tts]);

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setInput(suggestion);
      bottomSheetRef.current?.snapToIndex(1);
      Analytics.chatQuickActionUsed(suggestion);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    []
  );

  const handleCopy = useCallback(async (content: string) => {
    await Clipboard.setStringAsync(content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleSpeak = useCallback(
    (content: string) => {
      if (tts.isSpeaking) {
        tts.stop();
      } else {
        tts.speak(content);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [tts]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Combine messages with streaming content for display
  const displayMessages = useMemo(() => {
    if (streamingContent || sendMessage.isPending) {
      return [
        ...messages,
        {
          id: 'streaming',
          role: 'assistant' as const,
          content: streamingContent,
          isStreaming: true,
          timestamp: new Date(),
        },
      ];
    }
    return messages;
  }, [messages, streamingContent, sendMessage.isPending]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessageData }) => (
      <ChatMessage
        message={item}
        onCopy={item.role === 'assistant' && !item.isStreaming ? handleCopy : undefined}
        onSpeak={item.role === 'assistant' && !item.isStreaming ? handleSpeak : undefined}
        isSpeaking={tts.isSpeaking}
      />
    ),
    [handleCopy, handleSpeak, tts.isSpeaking]
  );

  const isCollapsed = currentIndex === 0;
  const hasMessages = displayMessages.length > 0;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
      enablePanDownToClose={false}
      onChange={handleSheetChange}
    >
      <BottomSheetView style={styles.container}>
        {/* Header - show when expanded with messages */}
        {hasMessages && !isCollapsed && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.header, { borderBottomColor: colors.border }]}
          >
            <View style={styles.headerLeft}>
              <Icon name="storm" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                {t('chat.title') || 'Driwet AI'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => tts.setEnabled(!tts.isEnabled)}
                style={[
                  styles.headerButton,
                  { backgroundColor: tts.isEnabled ? colors.primary + '20' : colors.muted },
                ]}
              >
                <Icon
                  name="voice"
                  size={18}
                  color={tts.isEnabled ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={handleClearChat}
                style={[styles.headerButton, { backgroundColor: colors.muted }]}
              >
                <Icon name="delete" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Collapsed state - show prompt and suggestions */}
        {!hasMessages && (
          <View style={styles.collapsedContent}>
            <View style={styles.collapsedHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="storm" size={24} color={colors.primary} />
              </View>
              <View style={styles.collapsedTextContainer}>
                <Text style={[styles.collapsedTitle, { color: colors.foreground }]}>
                  {t('map.chatPrompt') || 'Pregunta sobre el clima'}
                </Text>
                <Text style={[styles.collapsedSubtitle, { color: colors.mutedForeground }]}>
                  {t('chat.subtitle') || 'Rutas, alertas y pronósticos'}
                </Text>
              </View>
              <Pressable
                onPress={() => tts.setEnabled(!tts.isEnabled)}
                style={[
                  styles.ttsToggle,
                  { backgroundColor: tts.isEnabled ? colors.primary + '20' : colors.muted },
                ]}
              >
                <Icon
                  name="voice"
                  size={18}
                  color={tts.isEnabled ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
            </View>

            {/* Quick suggestions - improved design */}
            <View style={styles.suggestionsContainer}>
              {quickSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.text}
                  onPress={() => handleSuggestion(suggestion.text)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    {
                      backgroundColor: pressed ? colors.primary + '15' : colors.muted,
                      borderColor: pressed ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Icon name={suggestion.icon} size={14} color={colors.primary} />
                  <Text
                    style={[styles.suggestionText, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {suggestion.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Messages list */}
        {hasMessages && (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input - always visible */}
        <View style={[styles.inputWrapper, { borderTopColor: colors.border }]}>
          <ChatInputField
            value={input}
            onChangeText={setInput}
            onSubmit={handleSend}
            placeholder={t('chat.placeholder') || 'Pregunta sobre el clima...'}
            isLoading={sendMessage.isPending}
            isGenerating={sendMessage.isPending && !!streamingContent}
            disabled={false}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedTextContainer: {
    flex: 1,
  },
  collapsedTitle: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 16,
  },
  collapsedSubtitle: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  ttsToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 13,
    flexShrink: 1,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  inputWrapper: {
    borderTopWidth: 1,
  },
});
