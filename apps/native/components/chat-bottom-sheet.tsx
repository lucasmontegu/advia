// apps/native/components/chat-bottom-sheet.tsx
import { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { useLocation } from '@/hooks/use-location';
import { useSendChatMessage } from '@/hooks/use-api';
import { Icon } from '@/components/icons';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBottomSheet() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { location } = useLocation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<FlatList>(null);
  const snapPoints = useMemo(() => ['15%', '50%', '80%'], []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');

  const sendMessage = useSendChatMessage();

  const quickSuggestions = [
    t('map.suggestions.workRoute'),
    t('map.suggestions.nearbyAlerts'),
    t('map.suggestions.willItRain'),
  ];

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || sendMessage.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreamingContent('');

    // Expand bottom sheet when sending
    bottomSheetRef.current?.snapToIndex(1);

    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendMessage.mutateAsync({
        message: trimmedInput,
        history,
        location: location ? { latitude: location.latitude, longitude: location.longitude } : undefined,
        onChunk: (chunk) => {
          setStreamingContent(chunk);
        },
      });

      // Replace streaming content with final message
      setStreamingContent('');
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setStreamingContent('');
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('chat.comingSoon'),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [input, messages, location, sendMessage, t]);

  const handleSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  // Combine messages with streaming content for display
  const displayMessages = useMemo(() => {
    if (streamingContent && sendMessage.isPending) {
      return [
        ...messages,
        {
          id: 'streaming',
          role: 'assistant' as const,
          content: streamingContent,
        },
      ];
    }
    return messages;
  }, [messages, streamingContent, sendMessage.isPending]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Chat messages */}
        {displayMessages.length > 0 && (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View
                style={{
                  alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: item.role === 'user' ? colors.primary : colors.muted,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  marginBottom: 8,
                  maxWidth: '80%',
                }}
              >
                <Text
                  style={{
                    color: item.role === 'user' ? colors.primaryForeground : colors.foreground,
                    fontFamily: 'NunitoSans_400Regular',
                  }}
                >
                  {item.content}
                  {item.id === 'streaming' && (
                    <Text style={{ opacity: 0.5 }}>▊</Text>
                  )}
                </Text>
              </View>
            )}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}

        {/* Quick suggestions (only show if no messages) */}
        {messages.length === 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontFamily: 'NunitoSans_400Regular',
                fontSize: 14,
                color: colors.mutedForeground,
                marginBottom: 8,
              }}
            >
              {t('map.chatPrompt')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {quickSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSuggestion(suggestion)}
                  style={{
                    backgroundColor: colors.muted,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: 'NunitoSans_400Regular',
                      fontSize: 13,
                    }}
                  >
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 24,
              color: colors.foreground,
              fontFamily: 'NunitoSans_400Regular',
            }}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!sendMessage.isPending}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            style={{
              backgroundColor: input.trim() && !sendMessage.isPending ? colors.primary : colors.muted,
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Icon name="send" size={20} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
