import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ChatPanel } from "@/components/chat-panel";
import { MapViewComponent } from "@/components/map-view";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // TODO: Replace with actual AI SDK call
    // Simulated response for now
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Entendido. Estoy analizando "${text}". Esta funcionalidad se conectará con el agente AI pronto.`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Map takes most of the screen */}
      <View style={styles.mapContainer}>
        <MapViewComponent />
      </View>

      {/* Chat panel fixed at bottom */}
      <ChatPanel
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
});
