"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Brain,
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
  type Dispatch,
  type SetStateAction,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
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
import { showToast } from "@/components/design/ui/toast";
import { _client, orpc, queryClient } from "@/utils/orpc";
import { useSpeechToText } from "@/utils/use-speech-to-text";

interface ChatMessage {
  agent?: string;
  content: string;
  id: string;
  role: "assistant" | "tool_call" | "user";
  questionCards?: QuestionCard[];
  toolName?: string;
}

interface QuestionCard {
  answer: string;
  title: string;
}

interface StreamData {
  agent?: string;
  cards?: QuestionCard[];
  message?: string;
  token?: string;
  tool?: string;
}

interface StreamAccumulator {
  content: string;
  messageId: string;
}

const TOOL_LABELS: Record<string, string> = {
  search_doctors: "Searching for doctors",
  search_hospitals: "Finding nearby hospitals",
  get_doctor_profile: "Loading doctor profile",
  check_availability: "Checking availability",
  get_upcoming_sessions: "Looking up your sessions",
  transfer_to_agent: "Finding the right specialist",
};

function formatToolName(tool: string): string {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, " ");
}

function extractQuestionText(content: string): string {
  const payload = parseQuestionPayload(content);
  if (payload) {
    return payload.question;
  }

  const trimmed = content.trim();
  const jsonBlock = trimmed.match(/^```json\s*([\s\S]*?)\s*```$/i);
  const bracketStart = trimmed.indexOf("[");
  const prose = jsonBlock
    ? trimmed.replace(jsonBlock[0], "").trim()
    : bracketStart >= 0
      ? trimmed.slice(0, bracketStart).trim()
      : trimmed;
  if (prose) {
    return prose;
  }

  const cards = parseQuestionCards(content);
  if (cards?.length) {
    return `Which of these best matches what you need?`;
  }

  return "Which option should we use?";
}

function parseQuestionPayload(content: string): {
  answers: QuestionCard[];
  question: string;
} | null {
  const trimmed = content.trim();
  const jsonBlock = trimmed.match(/^```json\s*([\s\S]*?)\s*```$/i);
  const candidate = jsonBlock?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const answers = Array.isArray(record.answers)
      ? record.answers
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }
            const answerRecord = item as Record<string, unknown>;
            const title =
              typeof answerRecord.title === "string"
                ? answerRecord.title.trim()
                : "";
            const answer =
              typeof answerRecord.answer === "string"
                ? answerRecord.answer.trim()
                : "";
            return title && answer ? { title, answer } : null;
          })
          .filter((item): item is QuestionCard => item !== null)
      : [];

    return question && answers.length === 4 ? { question, answers } : null;
  } catch {
    return null;
  }
}

function parseQuestionCards(content: string): QuestionCard[] | null {
  const payload = parseQuestionPayload(content);
  if (payload) {
    return payload.answers;
  }

  const trimmed = content.trim();
  const jsonBlock = trimmed.match(/^```json\s*([\s\S]*?)\s*```$/i);
  const bracketStart = trimmed.indexOf("[");
  const bracketEnd = trimmed.lastIndexOf("]");
  const candidate =
    jsonBlock?.[1]?.trim() ??
    (bracketStart >= 0 && bracketEnd > bracketStart
      ? trimmed.slice(bracketStart, bracketEnd + 1)
      : trimmed);

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("Not an array");
    }

    const cards = parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const title = typeof record.title === "string" ? record.title.trim() : "";
        const answer =
          typeof record.answer === "string"
            ? record.answer.trim()
            : typeof record.question === "string"
              ? record.question.trim()
              : "";

        if (!title || !answer) {
          return null;
        }

        return { title, answer } satisfies QuestionCard;
      })
      .filter((card): card is QuestionCard => card !== null);

    return cards.length === 4 ? cards : null;
  } catch {
    const objectMatches = candidate.match(/\{[\s\S]*?\}/g);
    if (!objectMatches || objectMatches.length !== 4) {
      return null;
    }

    const cards = objectMatches
      .map((item) => {
        try {
          const record = JSON.parse(item) as Record<string, unknown>;
          const title =
            typeof record.title === "string" ? record.title.trim() : "";
          const answer =
            typeof record.answer === "string"
              ? record.answer.trim()
              : typeof record.question === "string"
                ? record.question.trim()
                : "";

          if (!title || !answer) {
            return null;
          }

          return { title, answer } satisfies QuestionCard;
        } catch {
          return null;
        }
      })
      .filter((card): card is QuestionCard => card !== null);

    return cards.length === 4 ? cards : null;
  }
}

const SUGGESTED_PROMPTS = [
  {
    icon: Stethoscope,
    label: "Find the right doctor",
    prompt: "Help me find a doctor for frequent headaches",
  },
  {
    icon: Brain,
    label: "Understand my stress",
    prompt: "What can I do to lower my stress today?",
  },
  {
    icon: MapPin,
    label: "Care near me",
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
            Ask naturally. Suwa can explain, search for care, and help you find
            your next step.
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
  setPendingChoices: Dispatch<SetStateAction<QuestionCard[] | null>>,
  setToolCalls: Dispatch<SetStateAction<string[]>>
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
        setToolCalls((prev) => [...prev, tool]);
      }
      break;
    }
    case "message.question_cards": {
      const cards = data.cards as QuestionCard[] | undefined;
      if (cards?.length) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === accumulator.messageId
              ? { ...message, questionCards: cards }
              : message
          )
        );
        setPendingChoices(cards);
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
  const isUser = item.role === "user";
  const bubbleClass = isUser
    ? "self-end rounded-br-lg bg-primary"
    : "self-start rounded-bl-lg border border-border/60 bg-background-elevated";

  return (
    <Reveal delay={20}>
      <View className={`mb-lg max-w-[86%] rounded-3xl ${bubbleClass} p-md`}>
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
        <Text
          className={`font-sans text-body leading-relaxed ${isUser ? "text-primary-foreground" : "text-foreground-secondary"}`}
        >
          {item.content}
        </Text>
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
  const [pendingChoices, setPendingChoices] = useState<QuestionCard[] | null>(null);
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasAutoSent = useRef(false);
  const { isListening, isSupported, startListening, stopListening } = useSpeechToText();

  const createMutation = useMutation(
    orpc.ai.chat.create.mutationOptions({
      onSuccess: (session) => {
        setActiveSessionId(session.id);
        queryClient.invalidateQueries({ queryKey: ["ai"] });
      },
    })
  );

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride ?? input.trim();
    if (!text || streaming) {
      return;
    }
    setInput("");

    let sessionId = activeSessionId;
    if (!sessionId) {
      const session = await createMutation.mutateAsync({
        title: text.slice(0, 50),
      });
      sessionId = session.id;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { content: text, id: crypto.randomUUID(), role: "user" },
    ]);
    setPendingChoices(null);
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
        applyStreamEvent(streamEvent, accumulator, setMessages, setPendingChoices, setToolCalls);
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
    }
  };

  const chooseCard = (choice: QuestionCard) => {
    setPendingChoices(null);
    setInput("");
    void sendMessage(choice.answer);
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
    setPendingChoices(null);
    setToolCalls([]);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
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
                    <View className="flex-row items-center gap-sm py-0.5" key={tool}>
                      <Loader2 className="text-accent" size={14} />
                      <Text className="font-sans text-micro text-foreground-muted">
                        {formatToolName(tool)}…
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

      {pendingChoices?.length ? (
        <View className="px-lg pb-2">
          <View className="gap-sm rounded-3xl border border-border/60 bg-background-elevated p-md">
            <Text className="font-poppins-medium text-micro uppercase tracking-widest text-foreground-muted">
              Select an answer
            </Text>
            <View className="gap-sm">
              {pendingChoices.map((choice) => (
                <Pressable
                  accessibilityRole="button"
                  className="rounded-2xl border border-border bg-background px-md py-md"
                  key={choice.title}
                  onPress={() => chooseCard(choice)}
                >
                  <Text className="font-poppins-medium text-caption text-foreground">
                    {choice.title}
                  </Text>
                  <Text className="mt-1 font-sans text-micro text-foreground-muted">
                    {choice.answer}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* Hospital suggestion card */}
      {!pendingChoices && !streaming && messages.length > 0 ? (
        (() => {
          const lastMsg = messages.filter((m) => m.role === "assistant").at(-1);
          const text = lastMsg?.content ?? "";
          const mentionsHospital =
            !lastMsg?.questionCards?.length &&
            /\b(hospital|medical centre|medical center|clinic)\b/i.test(text);
          if (!mentionsHospital) {
            return null;
          }
          return (
            <View className="px-lg pb-2">
              <Pressable
                className="flex-row items-center gap-md rounded-3xl border border-border/60 bg-background-elevated p-md"
                onPress={() => router.push("/(patient)/map")}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
                  <MapPin color="#d78357" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="font-poppins-medium text-caption text-foreground">
                    Find nearby hospitals
                  </Text>
                  <Text className="font-sans text-micro text-foreground-muted">
                    View hospitals on the map
                  </Text>
                </View>
                <Text className="font-serif text-accent text-lg">+</Text>
              </Pressable>
            </View>
          );
        })()
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-end gap-sm border-border border-t bg-background-elevated px-lg py-md">
          <View className="flex-1">
            <Input
              className="max-h-28 border-0 shadow-none"
              inputContainerClassName={`rounded-3xl border border-border/70 pl-lg pr-xs ${isListening ? "bg-accent/10" : "bg-background"}`}
              multiline
              onChangeText={setInput}
              placeholder="Ask Suwa anything..."
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
