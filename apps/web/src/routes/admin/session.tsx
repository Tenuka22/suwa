import { useUser } from "@clerk/tanstack-react-start";
import { Badge } from "@doca/ui/components/badge";
import { Button } from "@doca/ui/components/button";
import { Card, CardContent, CardHeader } from "@doca/ui/components/card";
import { Input } from "@doca/ui/components/input";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, ShieldIcon, Video } from "lucide-react";
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
  const [isMock, setIsMock] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "patient" | "doctor" | "admin"
  >("patient");

  if (!user) {
    return null;
  }

  const isAdmin = user.publicMetadata?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-medium text-sm">Unauthorized</h2>
              <p className="text-muted-foreground text-sm">
                You do not have admin access.
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col p-6">
        <VideoRoomWeb
          endAt={activeSession.endAt}
          onClose={() => {
            setActiveSession(null);
            setIsMock(false);
          }}
          onFetchToken={(sid) =>
            orpc.getTestLiveKitToken.call({ sessionId: sid })
          }
          role={selectedRole}
          sessionId={activeSession.id}
          startAt={activeSession.startAt}
          isMock={isMock}
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
    } catch {
      // Session creation failed silently
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
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
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Admin console</Badge>
              <Badge variant="secondary">Test session</Badge>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-lg tracking-tight">
                Test session
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm">
                Generate a test session ID and share it with the mobile app. The
                desktop browser acts as the doctor in the video call.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-sm">Step 1: Generate session</h2>
              <p className="text-muted-foreground text-sm">
                Create a new session ID to share with the mobile app.
              </p>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Button disabled={isCreating} onClick={handleCreateSession}>
              {isCreating ? "Creating..." : "Generate Session ID"}
            </Button>

            {generatedSessionId ? (
              <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 p-3">
                <code className="flex-1 break-all font-mono text-xs">
                  {generatedSessionId}
                </code>
                <Button onClick={handleCopy} size="icon" variant="ghost">
                  <Copy className="size-4" />
                </Button>
                {copied ? (
                  <span className="font-medium text-emerald-600 text-xs">
                    Copied!
                  </span>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-sm">Step 2: Join session</h2>
              <p className="text-muted-foreground text-sm">
                Enter a session ID and join the video call as a patient, doctor,
                or admin.
              </p>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Input
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste or type session ID..."
              value={sessionId}
            />

            <div className="flex flex-wrap gap-2">
              <p className="w-full text-muted-foreground text-xs">Join as</p>
              {(["patient", "doctor", "admin"] as const).map((role) => (
                <Button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  size="sm"
                  variant={selectedRole === role ? "default" : "outline"}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Button>
              ))}
            </div>

            <Button disabled={!sessionId} onClick={handleJoin}>
              <Video className="mr-2 size-4" />
              Join as{" "}
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Button>

            <Button
              onClick={() => {
                setIsMock(true);
                setActiveSession({
                  id: "mock-session",
                  startAt: new Date().toISOString(),
                  endAt: new Date(Date.now() + 3600000).toISOString(),
                });
              }}
              variant="secondary"
            >
              🚀 Mock Simulation (Save Credits)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
