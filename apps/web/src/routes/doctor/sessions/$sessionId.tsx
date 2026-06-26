import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Participant } from "livekit-client";
import {
  Loader2,
  ShieldCheck as ShieldCheckIcon,
  Users as UsersIcon,
  Video,
} from "lucide-react";
import { useState } from "react";
import { VideoRoomWeb } from "@/components/livekit/video-room";
import { useLiveKitToken } from "@/hooks/queries/doctor";
import { useLiveKitRoomWeb } from "@/hooks/use-livekit-room";
import { useRole } from "@/hooks/use-role";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/sessions/$sessionId")({
  component: DoctorSessionDetailRoute,
});

function getAvatarFallback(identity: string): string {
  if (identity.startsWith("doctor_")) {
    return "Dr";
  }
  if (identity.startsWith("patient_")) {
    return "Pt";
  }
  if (identity.startsWith("admin_")) {
    return "Adm";
  }
  return "Usr";
}

function getStatusColorClasses(timeStatus: string): string {
  if (timeStatus === "during") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (timeStatus === "before") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-rose-100 text-rose-800";
}

function ParticipantCard({
  participant,
  isLocal,
  level,
  isSpeaking,
}: {
  participant: Participant;
  isLocal: boolean;
  level: number;
  isSpeaking: boolean;
}) {
  const pIdentity = participant.identity;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 p-2 transition-colors hover:bg-muted/50">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{getAvatarFallback(pIdentity)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="max-w-[100px] truncate font-medium text-sm">
              {isLocal ? "You" : "Participant"}
            </span>
            {isSpeaking && (
              <Badge className="ml-1" color="success" size="sm" variant="soft">
                Speaking
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            {Math.round(level * 100)}%
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className={`h-full bg-emerald-500 transition-all duration-200 ${isSpeaking ? "animate-pulse" : ""}`}
            style={{
              width: `${Math.min(level * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PatientInfoCard() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <ShieldCheckIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-medium">Shared Details</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground text-xs">
              Anonymous session data shared by the patient
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        The patient has shared confidential details for this session.
      </CardContent>
    </Card>
  );
}

function DoctorSessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const role = useRole();
  const userRole: "admin" | "doctor" = role === "admin" ? "admin" : "doctor";

  const sessionQuery = useLiveKitToken({ sessionId });
  const liveKit = useLiveKitRoomWeb();
  const session = (sessionQuery.data as any)?.session;
  const timing = useSessionTiming(
    session?.startAt ?? "",
    session?.endAt ?? "",
    userRole
  );

  const hasSharedPatientInfo = false;

  if (sessionQuery.isPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionQuery.isError || !session) {
    return (
      <div
        className="flex h-svh flex-col items-center justify-center gap-4"
        role="alert"
      >
        <p className="font-medium text-destructive">Failed to load session</p>
        <p className="text-muted-foreground text-sm">
          The video session could not be loaded. Please try again.
        </p>
        <Button onPress={() => navigate({ to: "/doctor/sessions" })}>
          Back to Sessions
        </Button>
      </div>
    );
  }

  let statusText: string;
  if (timing.timeStatus === "during") {
    statusText = "Live";
  } else if (timing.timeStatus === "before") {
    statusText = "Scheduled";
  } else {
    statusText = "Ended";
  }

  const handleEndSession = async () => {
    try {
      await orpc.recordAttendanceEvent.call({ sessionId, event: "leave" });
      await orpc.autoMarkAttendance.call({ sessionId });
      navigate({ to: "/doctor/sessions" });
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  return (
    <div className="flex h-svh flex-col bg-background">
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          <div className="min-w-0 flex-1">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-6 py-3">
                {timing.timeStatus === "during" && (
                  <Button onPress={handleEndSession} size="sm" variant="ghost">
                    End Session
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <VideoRoomWeb
                  endAt={session.endAt}
                  onClose={() => navigate({ to: "/doctor/sessions" })}
                  open={true}
                  role={userRole}
                  sessionId={sessionId}
                  startAt={session.startAt}
                />
              </div>
            </div>
          </div>

          <div className="w-72 min-w-0 border-border/50 border-l bg-background/50 p-4 backdrop-blur-sm">
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-medium">
                        Session Info
                      </CardTitle>
                      <CardDescription className="mt-1 text-muted-foreground text-xs">
                        Session details and controls
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Duration</span>
                      <span className="font-mono text-sm">
                        {timing.formattedRemaining}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Status</span>
                      <span
                        className={`rounded px-2 py-0.5 font-medium text-xs ${getStatusColorClasses(timing.timeStatus)}`}
                      >
                        {statusText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Scheduled</span>
                      <span className="font-mono text-sm">
                        {new Date(session.startAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {timing.timeStatus === "during" && (
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-medium">Elapsed</span>
                        <span className="font-mono text-muted-foreground text-sm">
                          {Math.floor(
                            (Date.now() - new Date(session.startAt).getTime()) /
                              60_000
                          )}
                          :
                          {String(
                            Math.floor(
                              (Date.now() -
                                new Date(session.startAt).getTime()) /
                                1000
                            ) % 60
                          ).padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>

                  {timing.timeStatus === "during" && (
                    <Button
                      className="w-full"
                      onPress={handleEndSession}
                      variant="ghost"
                    >
                      End Session
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                      <UsersIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-medium">
                        Participants
                      </CardTitle>
                      <CardDescription className="mt-1 text-muted-foreground text-xs">
                        Connected participants with audio levels
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {liveKit.isConnected && liveKit.room ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Connected</span>
                        <Badge variant="secondary">
                          {liveKit.participantCount}
                        </Badge>
                      </div>

                      <div className="max-h-[200px] space-y-2 overflow-y-auto">
                        {Array.from(
                          liveKit.room?.remoteParticipants.values() ?? []
                        ).map((participant) => {
                          const pIdentity = participant.identity;
                          const level =
                            (liveKit.audioLevelHistory[pIdentity] ?? []).at(
                              -1
                            ) ?? 0;
                          const isSpeaking = liveKit.activeSpeakers.some(
                            (s: Participant) => s.identity === pIdentity
                          );

                          return (
                            <ParticipantCard
                              isLocal={
                                pIdentity ===
                                liveKit.room?.localParticipant?.identity
                              }
                              isSpeaking={isSpeaking}
                              key={pIdentity}
                              level={level}
                              participant={participant}
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No participants connected
                    </div>
                  )}
                </CardContent>
              </Card>

              {hasSharedPatientInfo ? (
                <PatientInfoCard />
              ) : null}

              <Card className="border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                      <ShieldCheckIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-medium">
                        Session Controls
                      </CardTitle>
                      <CardDescription className="mt-1 text-muted-foreground text-xs">
                        Manage session settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Button
                    className="w-full"
                    onPress={() =>
                      orpc.recordSnapshot
                        .call({
                          sessionId,
                          imageData: "manual_snapshot",
                          reason: "pre_end_check",
                        })
                        .catch(console.error)
                    }
                    variant="ghost"
                  >
                    Take Snapshot
                  </Button>

                  <Button
                    className="w-full"
                    onPress={() =>
                      orpc.recordAttendanceEvent
                        .call({
                          sessionId,
                          event: "leave",
                        })
                        .catch(console.error)
                    }
                    variant="ghost"
                  >
                    Send Heartbeat
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
