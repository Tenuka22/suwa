import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { Copy, Video } from "lucide-react";
import { useState } from "react";
import { VideoRoomWeb } from "@/components/livekit/video-room";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/session")({
  component: AdminSessionPage,
});

function AdminSessionPage() {
  const { user } = useUser();
  const [sessionId, setSessionId] = useState("");
  const [generatedSessionId, setGeneratedSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    startAt: string;
    endAt: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const isAdmin = user?.publicMetadata?.role === "admin";

  if (!isAdmin) {
    return <div className="p-6 text-destructive">Unauthorized</div>;
  }

  if (activeSession) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-6 p-6">
        <VideoRoomWeb
          endAt={activeSession.endAt}
          onClose={() => setActiveSession(null)}
          role="doctor"
          sessionId={activeSession.id}
          startAt={activeSession.startAt}
        />
      </div>
    );
  }

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const result = await orpc.createTestSession.call();
      setGeneratedSessionId(result.sessionId);
      setSessionId(result.sessionId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinAsDoctor = () => {
    if (!sessionId) {
      return;
    }
    setActiveSession({
      id: sessionId,
      startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  };

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Session</CardTitle>
          <CardDescription>
            Generate a session and share the ID with the mobile app. The desktop
            user acts as the doctor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm">Step 1: Generate Session</h3>
            <Button
              disabled={isCreating}
              onClick={handleCreateSession}
              variant="default"
            >
              {isCreating ? "Creating..." : "Generate Session ID"}
            </Button>
            {generatedSessionId && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <code className="flex-1 break-all font-mono text-xs">
                  {generatedSessionId}
                </code>
                <Button onClick={handleCopy} size="icon" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
                {copied && (
                  <span className="font-medium text-success text-xs">
                    Copied!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm">Step 2: Join as Doctor</h3>
            <div className="flex flex-col gap-2">
              <Label>Session ID</Label>
              <Input
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Paste or use generated session ID..."
                value={sessionId}
              />
            </div>
            <Button disabled={!sessionId} onClick={handleJoinAsDoctor}>
              <Video className="mr-2 h-4 w-4" />
              Join as Doctor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
