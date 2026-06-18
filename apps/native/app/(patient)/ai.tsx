"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { ArrowLeft, Send, Sparkles, User, StopCircle } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/design/ui/button";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { _client, orpc, queryClient } from "@/utils/orpc";

interface ChatMsg {
  agent?: string;
  content: string;
  id: string;
  role: "user" | "assistant" | "tool_call";
  toolName?: string;
}

export default function AiChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);

  const createMutation = useMutation(
    orpc.ai.chat.create.mutationOptions({
      onSuccess: (s) => {
        setActiveSessionId(s.id);
        setMessages([]);
        queryClient.invalidateQueries({ queryKey: ["ai"] });
      },
    })
  );

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput("");

    let sid = activeSessionId;
    if (!sid) {
      const s = await createMutation.mutateAsync({ title: text.slice(0, 50) });
      sid = s.id;
    }

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const iter = await _client.ai.chat.send({ sessionId: sid, message: text }, { signal: ac.signal });
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
              cp.push({ id: sid!, role: "assistant", content: assistantContent, agent: d.agent });
            }
            return cp;
          });
        } else if (ev === "message.end") {
          setMessages((prev) => {
            const cp = [...prev];
            const last = cp[cp.length - 1];
            if (last?.role === "assistant") cp[cp.length - 1] = { ...last, content: d.finalResponse || assistantContent };
            return cp;
          });
          queryClient.invalidateQueries({ queryKey: ["ai"] });
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${err.message}` }]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-md mt-sm px-lg py-md border-b border-border bg-background-elevated/50">
        <Pressable onPress={() => router.back()} className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm">
          <ArrowLeft size={20} className="text-primary" />
        </Pressable>
        <View>
          <Text className="font-serif text-hero text-primary leading-tight">AI Assistant</Text>
          <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">Suwa Intelligent Care</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        className="flex-1 px-lg"
        contentContainerStyle={{ paddingVertical: 20 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20 gap-huge">
            <View className="h-24 w-24 rounded-full bg-tint-purple items-center justify-center">
              <Sparkles size={48} className="text-tint-purple-foreground" />
            </View>
            <View className="items-center gap-md">
              <Text className="font-serif text-hero text-primary text-center">How can I help you?</Text>
              <Text className="font-sans text-body text-foreground-secondary text-center px-huge">
                Ask about health, doctors, or wellness tools. I'm here to guide you anonymously.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className={`mb-lg max-w-[85%] rounded-3xl p-lg ${item.role === "user" ? "self-end bg-primary" : "self-start bg-background-elevated shadow-sm border border-border/50"}`}>
            {item.role === "assistant" && (
              <View className="flex-row items-center gap-sm mb-xs">
                <Sparkles size={12} className="text-accent" />
                <Text className="font-sans text-micro font-bold text-accent uppercase tracking-widest">Assistant</Text>
              </View>
            )}
            <Text className={`font-sans text-body leading-relaxed ${item.role === "user" ? "text-primary-foreground" : "text-foreground-secondary"}`}>
              {item.content}
            </Text>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
        <View className="p-lg border-t border-border bg-background-elevated/90 flex-row items-end gap-md">
          <View className="flex-1">
            <Input
              placeholder="Ask anything..."
              multiline
              value={input}
              onChangeText={setInput}
              className="bg-background border-0 shadow-none"
              inputContainerClassName="rounded-3xl border-border/50"
            />
          </View>
          <Pressable
            disabled={!input.trim() && !streaming}
            onPress={streaming ? () => abortRef.current?.abort() : sendMessage}
            className={`h-12 w-12 rounded-full items-center justify-center ${streaming ? "bg-accent" : "bg-primary"}`}
          >
            {streaming ? <StopCircle size={24} className="text-white" /> : <Send size={20} className="text-white" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
