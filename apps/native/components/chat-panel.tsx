import { Button } from "heroui-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  onSendMessage?: (message: string) => void;
  messages?: Message[];
  isLoading?: boolean;
};

export function ChatPanel({
  onSendMessage,
  messages = [],
  isLoading = false,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  // Default welcome message if no messages
  const displayMessages: Message[] =
    messages.length > 0
      ? messages
      : [
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hola, soy tu asistente de clima. Pregúntame sobre alertas en tu zona o si es seguro viajar a algún lugar.",
          },
        ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.inner, { paddingBottom: insets.bottom + 8 }]}>
        {/* Messages area */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {displayMessages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInUp.delay(index * 100).duration(300)}
              style={[
                styles.messageBubble,
                message.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === "user"
                    ? styles.userMessageText
                    : styles.assistantMessageText,
                ]}
              >
                {message.content}
              </Text>
            </Animated.View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.assistantMessage]}>
              <Text style={styles.assistantMessageText}>Pensando...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe o pregunta algo..."
            placeholderTextColor="#71717a"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Button
            onPress={handleSend}
            isDisabled={!input.trim() || isLoading}
            size="lg"
          >
            <Button.Label>Enviar</Button.Label>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: "40%",
    minHeight: 180,
  },
  inner: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 8,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#3b82f6",
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#27272a",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#ffffff",
  },
  assistantMessageText: {
    color: "#e4e4e7",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
  },
});
