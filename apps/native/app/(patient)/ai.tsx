"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Stethoscope,
  StopCircle,
} from "lucide-react-native";
import {
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
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
import { showToast } from "@/components/design/ui/toast";
import { _client, orpc, queryClient } from "@/utils/orpc";
import { useSpeechToText } from "@/utils/use-speech-to-text";

interface ChatMessage {
  agent?: string;
  content: string;
  id: string;
  role: "assistant" | "tool_call" | "user";
  actionCards?: ActionCard[];
  toolName?: string;
}

interface ActionCard {
  description?: string;
  kind: "appointment" | "availability" | "doctor" | "hospital";
  params?: Record<string, string>;
  route: string;
  title: string;
}

interface StreamData {
  agent?: string;
  cards?: ActionCard[];
  id?: string;
  message?: string;
  token?: string;
  tool?: string;
}

interface ToolCallState {
  id: string;
  name: string;
  status: "done" | "pending";
}

interface StreamAccumulator {
  content: string;
  messageId: string;
}

const TOOL_LABELS: Record<string, string> = {
  list_available_doctors: "Finding available doctors",
  search_doctors: "Searching for doctors",
  search_hospitals: "Finding nearby hospitals",
  get_doctor_profile: "Loading doctor profile",
  check_availability: "Checking availability",
  get_upcoming_sessions: "Looking up your appointments",
  transfer_to_agent: "Finding the right care",
};

function formatToolName(tool: string): string {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, " ");
}

function SpinningLoader() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [rotation]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: rotation.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            }),
          },
        ],
      }}
    >
      <Loader2 color="#d78357" size={14} />
    </Animated.View>
  );
}

function FinishedDot() {
  return <View className="h-3.5 w-3.5 rounded-full bg-accent" />;
}

function buildCardHref(card: ActionCard): string {
  const params = card.params ? new URLSearchParams(card.params).toString() : "";
  return params ? `${card.route}?${params}` : card.route;
}

function renderInlineMarkdown(text: string, baseClassName: string) {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <Text className={`${baseClassName} font-poppins-semibold`} key={`${index}:${match[1]}`}>
        {match[1]}
      </Text>
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function MarkdownMessage({
  text,
  className,
}: {
  className: string;
  text: string;
}) {
  const lines = text.split(/\r?\n/);

  return (
    <View className="gap-2">
      {lines.map((line, lineIndex) => {
        const bullet = line.match(/^\s*[*-]\s+(.+)$/);
        const content = bullet ? bullet[1] : line;
        return (
          <View className="flex-row items-start gap-2" key={`${lineIndex}:${line}`}>
            {bullet ? <Text className={`${className} mt-[1px]`}>•</Text> : null}
            <Text className={className}>{renderInlineMarkdown(content, className)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const SUGGESTED_PROMPTS = [
  {
    icon: Stethoscope,
    label: "Find the right doctor",
    prompt: "Help me find a doctor for frequent headaches",
  },
  {
    icon: Calendar,
    label: "Check my appointments",
    prompt: "What appointments do I have coming up?",
  },
  {
    icon: MapPin,
    label: "Find care near me",
    prompt: "Show me trusted care options nearby",
  },
] as const;

function EmptyConversation({
  onPrompt,
}: {
  onPrompt: (prompt: string) => void;
}) {
  return (
    <Reveal className="flex-1 gap-huge pt-12" delay={60}>
      <View className="relative overflow-hidden rounded-[32px] bg-primary px-xl py-xxl">
        <View className="absolute -top-12 -right-8 h-36 w-36 rounded-full bg-accent/25" />
        <View className="gap-md">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/10">
            <Sparkles color="#fbf7f0" size={23} />
          </View>
          <Text className="max-w-72 font-serif text-[34px] text-primary-foreground leading-tight">
            What can I help you understand?
          </Text>
          <Text className="max-w-72 font-sans text-caption text-primary-foreground/75 leading-relaxed">
            Ask naturally. Suwa can explain, search for care, and open results
            as cards you can tap.
          </Text>
        </View>
      </View>

      <View className="gap-md">
        <Text className="font-poppins-medium text-foreground-muted text-micro uppercase tracking-widest">
          Try asking
        </Text>
        {SUGGESTED_PROMPTS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center gap-md rounded-2xl border border-border/70 bg-background-elevated px-lg py-md"
              key={suggestion.label}
              onPress={() => onPrompt(suggestion.prompt)}
              style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle">
                <Icon color="#315b4d" size={19} />
              </View>
              <Text className="flex-1 font-poppins-medium text-caption text-foreground">
                {suggestion.label}
              </Text>
              <Text className="font-serif text-accent text-lg">+</Text>
            </Pressable>
          );
        })}
      </View>
    </Reveal>
  );
}

function ThinkingState() {
  return (
    <View className="mb-lg self-start rounded-3xl border border-border/60 bg-background-elevated p-lg">
      <View className="flex-row items-center gap-md">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent-subtle">
          <Sparkles color="#d78357" size={17} />
        </View>
        <View className="gap-xs">
          <Text className="font-poppins-medium text-caption text-foreground">
            Suwa is thinking
          </Text>
          <View className="flex-row gap-xs">
            <Skeleton className="h-1.5 w-5 rounded-full" />
            <Skeleton className="h-1.5 w-8 rounded-full" />
            <Skeleton className="h-1.5 w-4 rounded-full" />
          </View>
        </View>
      </View>
    </View>
  );
}

function applyStreamEvent(
  streamEvent: { data: StreamData; event: string },
  accumulator: StreamAccumulator,
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  setToolCalls: Dispatch<SetStateAction<ToolCallState[]>>
) {
  const data = streamEvent.data;

  switch (streamEvent.event) {
    case "message.start": {
      setToolCalls([]);
      accumulator.content = "";
      accumulator.messageId = crypto.randomUUID();
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          agent: data.agent,
          content: "",
          id: accumulator.messageId,
          role: "assistant",
        },
      ]);
      break;
    }
    case "message.token": {
      accumulator.content += data.token ?? "";
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === accumulator.messageId
            ? {
                ...message,
                agent: data.agent,
                content: accumulator.content,
              }
            : message
        )
      );
      break;
    }
    case "message.tool_call": {
      const tool = data.tool as string | undefined;
      if (tool) {
        const id = data.id || crypto.randomUUID();
        setToolCalls((prev) => [...prev, { id, name: tool, status: "pending" }]);
      }
      break;
    }
    case "message.tool_result": {
      const tool = data.tool as string | undefined;
      const id = data.id as string | undefined;
      if (tool || id) {
        setToolCalls((prev) =>
          prev.map((item) =>
            id
              ? item.id === id
                ? { ...item, status: "done" }
                : item
              : item.name === tool && item.status === "pending"
                ? { ...item, status: "done" }
                : item
          )
        );
      }
      break;
    }
    case "message.cards": {
      const cards = data.cards as ActionCard[] | undefined;
      if (cards?.length) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === accumulator.messageId
              ? { ...message, actionCards: cards }
              : message
          )
        );
      }
      break;
    }
    case "message.error": {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          content: "I hit a small snag. Please try that question again.",
          id: crypto.randomUUID(),
          role: "assistant",
        },
      ]);
      break;
    }
    default:
      break;
  }
}

function ChatBubble({ item }: { item: ChatMessage }) {
  const router = useRouter();
  const isUser = item.role === "user";
  const actionCards = item.actionCards ?? [];

  if (!isUser && !item.content.trim() && actionCards.length === 0) {
    return null;
  }

  const bubbleClass = isUser
    ? "self-end rounded-br-lg bg-primary"
    : "self-start rounded-bl-lg border border-border/60 bg-background-elevated";

  return (
    <Reveal delay={20}>
      <View className={`max-w-[86%] rounded-3xl ${bubbleClass} p-md`}>
        {isUser ? null : (
          <View className="flex-row items-center gap-sm">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle">
              <Sparkles color="#315b4d" size={13} />
            </View>
            <Text className="font-poppins-medium text-micro uppercase tracking-widest text-primary">
              Suwa
            </Text>
          </View>
        )}
        {item.content.trim() ? (
          isUser ? (
            <Text
              className={`font-sans text-body leading-relaxed ${isUser ? "text-primary-foreground" : "text-foreground-secondary"}`}
            >
              {item.content}
            </Text>
          ) : (
            <MarkdownMessage
              className="font-sans text-body leading-relaxed text-foreground-secondary"
              text={item.content}
            />
          )
        ) : null}
        {!isUser && actionCards.length ? (
          <View className="mt-md gap-sm">
            {actionCards.map((card, index) => {
              const Icon =
                card.kind === "hospital"
                  ? MapPin
                  : card.kind === "appointment"
                    ? Calendar
                    : card.kind === "availability"
                      ? Sparkles
                      : Stethoscope;
              const iconBgColor =
                card.kind === "hospital" ? "bg-accent-subtle" : "bg-primary-subtle";
              const iconColor = card.kind === "hospital" ? "#d78357" : "#315b4d";

              return (
                <Pressable
                  className="rounded-3xl border border-border/60 bg-background-elevated p-5 shadow-sm"
                  key={`${card.route}-${card.title}-${card.params?.date ?? index}`}
                  onPress={() => router.push(buildCardHref(card) as never)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
                >
                  <View className="flex-row items-start gap-4">
                    <View className={`h-12 w-12 items-center justify-center rounded-2xl ${iconBgColor}`}>
                      <Icon color={iconColor} size={18} />
                    </View>
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="flex-1 font-poppins-medium text-foreground text-subtitle leading-snug">
                          {card.title}
                        </Text>
                        <ChevronRight className="text-foreground-muted" size={16} />
                      </View>
                      {card.description ? (
                        <Text className="font-sans text-caption text-foreground-secondary leading-relaxed">
                          {card.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </Reveal>
  );
}

export default function AiChatScreen() {
  const router = useRouter();
  const { message: initialMessage } = useLocalSearchParams<{
    message?: string;
  }>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCallState[]>([]);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);
  const submitLockRef = useRef(false);
  const hasAutoSent = useRef(false);
  const { isListening, isSupported, startListening, stopListening } = useSpeechToText();

  const createMutation = useMutation(
    orpc.ai.chat.create.mutationOptions({
      onSuccess: (session) => {
        setActiveSessionId(session.id);
        queryClient.invalidateQueries({ queryKey: ["ai"] });
      },
    }) as never
  ) as any;

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride ?? input.trim();
    if (!text || streaming || submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setInput("");

    let sessionId: string | null = activeSessionId;
    if (!sessionId) {
      const session = await createMutation.mutateAsync({
        title: text.slice(0, 50),
      });
      sessionId = session.id;
    }
    if (!sessionId) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { content: text, id: crypto.randomUUID(), role: "user" },
    ]);
    setStreaming(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const iterator = await _client.ai.chat.send(
        { message: text, sessionId },
        { signal: abortController.signal }
      );
      const accumulator: StreamAccumulator = { content: "", messageId: "" };

      for await (const event of iterator) {
        const streamEvent = event as { data: StreamData; event: string };
        applyStreamEvent(streamEvent, accumulator, setMessages, setToolCalls);
      }
      queryClient.invalidateQueries({ queryKey: ["ai"] });
    } catch (error: unknown) {
      const isAbortError =
        error instanceof Error && error.name === "AbortError";
      if (!isAbortError) {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            content: "I could not finish that response. Please try again.",
            id: crypto.randomUUID(),
            role: "assistant",
          },
        ]);
      }
    } finally {
      setStreaming(false);
      setToolCalls([]);
      abortRef.current = null;
      submitLockRef.current = false;
    }
  };

  const sendInitialMessage = useEffectEvent((message: string) => {
    sendMessage(message);
  });

  useEffect(() => {
    if (initialMessage && !hasAutoSent.current) {
      hasAutoSent.current = true;
      sendInitialMessage(initialMessage);
    }
  }, [initialMessage]);

  const startNewConversation = () => {
    abortRef.current?.abort();
    setMessages([]);
    setActiveSessionId(null);
    setInput("");
    setToolCalls([]);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false, title: getScreenTitle("native:patient:ai") }} />
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
            Ask Suwa
          </Text>
          <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
            Your private health guide
          </Text>
        </View>
        {messages.length > 0 ? (
          <Pressable
            accessibilityLabel="Start a new conversation"
            className="h-11 w-11 items-center justify-center rounded-full bg-primary-subtle"
            onPress={startNewConversation}
          >
            <RotateCcw color="#315b4d" size={18} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        className="flex-1 px-lg"
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
        data={messages}
        keyboardDismissMode="on-drag"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyConversation onPrompt={(prompt) => sendMessage(prompt)} />
        }
        ListFooterComponent={
          streaming ? (
            <View className="gap-sm">
              {toolCalls.length ? (
                <View className="mb-lg self-start rounded-3xl border border-border/60 bg-background-elevated px-lg py-md">
                  {toolCalls.map((tool) => (
                    <View className="flex-row items-center gap-sm py-0.5" key={tool.id}>
                      {tool.status === "pending" ? <SpinningLoader /> : <FinishedDot />}
                      <Text className="font-sans text-micro text-foreground-muted">
                        {formatToolName(tool.name)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <ThinkingState />
            </View>
          ) : null
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ref={flatListRef}
        renderItem={({ item }) => <ChatBubble item={item} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-end gap-sm border-border border-t bg-background-elevated px-lg py-md">
          <View className="flex-1">
            <Input
              className="max-h-28 border-0 shadow-none"
              inputContainerClassName={`rounded-3xl border border-border/70 pl-lg pr-xs ${isListening ? "bg-accent/10" : "bg-background"}`}
              onChangeText={setInput}
              onSubmitEditing={() => {
                if (input.trim() && !streaming) {
                  void sendMessage();
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Enter" && input.trim() && !streaming) {
                  void sendMessage();
                }
              }}
              placeholder="Ask Suwa anything..."
              returnKeyType="send"
              rightIcon={
                <Pressable
                  accessibilityLabel={
                    isListening ? "Stop voice input" : "Start voice input"
                  }
                  hitSlop={8}
                  onPress={() => {
                    if (!isSupported) {
                      showToast({
                        message: "Your browser does not support speech recognition.",
                        title: "Voice input unavailable",
                        type: "warning",
                      });
                      return;
                    }
                    if (isListening) {
                      stopListening();
                      return;
                    }
                    startListening();
                  }}
                >
                  {isListening ? (
                    <MicOff color="#d78357" size={20} />
                  ) : (
                    <Mic color="#8e9a94" size={20} />
                  )}
                </Pressable>
              }
              value={input}
            />
          </View>
          {input.trim() || streaming ? (
            <Pressable
              accessibilityLabel={streaming ? "Stop response" : "Send message"}
              className={`mb-1 h-12 w-12 items-center justify-center rounded-full ${streaming ? "bg-accent" : "bg-primary"}`}
              onPress={
                streaming
                  ? () => abortRef.current?.abort()
                  : () => sendMessage()
              }
            >
              {streaming ? (
                <StopCircle color="#fffdf9" size={20} />
              ) : (
                <Send color="#fffdf9" size={19} />
              )}
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
