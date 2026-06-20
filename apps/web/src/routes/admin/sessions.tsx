import { useUser } from "@clerk/tanstack-react-start";
import { Button, Chip, Input, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, ShieldIcon, VideoIcon } from "lucide-react";
import { useState } from "react";
import { VideoRoomWeb } from "@/components/livekit/video-room";
import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessionPage,
});

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-foreground/50" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-foreground/60 text-sm">{label}</span>
    </div>
  );
}

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
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
          <ShieldIcon className="size-6 text-foreground/40" />
        </div>
        <p className="font-light text-sm">Unauthorized</p>
        <p className="max-w-xs font-light text-foreground/60 text-sm">
          You do not have admin access.
        </p>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col p-6">
        <VideoRoomWeb
          endAt={activeSession.endAt}
          isMock={isMock}
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
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <Chip
            className="flex size-16 items-center justify-center rounded-full bg-accent/10"
            variant="tertiary"
          >
            <ShieldIcon className="size-6 text-accent" />
          </Chip>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                Test session
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <VideoIcon className="size-3" />
                </div>
                Video testing
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Generate a test session ID and share it with the mobile app. The
              desktop browser acts as the doctor in the video call.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={ShieldIcon}
            label="current role"
            value={selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
          />
        </div>
      </section>

      <Separator />

      <div className="flex flex-col gap-6 px-6">
        <section className="flex flex-col gap-3">
          <div>
            <PageTitle>Step 1: Generate session</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Create a new session ID to share with the mobile app.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              isDisabled={isCreating}
              onPress={handleCreateSession}
              size="sm"
            >
              {isCreating ? "Creating..." : "Generate Session ID"}
            </Button>

            {generatedSessionId ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-foreground/5 px-3 py-2">
                <code className="flex-1 break-all font-mono text-xs">
                  {generatedSessionId}
                </code>
                <Button isIconOnly onPress={handleCopy} variant="ghost">
                  <Copy className="size-4" />
                </Button>
                {copied ? (
                  <span className="font-medium text-emerald-600 text-xs">
                    Copied!
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <div>
            <PageTitle>Step 2: Join session</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Enter a session ID and join the video call as a patient, doctor,
              or admin.
            </p>
          </div>

          <div className="flex max-w-sm flex-col gap-4">
            <Input
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste or type session ID..."
              value={sessionId}
            />

            <div className="flex flex-wrap gap-2">
              <p className="w-full text-foreground/60 text-xs">Join as</p>
              {(["patient", "doctor", "admin"] as const).map((role) => (
                <Button
                  key={role}
                  onPress={() => setSelectedRole(role)}
                  size="sm"
                  variant={selectedRole === role ? "primary" : "outline"}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Button>
              ))}
            </div>

            <Button isDisabled={!sessionId} onPress={handleJoin} size="sm">
              <VideoIcon className="mr-2 size-4" />
              Join as{" "}
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Button>

            <Button
              onPress={() => {
                setIsMock(true);
                setActiveSession({
                  id: "mock-session",
                  startAt: new Date().toISOString(),
                  endAt: new Date(Date.now() + 3_600_000).toISOString(),
                });
              }}
              size="sm"
              variant="secondary"
            >
              Mock Simulation (Save Credits)
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
