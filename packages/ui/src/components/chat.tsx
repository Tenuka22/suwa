"use client";

import {
  Filter,
  Loader2,
  MessageSquare,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

export interface Suggestion {
  description?: string;
  label: string;
  value: string;
}

export interface ChatMessage {
  content: string;
  id: string;
  role: "user" | "assistant";
  status?: string;
  suggestions?: Suggestion[];
  timestamp: string;
  toolCalls?: Array<{ name: string; args: any; result?: any; id?: string }>;
}

type InputMode = "text" | "select";

interface ChatProps {
  isLoading?: boolean;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  status?: string;
  suggestions?: Suggestion[];
}

export function Chat({
  messages,
  isLoading,
  onSendMessage,
  suggestions: externalSuggestions,
  status: externalStatus,
}: ChatProps) {
  const [input, setInput] = React.useState("");
  const [inputMode, setInputMode] = React.useState<InputMode>("text");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const latestSuggestions =
    externalSuggestions ??
    messages
      .filter(
        (m) =>
          m.role === "assistant" && m.suggestions && m.suggestions.length > 0
      )
      .pop()?.suggestions;

  const hasSuggestions = latestSuggestions && latestSuggestions.length > 0;

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, externalStatus]);

  React.useEffect(() => {
    if (hasSuggestions && messages.length === 0) {
      setInputMode("select");
    }
  }, [hasSuggestions, messages.length]);

  const handleSuggestionClick = (value: string) => {
    if (isLoading) {
      return;
    }
    onSendMessage(value);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) {
      return;
    }
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-background/50 backdrop-blur-sm">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4 lg:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => {
            if (
              !msg.content &&
              msg.role === "assistant" &&
              !msg.status &&
              !msg.toolCalls?.length
            ) {
              return null;
            }
            const isAssistant = msg.role === "assistant";
            return (
              <div
                className={cn(
                  "fade-in slide-in-from-bottom-2 flex w-full animate-in duration-300",
                  isAssistant ? "justify-start" : "justify-end"
                )}
                key={msg.id}
              >
                <div
                  className={cn(
                    "group relative flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 shadow-sm transition-all lg:max-w-[75%]",
                    isAssistant
                      ? "rounded-tl-none border bg-card text-card-foreground shadow-teal-900/5"
                      : "rounded-tr-none bg-primary text-primary-foreground shadow-primary/10"
                  )}
                >
                  {isAssistant && (
                    <div className="absolute -top-2 -left-2 rounded-full bg-teal-600 p-1 text-white shadow-sm ring-2 ring-background">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}

                  {msg.content && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed tracking-tight lg:text-base">
                      {msg.content}
                    </p>
                  )}

                  {msg.toolCalls?.map((tc, i) => (
                    <div
                      className={cn(
                        "mt-1 rounded-xl border border-border/50 p-2.5 text-xs transition-colors",
                        isAssistant
                          ? "bg-muted/50"
                          : "border-white/20 bg-primary-foreground/10"
                      )}
                      key={tc.id || i}
                    >
                      <div className="flex items-center gap-2.5 font-medium opacity-80">
                        <Loader2
                          className={cn(
                            "h-3 w-3",
                            tc.result ? "" : "animate-spin"
                          )}
                        />
                        <span className="font-mono">{tc.name}</span>
                      </div>
                      {tc.result && (
                        <div className="mt-1.5 border-border/20 border-t pt-1.5 italic opacity-70">
                          Success
                        </div>
                      )}
                    </div>
                  ))}

                  {msg.status && !msg.content && (
                    <div className="flex items-center gap-2 py-1 text-muted-foreground text-xs italic opacity-80">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{msg.status}</span>
                    </div>
                  )}

                  <time
                    className={cn(
                      "mt-1 self-end text-[10px] opacity-40",
                      !isAssistant && "text-primary-foreground/70"
                    )}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            );
          })}

          {(externalStatus || isLoading) &&
            !messages.some((m) => m.status === externalStatus) && (
              <div className="fade-in flex animate-in justify-start duration-300">
                <div className="flex max-w-[85%] items-center gap-3 rounded-2xl rounded-tl-none border bg-card px-4 py-3 shadow-sm lg:max-w-[75%]">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500" />
                  </div>
                  {externalStatus && (
                    <span className="text-muted-foreground text-xs italic tracking-tight">
                      {externalStatus}
                    </span>
                  )}
                </div>
              </div>
            )}
          <div className="h-4" ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/80 p-4 backdrop-blur-md lg:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Mode Toggle & Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setInputMode("text")}
              size="sm"
              variant={inputMode === "text" ? "default" : "secondary"}
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Free Text
            </Button>
            {hasSuggestions && (
              <>
                <Button
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => setInputMode("select")}
                  size="sm"
                  variant={inputMode === "select" ? "default" : "secondary"}
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Quick Actions
                </Button>

                {inputMode === "text" && (
                  <div className="flex flex-wrap gap-2">
                    {latestSuggestions.slice(0, 3).map((opt) => (
                      <button
                        className="rounded-full border bg-background px-3 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                        disabled={isLoading}
                        key={opt.value}
                        onClick={() => handleSuggestionClick(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {inputMode === "select" ? (
            <div className="zoom-in-95 grid animate-in grid-cols-1 gap-2 duration-200 sm:grid-cols-2">
              {latestSuggestions?.map((opt) => (
                <Card
                  className="group relative cursor-pointer overflow-hidden border-2 border-transparent p-4 transition-all hover:border-teal-500/30 hover:bg-teal-50/50 hover:shadow-md dark:hover:bg-teal-900/10"
                  key={opt.value}
                  onClick={() => handleSuggestionClick(opt.value)}
                >
                  <div className="font-semibold text-sm tracking-tight lg:text-base">
                    {opt.label}
                  </div>
                  {opt.description && (
                    <div className="mt-1 line-clamp-1 text-muted-foreground text-xs">
                      {opt.description}
                    </div>
                  )}
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                    <SendHorizontal className="h-4 w-4 text-teal-600" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="relative flex items-center gap-2">
              <Input
                className="h-12 rounded-2xl border-2 bg-background/50 pr-12 pl-4 text-sm shadow-sm ring-offset-background focus-visible:border-teal-500 focus-visible:ring-teal-500/20 lg:text-base"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Suwa anything..."
                value={input}
              />
              <Button
                className="absolute right-1.5 h-9 w-9 rounded-xl p-0 transition-transform active:scale-95"
                disabled={isLoading || !input.trim()}
                onClick={handleSend}
                size="icon"
              >
                <SendHorizontal className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
