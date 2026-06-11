import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, MessageCircle, SendHorizonal, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "@/components/ui/toast";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const LOCAL_STORAGE_KEY = "chat_local_messages";

interface DoctorSuggestion {
  id: string;
  name: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  doctors?: DoctorSuggestion[];
}

const SUGGESTIONS = [
  "I've been feeling anxious lately",
  "I need help managing stress",
  "I'm having trouble sleeping",
  "I want to talk to someone about burnout",
];

const MAX_MODAL_HEIGHT = 540;

async function loadLocalMessages(): Promise<ChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveLocalMessages(messages: ChatMessage[]) {
  try {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Silently fail — local storage is best-effort
  }
}

async function clearLocalMessages() {
  try {
    await AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

export function ChatOverlay() {
  const router = useRouter();
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useAuth();

  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const hasMessages = messages.length > 0;
  const authReady = isLoaded;
  const showSignInPrompt = authReady && !isSignedIn && hasMessages;

  const historyQuery = useQuery(
    orpc.getChatHistory.queryOptions({
      enabled: visible && !!isSignedIn,
      retry: false,
      meta: { ignoreError: true },
    })
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (isSignedIn) {
      if (historyQuery.data?.messages) {
        setMessages(historyQuery.data.messages as ChatMessage[]);
      }
    } else {
      loadLocalMessages().then(setMessages);
    }
  }, [visible, isSignedIn, historyQuery.data]);

  const clearHistoryMutation = useMutation(
    orpc.clearChatHistory.mutationOptions({
      onSuccess: () => {
        setMessages([]);
        toast({ type: "info", title: "Chat history cleared" });
      },
      onError: () => {
        toast({ type: "error", title: "Failed to clear history" });
      },
    })
  );

  const closeChat = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setVisible(false);
  }, []);

  const handleBookDoctor = useCallback(
    (doctorId: string) => {
      closeChat();
      setTimeout(() => {
        router.push(`/doctors/${doctorId}/booking`);
      }, 400);
    },
    [closeChat, router]
  );

  const handleSignIn = useCallback(() => {
    closeChat();
    setTimeout(() => {
      router.push("/sign-in");
    }, 400);
  }, [closeChat, router]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) {
      return;
    }

    setInput("");
    setStreaming(true);

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const iterator = await orpc.chatPatient.call({
        chatId: "default",
        messages: updatedMessages.map((m) => ({
          id: crypto.randomUUID(),
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
        })),
      });

      let accumulatedText = "";
      let pendingDoctors: DoctorSuggestion[] = [];

      const cancel = consumeEventIterator(iterator, {
        onEvent: (data: unknown) => {
          const event = data as {
            type: "text-delta" | "doctor-suggestions";
            text?: string;
            doctors?: DoctorSuggestion[];
          };
          if (event.type === "text-delta" && event.text) {
            accumulatedText += event.text;
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (next[lastIdx]?.role === "assistant") {
                next[lastIdx] = {
                  role: "assistant",
                  content: accumulatedText,
                };
              }
              return next;
            });
          }
          if (event.type === "doctor-suggestions" && event.doctors) {
            pendingDoctors = event.doctors;
          }
        },
        onFinish: () => {
          setStreaming(false);
          const finalMessages = [...updatedMessages];
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: accumulatedText,
          };
          if (pendingDoctors.length > 0) {
            assistantMsg.doctors = pendingDoctors;
          }
          finalMessages.push(assistantMsg);
          setMessages(finalMessages);
          if (!isSignedIn) {
            saveLocalMessages(finalMessages);
          }
        },
        onError: () => {
          setStreaming(false);
        },
      });

      cancelRef.current = cancel;
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      toast({
        type: "error",
        title: "Chat error",
        message: "Failed to get response. Please try again.",
      });
      setStreaming(false);
    }
  }, [input, messages, streaming, toast, isSignedIn]);

  const handleClearHistory = useCallback(() => {
    if (isSignedIn) {
      if (clearHistoryMutation.isPending) {
        return;
      }
      clearHistoryMutation.mutate({});
    } else {
      clearLocalMessages();
      setMessages([]);
      toast({ type: "info", title: "Chat cleared" });
    }
  }, [clearHistoryMutation, isSignedIn, toast]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (visible) {
      scrollToEnd();
    }
  }, [visible, messages, scrollToEnd]);

  return (
    <>
      {/* Chat Button */}
      <Pressable
        onPress={() => setVisible(true)}
        className="absolute bottom-28 right-6 z-50 h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.primary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <MessageCircle color="#fff" size={26} strokeWidth={2} />
      </Pressable>

      {/* Chat Modal — bottom sheet style */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={closeChat}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={closeChat}>
          <Pressable onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="overflow-hidden rounded-t-[2rem] bg-background"
              style={{ maxHeight: MAX_MODAL_HEIGHT }}
            >
              {/* Header */}
              <View
                className="flex-row items-center justify-between border-b-[3px] border-border px-page pb-4"
                style={{ paddingTop: insets.top + 12 }}
              >
                <View className="flex-1">
                  <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
                    Ask a Doctor
                  </Text>
                  <Text className="font-medium font-sans text-muted-foreground text-xs">
                    Get matched with the right specialist
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {hasMessages && (
                    <Pressable
                      onPress={handleClearHistory}
                      className="rounded-control border-2 border-border bg-card px-3 py-1.5"
                    >
                      <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                        Clear
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={closeChat}
                    className="rounded-full border-2 border-border bg-card p-2"
                  >
                    <X color={colors.foreground} size={18} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              {/* Sign-in prompt for non-signed-in users with history */}
              {showSignInPrompt && (
                <View className="mx-page mt-3 flex-row items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/10 px-4 py-3">
                  <View className="flex-1">
                    <Text className="font-bold font-sans text-foreground text-xs">
                      Sign in to save your chat history
                    </Text>
                    <Text className="font-medium font-sans text-muted-foreground text-[10px]">
                      Your current messages are saved on this device only
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleSignIn}
                    className="rounded-lg bg-primary px-4 py-2"
                  >
                    <Text className="font-bold font-sans text-primary-foreground text-xs">
                      Sign In
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Messages */}
              <ScrollView
                ref={scrollRef}
                className="flex-1 px-page"
                contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
              >
                {!hasMessages && !streaming ? (
                  <View className="flex-1 items-center justify-center gap-4 px-8">
                    <View className="h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-border bg-card">
                      <MessageCircle
                        color={colors.primary}
                        size={32}
                        strokeWidth={2}
                      />
                    </View>
                    <Text className="text-center font-bold font-sans text-foreground text-lg">
                      {isSignedIn ? "How can we help you?" : "Ask a question"}
                    </Text>
                    <Text className="text-center font-medium font-sans text-muted-foreground text-sm leading-relaxed">
                      {isSignedIn
                        ? "Describe how you're feeling and we'll recommend the right doctor for you."
                        : "Describe how you're feeling and we'll recommend a doctor. Sign in to save your chat history."}
                    </Text>
                    {!isSignedIn && (
                      <Pressable
                        onPress={handleSignIn}
                        className="rounded-xl border-2 border-primary bg-primary px-6 py-3"
                      >
                        <Text className="font-bold font-sans text-primary-foreground text-sm">
                          Sign In to Get Started
                        </Text>
                      </Pressable>
                    )}
                    <View className="mt-2 w-full gap-2">
                      {SUGGESTIONS.map((suggestion) => (
                        <Pressable
                          key={suggestion}
                          onPress={() => setInput(suggestion)}
                          className="rounded-card border-2 border-border/60 bg-card/50 px-4 py-3"
                        >
                          <Text className="font-medium font-sans text-foreground/80 text-sm">
                            {suggestion}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View className="gap-4">
                    {messages.map((msg, index) => (
                      <View
                        key={index}
                        className={`max-w-[85%] rounded-card border-2 px-4 py-3 ${
                          msg.role === "user"
                            ? "self-end border-primary bg-primary/10"
                            : "self-start border-border bg-card"
                        }`}
                      >
                        <Text
                          className={`font-medium font-sans text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "text-foreground"
                              : "text-foreground/90"
                          }`}
                        >
                          {msg.content}
                          {index === messages.length - 1 &&
                            msg.role === "assistant" &&
                            streaming && (
                              <Text className="text-primary"> ▊</Text>
                            )}
                        </Text>
                        {msg.role === "assistant" &&
                          msg.doctors &&
                          msg.doctors.length > 0 &&
                          !streaming && (
                            <View className="mt-3 gap-2">
                              {msg.doctors.map((doctor) => (
                                <Pressable
                                  key={doctor.id}
                                  onPress={() =>
                                    handleBookDoctor(doctor.id)
                                  }
                                  className="flex-row items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5"
                                >
                                  <Calendar
                                    color={colors.primary}
                                    size={16}
                                    strokeWidth={2}
                                  />
                                  <Text className="font-bold font-sans text-primary text-xs">
                                    Book {doctor.name}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View
                className="flex-row items-end gap-2 border-t-[3px] border-border px-page pt-3"
                style={{ paddingBottom: insets.bottom + 12 }}
              >
                <View className="flex-1 rounded-card border-2 border-border bg-card">
                  <TextInput
                    className="max-h-24 px-4 py-3 font-medium font-sans text-foreground text-sm"
                    placeholder="Describe your concerns..."
                    placeholderTextColor={colors.mutedForeground}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    onSubmitEditing={handleSend}
                    blurOnSubmit
                    editable={!streaming}
                  />
                </View>
                <Pressable
                  onPress={handleSend}
                  disabled={!input.trim() || streaming}
                  className="h-12 w-12 items-center justify-center rounded-card border-2 border-border bg-card"
                  style={{
                    opacity: !input.trim() || streaming ? 0.4 : 1,
                  }}
                >
                  <SendHorizonal
                    color={colors.primary}
                    size={20}
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function consumeEventIterator(
  iterator: AsyncIterable<unknown>,
  handlers: {
    onEvent: (data: unknown) => void;
    onFinish?: () => void;
    onError?: (error: unknown) => void;
  }
): () => void {
  let cancelled = false;

  const run = async () => {
    try {
      for await (const event of iterator) {
        if (cancelled) {
          break;
        }
        handlers.onEvent(event);
      }
      if (!cancelled) {
        handlers.onFinish?.();
      }
    } catch (error) {
      if (!cancelled) {
        handlers.onError?.(error);
      }
    }
  };

  run();

  return () => {
    cancelled = true;
    (iterator as unknown as AsyncIterator<unknown>).return?.();
  };
}
