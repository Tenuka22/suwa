"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import { ArrowLeft, MessageCircle, Send, WifiOff } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Input } from "@/components/design/ui/input";
import { Reveal } from "@/components/design/ui/reveal";
import { Skeleton } from "@/components/design/ui/skeleton";
import { showToast, ToastContainer } from "@/components/design/ui/toast";
import { _client, orpc } from "@/utils/orpc";
import { authClient } from "@/utils/better-auth";

interface GlobalMessage {
  authorId: string;
  authorName: string;
  content: string;
  id: string;
  timestamp: number;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function MessageBubble({
  item,
  isOwn,
}: {
  isOwn: boolean;
  item: GlobalMessage;
}) {
  return (
    <Reveal delay={10}>
      <View className={`max-w-[86%] ${isOwn ? "self-end" : "self-start"}`}>
        {!isOwn ? (
          <Text className="font-poppins-medium text-foreground-muted text-micro mb-xs ml-md uppercase tracking-wider">
            {item.authorName}
          </Text>
        ) : null}
        <View
          className={`rounded-3xl px-lg py-md ${
            isOwn
              ? "rounded-br-lg bg-primary"
              : "rounded-bl-lg border border-border/60 bg-background-elevated"
          }`}
        >
          <Text
            className={`font-sans text-body leading-relaxed ${
              isOwn ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {item.content}
          </Text>
          <Text
            className={`font-sans text-micro mt-xs ${
              isOwn ? "text-primary-foreground/60" : "text-foreground-muted"
            }`}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    </Reveal>
  );
}

export default function GlobalChatScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [input, setInput] = useState("");
  const [liveMessages, setLiveMessages] = useState<GlobalMessage[]>([]);
  const [connected, setConnected] = useState(true);
  const flatListRef = useRef<FlatList<GlobalMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);
  const knownCountRef = useRef(0);

  const messagesQuery = useQuery(
    orpc.chatRoom.list.queryOptions({
      input: { cursor: 0, limit: 100 },
    })
  );

  const sendMutation = useMutation(
    orpc.chatRoom.send.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chatRoom"] });
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Failed to send message";
        showToast({ message, title: "Error", type: "error" });
      },
    })
  );

  const initialTotal = messagesQuery.data?.total ?? 0;
  const initialMessages = messagesQuery.data?.messages ?? [];

  useEffect(() => {
    if (initialTotal > 0) {
      knownCountRef.current = initialTotal;
    }
  }, [initialTotal]);

  useEffect(() => {
    const abortController = new AbortController();
    abortRef.current = abortController;

    let cancelled = false;

    async function subscribe() {
      try {
        const iter = await _client.chatRoom.subscribe(
          { knownCount: knownCountRef.current },
          { signal: abortController.signal }
        );

        for await (const event of iter) {
          if (cancelled) break;
          if (event.type === "new_messages") {
            const newMsgs = event.messages as GlobalMessage[];
            knownCountRef.current += newMsgs.length;
            setLiveMessages((prev) => [...prev, ...newMsgs]);
            setConnected(true);
          }
        }
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("abort"))
        ) {
          return;
        }
        if (!cancelled) {
          setConnected(false);
        }
      }
    }

    subscribe();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const total = liveMessages.length + initialMessages.length;
    if (total > 0) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [liveMessages.length, initialMessages.length]);

  const allMessages = [...initialMessages, ...liveMessages];

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sendMutation.isPending) {
      return;
    }
    setInput("");

    const optimistic: GlobalMessage = {
      id: crypto.randomUUID(),
      content: text,
      authorId: session?.user?.id ?? "",
      authorName: "You",
      timestamp: Date.now(),
    };
    setLiveMessages((prev) => [...prev, optimistic]);

    sendMutation.mutate(
      { content: text },
      {
        onSettled: () => {
          setLiveMessages((prev) =>
            prev.filter((m) => m.id !== optimistic.id)
          );
        },
      }
    );
  }, [input, sendMutation]);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: false,
          title: getScreenTitle("native:patient:global-chat"),
        }}
      />
      <View className="flex-row items-center gap-md border-border border-b bg-background-elevated/80 px-lg py-md">
        <Pressable
          accessibilityLabel="Go back"
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-background-elevated"
          onPress={() => router.replace("/(patient)")}
        >
          <ArrowLeft color="#315b4d" size={20} />
        </Pressable>
        <View className="flex-1">
          <Text className="font-serif text-[28px] text-primary leading-tight">
            Global Chat
          </Text>
          <View className="flex-row items-center gap-sm">
            <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
              Anonymous community chat
            </Text>
            {!connected ? (
              <WifiOff color="#d78357" size={14} />
            ) : null}
          </View>
        </View>
      </View>

      {messagesQuery.isPending ? (
        <View className="flex-1 items-center justify-center gap-md px-lg">
          <Skeleton className="h-12 w-3/4 rounded-3xl" />
          <Skeleton className="h-12 w-1/2 rounded-3xl" />
          <Skeleton className="h-12 w-2/3 rounded-3xl" />
        </View>
      ) : (
        <FlatList
          className="flex-1 px-lg"
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 16 }}
          data={allMessages}
          extraData={liveMessages}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-lg px-xl">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-accent-subtle">
                <MessageCircle color="#d78357" size={30} />
              </View>
              <Text className="font-serif text-[26px] text-foreground text-center">
                Welcome to Global Chat
              </Text>
              <Text className="font-sans text-caption text-foreground-muted text-center max-w-xs">
                Messages are anonymous. Be kind and respectful. No personal
                information or links allowed.
              </Text>
            </View>
          }
          ListFooterComponent={
            sendMutation.isPending ? (
              <View className="self-end max-w-[86%]">
                <View className="rounded-3xl rounded-br-lg bg-primary/70 px-lg py-md">
                  <Text className="font-sans text-body text-primary-foreground/70">
                    Sending...
                  </Text>
                </View>
              </View>
            ) : null
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ref={flatListRef}
          renderItem={({ item }) => {
            const sessionUserId = session?.user?.id ?? "";
            return (
              <MessageBubble
                isOwn={item.authorId === sessionUserId}
                item={item}
              />
            );
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-end gap-sm border-border border-t bg-background-elevated px-lg py-md">
          <View className="flex-1">
            <Input
              className="max-h-28 border-0 shadow-none"
              inputContainerClassName="rounded-3xl border border-border/70 pl-lg bg-background"
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              placeholder="Type a message..."
              returnKeyType="send"
              value={input}
            />
          </View>
          {input.trim() ? (
            <Pressable
              accessibilityLabel="Send message"
              className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-primary"
              onPress={handleSend}
            >
              <Send color="#fffdf9" size={19} />
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      <ToastContainer />
    </View>
  );
}
