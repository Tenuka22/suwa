"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Sparkles,
  StopCircle,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Input } from "@/components/design/ui/input";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import { _client, orpc, queryClient } from "@/utils/orpc";
import { useSpeechToText } from "@/utils/use-speech-to-text";

interface ChatMsg {
  agent?: string;
  content: string;
  id: string;
  role: "user" | "assistant" | "tool_call";
  toolName?: string;
}

export default function AiChatScreen() {
  const router = useRouter();
  const { message: initialMessage } = useLocalSearchParams<{
    message?: string;
  }>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasAutoSent = useRef(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechToText();

  const createMutation = useMutation(
    orpc.ai.chat.create.mutationOptions({
      onSuccess: (s) => {
        setActiveSessionId(s.id);
        setMessages([]);
        queryClient.invalidateQueries({ queryKey: ["ai"] });
      },
    })
  );

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride ?? input.trim();
    if (!text || streaming) {
      return;
    }
    if (!textOverride) {
      setInput("");
    }

    let sid = activeSessionId;
    if (!sid) {
      const s = await createMutation.mutateAsync({ title: text.slice(0, 50) });
      sid = s.id;
    }

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const iter = await _client.ai.chat.send(
        { sessionId: sid, message: text },
        { signal: ac.signal }
      );
      let assistantContent = "";
      for await (const event of iter) {
        const { event: ev, data: d } = event as any;
        if (ev === "message.token") {
          assistantContent += d.token ?? "";
          setMessages((prev) => {
            const cp = [...prev];
            const last = cp[cp.length - 1];
            if (last?.role === "assistant" && last.id === sid) {
              cp[cp.length - 1] = { ...last, content: assistantContent };
            } else {
              cp.push({
                id: sid!,
                role: "assistant",
                content: assistantContent,
                agent: d.agent,
              });
            }
            return cp;
          });
        } else if (ev === "message.end") {
          setMessages((prev) => {
            const cp = [...prev];
            const last = cp[cp.length - 1];
            if (last?.role === "assistant") {
              cp[cp.length - 1] = {
                ...last,
                content: d.finalResponse || assistantContent,
              };
            }
            return cp;
          });
          queryClient.invalidateQueries({ queryKey: ["ai"] });
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((p) => [
          ...p,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Error: ${err.message}`,
          },
        ]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  // Auto-send initial message from home screen
  useEffect(() => {
    if (initialMessage && !hasAutoSent.current) {
      hasAutoSent.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="mt-sm flex-row items-center gap-md border-border border-b bg-background-elevated/50 px-lg py-md">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background-elevated shadow-sm"
          onPress={() => router.back()}
        >
          <ArrowLeft className="text-primary" size={20} />
        </Pressable>
        <View>
          <Text className="font-serif text-hero text-primary leading-tight">
            AI Assistant
          </Text>
          <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
            Suwa Intelligent Care
          </Text>
        </View>
      </View>

      <FlatList
        className="flex-1 px-lg"
        contentContainerStyle={{ paddingVertical: 20 }}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-huge pt-20">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-tint-purple">
              <Sparkles className="text-tint-purple-foreground" size={48} />
            </View>
            <View className="items-center gap-md">
              <Text className="text-center font-serif text-hero text-primary">
                How can I help you?
              </Text>
              <Text className="px-huge text-center font-sans text-body text-foreground-secondary">
                Ask about health, doctors, or wellness tools. I'm here to guide
                you anonymously.
              </Text>
            </View>
          </View>
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ref={flatListRef}
        renderItem={({ item }) => (
          <View
            className={`mb-lg max-w-[85%] rounded-3xl p-lg ${item.role === "user" ? "self-end bg-primary" : "self-start border border-border/50 bg-background-elevated shadow-sm"}`}
          >
            {item.role === "assistant" && (
              <View className="mb-xs flex-row items-center gap-sm">
                <Sparkles className="text-accent" size={12} />
                <Text className="font-bold font-sans text-accent text-micro uppercase tracking-widest">
                  Assistant
                </Text>
              </View>
            )}
            <Text
              className={`font-sans text-body leading-relaxed ${item.role === "user" ? "text-primary-foreground" : "text-foreground-secondary"}`}
            >
              {item.content}
            </Text>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <View className="flex-row items-end gap-md border-border border-t bg-background-elevated/90 p-lg pb-24">
          <View className="flex-1">
            <Input
              className="border-0 bg-background shadow-none"
              inputContainerClassName={`rounded-3xl border-border/50 ${isListening ? "bg-accent/10" : ""}`}
              multiline
              onChangeText={setInput}
              placeholder="Ask anything..."
              rightIcon={
                <Pressable
                  onPress={isListening ? stopListening : startListening}
                >
                  {isListening ? (
                    <MicOff className="text-accent" size={20} />
                  ) : (
                    <Mic className="text-foreground-placeholder" size={20} />
                  )}
                </Pressable>
              }
              value={input}
            />
          </View>
          {(input.trim() || streaming) && (
            <Pressable
              className={`h-12 w-12 items-center justify-center rounded-full ${streaming ? "bg-accent" : "bg-primary"}`}
              onPress={
                streaming
                  ? () => abortRef.current?.abort()
                  : () => sendMessage(undefined)
              }
            >
              {streaming ? (
                <StopCircle className="text-white" size={24} />
              ) : (
                <Send className="text-white" size={20} />
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <ScreenBottomBar
        leftActions={[
          {
            icon: <Sparkles className="text-foreground" size={20} />,
            label: "New chat",
            onPress: () => {
              setMessages([]);
              setActiveSessionId(null);
            },
          },
        ]}
        returnAction={{
          href: "/(patient)",
          icon: <ArrowLeft className="text-foreground" size={24} />,
        }}
      />
    </View>
  );
}
