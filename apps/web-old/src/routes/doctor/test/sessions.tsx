import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Input } from "@suwa/ui/components/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardIcon, FlaskConicalIcon, VideoIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";
import { buildHeadFromKey } from "../../__root";

export const Route = createFileRoute("/doctor/test/sessions")({
  head: () => buildHeadFromKey("web:doctor:sessions:detail"),
  component: DoctorTestSessionsRoute,
});

function DoctorTestSessionsRoute() {
  return <DoctorTestSessionsContent />;
}

export function DoctorTestSessionsContent() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");
  const [generatedSessionId, setGeneratedSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const result = await orpc.createTestSession.call({});
      setGeneratedSessionId(result.sessionId);
      setSessionId(result.sessionId);
      toast.success("Test session created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create test session"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedSessionId) {
      return;
    }

    await navigator.clipboard.writeText(generatedSessionId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    const trimmedSessionId = sessionId.trim();
    if (!trimmedSessionId) {
      return;
    }

    navigate({ to: `/doctor/test/session/${trimmedSessionId}` });
  };

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:p-6">
          <Badge className="h-7 w-fit rounded-full bg-primary px-3 text-primary-foreground">
            Doctor test workspace
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">
              Test a session room
            </h1>
            <p className="text-muted-foreground text-sm leading-6">
              Generate a test session or paste a session ID. Joining opens the
              same doctor session room used by scheduled sessions.
            </p>
          </div>
        </div>

        <Card className="rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConicalIcon className="size-4" />
              Generate session
            </CardTitle>
            <CardDescription>
              Creates an approved test session assigned to your doctor account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button disabled={isCreating} onClick={handleCreateSession}>
              {isCreating ? "Creating..." : "Generate Session ID"}
            </Button>

            {generatedSessionId ? (
              <div className="flex flex-col gap-2 rounded-2xl border bg-background/70 p-3">
                <code className="break-all font-mono text-xs">
                  {generatedSessionId}
                </code>
                <Button onClick={handleCopy} size="sm" variant="outline">
                  <ClipboardIcon className="mr-2 size-3.5" />
                  {copied ? "Copied" : "Copy session ID"}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Generated ID will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <VideoIcon className="size-4" />
              Join as doctor
            </CardTitle>
            <CardDescription>
              Opens the 1:1 doctor video session experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              onChange={(event) => setSessionId(event.target.value)}
              placeholder="Paste or type session ID..."
              value={sessionId}
            />
            <Button disabled={!sessionId.trim()} onClick={handleJoin}>
              <VideoIcon className="mr-2 size-4" />
              Open doctor session room
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
