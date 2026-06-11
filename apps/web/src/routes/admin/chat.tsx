import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent } from "@zen-doc/ui/components/card";
import {
  Bot,
  Calendar,
  RotateCcw,
  MessageCircle,
  SendHorizonal,
  ShieldIcon,
  Sparkles,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { orpc } from "@/utils/orpc";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  doctors?: Array<{ id: string; name: string }>;
}

const SUGGESTIONS = [
  "I've been feeling anxious lately",
  "I need help managing stress",
  "What doctors specialize in sleep disorders?",
  "Find me a therapist for relationship counseling",
];

export const Route = createFileRoute("/admin/chat")({
  component: AdminChatPage,
});

function AdminChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const cancelRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;
  const isAdmin = user?.publicMetadata?.role === "admin";

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-slot='scroll-area-viewport']"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

    const controller = new AbortController();
    cancelRef.current = controller;

    try {
      const iterator = await orpc.chatPatient.call(
        {
          chatId: "admin-test",
          messages: updatedMessages.map((m) => ({
            id: crypto.randomUUID(),
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content }],
          })),
        },
        { signal: controller.signal }
      );

      let accumulatedText = "";
      let pendingDoctors: Array<{ id: string; name: string }> = [];

      for await (const event of iterator) {
        if (controller.signal.aborted) {
          break;
        }
        const chunk = event as {
          type: "text-delta" | "doctor-suggestions";
          text?: string;
          doctors?: Array<{ id: string; name: string }>;
        };
        if (chunk.type === "text-delta" && chunk.text) {
          accumulatedText += chunk.text;
          setMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (next[lastIdx]?.role === "assistant") {
              next[lastIdx] = { role: "assistant", content: accumulatedText };
            }
            return next;
          });
        }
        if (chunk.type === "doctor-suggestions" && chunk.doctors) {
          pendingDoctors = chunk.doctors;
        }
      }

      if (pendingDoctors.length > 0) {
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (next[lastIdx]?.role === "assistant") {
            next[lastIdx] = {
              role: "assistant",
              content: accumulatedText,
              doctors: pendingDoctors,
            };
          }
          return next;
        });
      }
    } catch {
      if (!controller.signal.aborted) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      cancelRef.current = null;
    }
  }, [input, messages, streaming]);

  const handleClear = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.abort();
      cancelRef.current = null;
    }
    setMessages([]);
    setStreaming(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 inline-flex rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <h2 className="mb-2 font-semibold text-xl tracking-tight">
              Unauthorized
            </h2>
            <p className="text-muted-foreground text-sm">
              You do not have admin access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col gap-6">
      <Card className="shrink-0 overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Admin console</Badge>
              <Badge variant="secondary">AI Chat</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="font-semibold text-4xl tracking-tight">
                  AI Chat Test
                </h1>
                <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                  Test the AI doctor recommendation chat assistant.
                </p>
              </div>

              {hasMessages && (
                <Button onClick={handleClear} size="sm" variant="outline">
                  <RotateCcw className="mr-2 size-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        <div className="flex-1 bg-muted/20 h-[80vh] overflow-y-auto">
          {!hasMessages && !streaming ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-24">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl border-[3px] border-border bg-card shadow-sm">
                <Sparkles className="size-8 text-primary" />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="font-semibold text-xl tracking-tight">
                  Test the Chat Assistant
                </h2>
                <p className="mx-auto max-w-md text-muted-foreground text-sm">
                  Describe symptoms or ask for a doctor recommendation. The AI
                  will match you with relevant specialists.
                </p>
              </div>
              <div className="flex w-full max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                  >
                    <MessageCircle className="mr-2 size-3" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 p-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                        isUser
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {isUser ? (
                        <User className="size-4" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl border px-4 py-3 ${
                        isUser
                          ? "border-primary/20 bg-primary/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                        {index === messages.length - 1 &&
                          msg.role === "assistant" &&
                          streaming && (
                            <span className="ml-0.5 inline-block animate-pulse text-primary">
                              ▊
                            </span>
                          )}
                      </p>
                      {msg.role === "assistant" &&
                        msg.doctors &&
                        msg.doctors.length > 0 &&
                        !streaming && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.doctors.map((doctor) => (
                              <Button
                                key={doctor.id}
                                size="sm"
                                variant="outline"
                                className="gap-2 rounded-full"
                                onClick={() =>
                                  window.open(
                                    `/doctors/${doctor.id}/booking`,
                                    "_blank"
                                  )
                                }
                              >
                                <Calendar className="size-3" />
                                Book {doctor.name}
                              </Button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-background p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your concerns..."
                disabled={streaming}
                rows={1}
                className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={!input.trim() || streaming}
                    size="icon"
                    className="size-8 rounded-full"
                  >
                    {streaming ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <SendHorizonal className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
