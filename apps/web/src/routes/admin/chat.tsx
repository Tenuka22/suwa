import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent, CardHeader } from "@zen-doc/ui/components/card";
import { Input } from "@zen-doc/ui/components/input";
import { MessageCircleIcon, SendIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { orpcWs } from "@/utils/orpc";

export const Route = createFileRoute("/admin/chat")({
  component: ChatTestRoute,
});

function ChatTestRoute() {
  const [messages, setMessages] = useState<
    Array<{ type: string; data: unknown; timestamp: string }>
  >([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [conversationId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    setStatus("connecting");

    let isSubscribed = true;

    (async () => {
      try {
        setStatus("connected");
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            data: "Connected to WebSocket server",
            timestamp: new Date().toISOString(),
          },
        ]);

        const stream = await orpcWs.subscribeMessages({ conversationId });

        for await (const message of stream) {
          if (!isSubscribed) {
            break;
          }

          setMessages((prev) => [
            ...prev,
            {
              type: "received",
              data: message,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        setStatus("disconnected");
        setMessages((prev) => [
          ...prev,
          {
            type: "error",
            data: error instanceof Error ? error.message : "Connection error",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    })();

    return () => {
      isSubscribed = false;
      setStatus("disconnected");
    };
  }, [conversationId]);

  const sendMessage = async () => {
    if (!(input.trim() && orpcWs) || status !== "connected") {
      return;
    }

    try {
      const result = await orpcWs.sendMessage({
        message: input,
        conversationId,
      });

      setMessages((prev) => [
        ...prev,
        { type: "sent", data: result, timestamp: new Date().toISOString() },
      ]);
      setInput("");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          data: error instanceof Error ? error.message : "Failed to send",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
              <MessageCircleIcon className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                WebSocket Chat Test
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm">
                Test bidirectional WebSocket communication with the server.
                Status:{" "}
                <span
                  className={
                    status === "connected"
                      ? "text-green-600"
                      : status === "connecting"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }
                >
                  {status}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <h2 className="font-semibold text-xl">Messages</h2>
          <p className="text-muted-foreground text-sm">
            Conversation ID: {conversationId}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="h-[400px] space-y-2 overflow-y-auto rounded-2xl border bg-muted/20 p-4">
            {messages.map((msg, idx) => (
              <div
                className="rounded-lg border bg-background p-3 font-mono text-xs"
                key={`${idx.toString()}-${msg.timestamp}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={
                      msg.type === "sent"
                        ? "text-blue-600"
                        : msg.type === "received"
                          ? "text-green-600"
                          : msg.type === "error"
                            ? "text-red-600"
                            : "text-muted-foreground"
                    }
                  >
                    {msg.type}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(msg.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              className="rounded-2xl"
              disabled={status !== "connected"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              type="text"
              value={input}
            />
            <Button
              className="rounded-2xl"
              disabled={status !== "connected"}
              onClick={sendMessage}
            >
              <SendIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
