import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent } from "@zen-doc/ui/components/card";
import {
  Camera,
  CameraOff,
  Clock,
  Mic,
  MicOff,
  PhoneOff,
  User,
  UserX,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLiveKitRoomWeb } from "@/hooks/use-livekit-room";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

interface VideoRoomProps {
  asDialog?: boolean;
  endAt: string;
  onClose: () => void;
  onFetchToken?: (sessionId: string) => Promise<{
    token: string;
    serverUrl: string;
    roomName: string;
    session: {
      id: string;
      startAt: string;
      endAt: string;
      status: string;
      doctorId: string;
      patientId: string;
    };
  }>;
  open?: boolean;
  role: "doctor" | "patient" | "admin";
  sessionId: string;
  startAt: string;
}

function useAttendanceTracker({
  isConnected,
  sessionId,
  endAt,
  role,
}: {
  isConnected: boolean;
  sessionId: string;
  endAt: string;
  role: string;
}) {
  const hasRecordedJoin = useRef(false);
  const snapshotTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isConnected && !hasRecordedJoin.current) {
      hasRecordedJoin.current = true;
      orpc.recordAttendanceEvent
        .call({ sessionId, event: "join" })
        .catch(() => undefined);
    }
  }, [isConnected, sessionId]);

  useEffect(() => {
    if (!isConnected && hasRecordedJoin.current) {
      hasRecordedJoin.current = false;
      orpc.recordAttendanceEvent
        .call({ sessionId, event: "leave" })
        .catch(() => undefined);
    }
  }, [isConnected, sessionId]);

  useEffect(() => {
    if (!isConnected || role !== "doctor") {
      return;
    }

    const endMs = new Date(endAt).getTime();
    const tenMinBeforeEnd = endMs - 10 * 60 * 1000 - Date.now();
    const atEnd = endMs - Date.now();

    if (tenMinBeforeEnd > 0) {
      const timer = setTimeout(() => {
        orpc.recordSnapshot
          .call({
            sessionId,
            imageData: "snapshot_10min_before_end",
            reason: "pre_end_check",
          })
          .catch(() => undefined);
      }, tenMinBeforeEnd);
      snapshotTimers.current.push(timer);
    }

    if (atEnd > 0) {
      const timer = setTimeout(() => {
        orpc.recordSnapshot
          .call({
            sessionId,
            imageData: "snapshot_at_end",
            reason: "end_check",
          })
          .catch(() => undefined);
        orpc.autoMarkAttendance.call({ sessionId }).catch(() => undefined);
      }, atEnd);
      snapshotTimers.current.push(timer);
    }

    return () => {
      for (const timer of snapshotTimers.current) {
        clearTimeout(timer);
      }
      snapshotTimers.current = [];
    };
  }, [isConnected, sessionId, endAt, role]);
}

function formatParticipantLabel(identity: string): string {
  if (identity.startsWith("doctor_")) {
    return "Doctor";
  }
  if (identity.startsWith("patient_")) {
    return "Patient";
  }
  if (identity.startsWith("admin_")) {
    return "Admin";
  }
  return "Participant";
}

function AudioVisualizer({ levels }: { levels: number[] }) {
  return (
    <div className="flex h-8 w-fit items-end gap-[2px]">
      {levels.map((level, i) => (
        <div
          className="w-[3px] rounded-t bg-emerald-500 transition-all duration-75"
          key={i}
          style={{
            height: `${Math.max(10, level * 100)}%`,
            opacity: 0.3 + level * 0.7,
          }}
        />
      ))}
    </div>
  );
}

function VideoRoomContent({
  fetchToken,
  handleEndSession,
  isFetchingToken,
  liveKit,
  role,
  timing,
  tokenError,
}: {
  fetchToken: () => Promise<void>;
  handleEndSession: () => Promise<void>;
  isFetchingToken: boolean;
  liveKit: ReturnType<typeof useLiveKitRoomWeb>;
  role: "doctor" | "patient" | "admin";
  timing: ReturnType<typeof useSessionTiming>;
  tokenError: string | null;
}) {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [muteSeconds, setMuteSeconds] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (!isMicOn && role === "doctor" && liveKit.isConnected) {
      interval = setInterval(() => {
        setMuteSeconds((s) => s + 1);
      }, 1000);
    } else {
      setMuteSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isMicOn, role, liveKit.isConnected]);

  const muteLimit = 60;
  const remainingMuteTime = Math.max(0, muteLimit - muteSeconds);

  useEffect(() => {
    if (muteSeconds >= muteLimit && !isMicOn && liveKit.room) {
      liveKit.room.localParticipant.setMicrophoneEnabled(true);
      setIsMicOn(true);
      setMuteSeconds(0);
    }
  }, [muteSeconds, isMicOn, liveKit.room]);

  useEffect(() => {
    if (!liveKit.room) {
      return;
    }
    const room = liveKit.room;

    const updateStates = () => {
      setIsCameraOn(room.localParticipant.isCameraEnabled);
      setIsMicOn(room.localParticipant.isMicrophoneEnabled);
    };

    room.on("localTrackUnpublished", updateStates);
    room.localParticipant.on("trackPublished", updateStates);

    return () => {
      room.off("localTrackUnpublished", updateStates);
      room.localParticipant.off("trackPublished", updateStates);
    };
  }, [liveKit.room]);

  const handleToggleCamera = useCallback(async () => {
    if (!liveKit.room || role === "doctor") {
      return;
    }
    const enabled = !liveKit.room.localParticipant.isCameraEnabled;
    await liveKit.room.localParticipant.setCameraEnabled(enabled);
    setIsCameraOn(enabled);
  }, [liveKit.room, role]);

  const handleToggleMic = useCallback(async () => {
    if (!liveKit.room) {
      return;
    }
    const enabled = !liveKit.room.localParticipant.isMicrophoneEnabled;
    await liveKit.room.localParticipant.setMicrophoneEnabled(enabled);
    setIsMicOn(enabled);
  }, [liveKit.room]);

  if (tokenError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <VideoOff className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{tokenError}</p>
        <Button onClick={fetchToken} size="sm" variant="default">
          Retry
        </Button>
      </div>
    );
  }

  if (isFetchingToken || liveKit.isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
        <p className="font-medium text-muted-foreground">
          Establishing secure connection...
        </p>
      </div>
    );
  }

  if (timing.canJoin) {
    const remoteParticipantsArray = liveKit.isConnected
      ? Array.from(liveKit.room?.remoteParticipants?.values() ?? [])
      : [];
    const allParticipants = [
      ...(liveKit.isConnected && liveKit.room?.localParticipant
        ? [liveKit.room.localParticipant]
        : []),
      ...remoteParticipantsArray,
    ];
    const hasRemote = liveKit.isConnected && remoteParticipantsArray.length > 0;

    return (
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto] gap-4">
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl bg-neutral-950 shadow-2xl">
          <div className="relative flex-1 overflow-hidden">
            <video
              autoPlay
              className={`h-full w-full object-contain ${
                liveKit.isConnected && hasRemote ? "" : "hidden"
              }`}
              playsInline
              ref={liveKit.videoRef}
            />
            <audio autoPlay playsInline ref={liveKit.audioRef} />

            {liveKit.isConnected && hasRemote && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-black/40 backdrop-blur-md">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="font-semibold text-white text-xs uppercase tracking-wide">
                  {formatParticipantLabel(
                    remoteParticipantsArray[0]?.identity ?? ""
                  ) || "Participant"}
                </span>
              </div>
            )}

            {liveKit.isConnected && !hasRemote && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                <UserX className="h-12 w-12 text-neutral-600" />
                <p className="font-medium text-neutral-400 text-sm">
                  {role === "admin"
                    ? "No user connected"
                    : "Waiting for participant to join..."}
                </p>
              </div>
            )}

            {!liveKit.isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                <div className="relative">
                  <div className="h-16 w-16 animate-ping rounded-full bg-primary/20" />
                  <User className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
                </div>
                <p className="animate-pulse font-medium text-neutral-400 text-sm">
                  Establishing connection...
                </p>
              </div>
            )}

            {liveKit.isConnected && (
              <div className="absolute top-4 right-4 aspect-video w-[200px] overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-xl lg:w-[240px]">
                <video
                  autoPlay
                  className="h-full w-full scale-x-[-1] object-cover"
                  muted
                  playsInline
                  ref={liveKit.localVideoRef}
                />
                <div className="absolute bottom-2 left-2 rounded bg-black/60 backdrop-blur-sm">
                  <span className="font-medium text-[10px] text-white uppercase">
                    You
                  </span>
                </div>
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <CameraOff className="h-8 w-8 text-neutral-600" />
                  </div>
                )}
              </div>
            )}

            {muteSeconds > 30 && role === "doctor" && (
              <div className="absolute top-20 left-1/2 z-20 w-full max-w-md -translate-x-1/2">
                <div className="flex items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/20 text-amber-200 backdrop-blur-lg">
                  <MicOff className="h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-xs uppercase italic">
                      Microphone Requirement
                    </p>
                    <p className="text-xs opacity-90">
                      Please unmute. Automatic unmute in {remainingMuteTime}s
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl transition-all hover:bg-black/80">
            <button
              className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                isMicOn
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:bg-red-500"
              }`}
              onClick={handleToggleMic}
              type="button"
            >
              {isMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
              {!isMicOn && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white font-semibold text-[10px] text-red-600">
                  !
                </span>
              )}
            </button>

            {role !== "doctor" && (
              <button
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                  isCameraOn
                    ? "bg-neutral-800 text-white hover:bg-neutral-700"
                    : "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:bg-red-500"
                }`}
                onClick={handleToggleCamera}
                type="button"
              >
                {isCameraOn ? (
                  <Camera className="h-5 w-5" />
                ) : (
                  <CameraOff className="h-5 w-5" />
                )}
              </button>
            )}

            <div className="h-8 w-[1px] bg-white/10" />

            <button
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-red-500"
              onClick={() => setShowEndConfirm(true)}
              type="button"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>

          {showEndConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <Card className="w-full max-w-sm border-white/10 bg-neutral-900 text-white">
                <CardContent className="flex flex-col gap-6">
                  <div className="text-center">
                    <h3 className="font-medium text-sm">End Session?</h3>
                    <p className="text-neutral-400 text-sm">
                      This will disconnect all participants from the call.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => setShowEndConfirm(false)}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 text-white hover:bg-red-500"
                      onClick={handleEndSession}
                    >
                      End Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {liveKit.isConnected && (
          <div className="flex w-auto flex-col gap-3 overflow-y-auto">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Participants ({allParticipants.length})
            </p>
            {allParticipants.map((p) => {
              const isLocal =
                p.identity === liveKit.room?.localParticipant?.identity;
              const levels = liveKit.audioLevelHistory[p.identity] ?? [];
              const label = isLocal
                ? `You (${formatParticipantLabel(p.identity)})`
                : formatParticipantLabel(p.identity);
              const isSpeaking = liveKit.activeSpeakers?.some(
                (s) => s.identity === p.identity
              );

              return (
                <Card
                  className={`border ${
                    isSpeaking ? "border-emerald-500/50" : "border-border"
                  }`}
                  key={p.identity}
                >
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            isLocal ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          <User className="h-3 w-3" />
                        </div>
                        <span className="font-medium text-xs">{label}</span>
                      </div>
                      {isSpeaking && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <AudioVisualizer levels={levels} />
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {isLocal ? (
                          isCameraOn ? (
                            <Camera className="h-3 w-3" />
                          ) : (
                            <CameraOff className="h-3 w-3" />
                          )
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                        {isLocal ? (isCameraOn ? "On" : "Off") : "On"}
                      </span>
                      <span className="flex items-center gap-1">
                        {isLocal ? (
                          isMicOn ? (
                            <Mic className="h-3 w-3" />
                          ) : (
                            <MicOff className="h-3 w-3" />
                          )
                        ) : (
                          <Mic className="h-3 w-3" />
                        )}
                        {isLocal ? (isMicOn ? "On" : "Off") : "On"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <VideoOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg tracking-tight">Not Ready Yet</h3>
      <p className="max-w-[280px] text-muted-foreground text-sm">
        This session is not yet available for joining. Please check back at the
        scheduled time.
      </p>
    </div>
  );
}

export function VideoRoomWeb({
  onClose,
  onFetchToken,
  open = true,
  sessionId,
  startAt,
  endAt,
  role,
  asDialog = false,
}: VideoRoomProps) {
  const liveKit = useLiveKitRoomWeb();
  const timing = useSessionTiming(startAt, endAt, role);
  const [tokenData, setTokenData] = useState<{
    token: string;
    serverUrl: string;
    roomName: string;
  } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);

  useAttendanceTracker({
    isConnected: liveKit.isConnected,
    sessionId,
    endAt,
    role,
  });

  const fetchToken = useCallback(async () => {
    if (tokenData || isFetchingToken) {
      return;
    }
    setIsFetchingToken(true);
    setTokenError(null);
    try {
      const fetcher =
        onFetchToken ??
        ((sid: string) => orpc.getLiveKitToken.call({ sessionId: sid }));
      const result = await fetcher(sessionId);
      setTokenData(result);
    } catch (err) {
      setTokenError(
        err instanceof Error ? err.message : "Failed to get session token"
      );
    } finally {
      setIsFetchingToken(false);
    }
  }, [sessionId, tokenData, isFetchingToken, onFetchToken]);

  useEffect(() => {
    if (open && timing.canJoin && !tokenData && !isFetchingToken) {
      fetchToken();
    }
  }, [open, timing.canJoin, tokenData, isFetchingToken, fetchToken]);

  useEffect(() => {
    if (open && tokenData && !liveKit.isConnected && !liveKit.isConnecting) {
      liveKit
        .connect(tokenData.serverUrl, tokenData.token)
        .catch(() => undefined);
    }
  }, [open, tokenData, liveKit]);

  const handleEndSession = useCallback(async () => {
    await orpc.recordAttendanceEvent
      .call({ sessionId, event: "leave" })
      .catch(() => undefined);
    await liveKit.disconnect();
    setTokenData(null);
    setTokenError(null);
    onClose();
  }, [liveKit, onClose, sessionId]);

  useEffect(() => {
    if (timing.mustLeave && liveKit.isConnected) {
      liveKit.disconnect().catch(() => undefined);
    }
  }, [timing.mustLeave, liveKit]);

  useEffect(() => {
    if (!open && liveKit.isConnected) {
      liveKit.disconnect().catch(() => undefined);
    }
  }, [open, liveKit]);

  const statusBadge = useMemo(() => {
    if (!timing.canJoin) {
      return null;
    }
    if (timing.mustLeave) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 font-medium text-rose-600 text-xs dark:text-rose-400">
          <VideoOff className="h-3 w-3" />
          Must leave
        </span>
      );
    }
    if (timing.timeStatus === "grace") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 font-medium text-amber-600 text-xs dark:text-amber-400">
          Grace period ({timing.formattedRemaining})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 font-medium text-emerald-600 text-xs dark:text-emerald-400">
        <Video className="h-3 w-3" />
        Live
      </span>
    );
  }, [timing]);

  const content = (
    <VideoRoomContent
      fetchToken={fetchToken}
      handleEndSession={handleEndSession}
      isFetchingToken={isFetchingToken}
      liveKit={liveKit}
      role={role}
      timing={timing}
      tokenError={tokenError}
    />
  );

  if (asDialog) {
    const { Dialog, DialogContent } =
      require("@zen-doc/ui/components/dialog") as typeof import("@zen-doc/ui/components/dialog");
    return (
      <Dialog onOpenChange={(o: boolean) => !o && onClose()} open={open}>
        <DialogContent className="max-w-5xl overflow-hidden p-0 sm:rounded-2xl">
          <div className="flex h-[80vh] flex-col">
            <div className="flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-medium text-sm">Clinical Consultation</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Secure Session
                  </p>
                </div>
              </div>
              {statusBadge}
            </div>
            <div className="flex-1 bg-black">{content}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight">
                Session
              </span>
              <Badge
                className="h-5 rounded-md text-[10px] uppercase"
                variant="outline"
              >
                {role}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              LiveKit Infrastructure
            </p>
          </div>
        </div>
        {statusBadge}
      </div>
      {content}
    </div>
  );
}

export function SessionJoinButton({
  endAt,
  onJoin,
  role,
  sessionId,
  startAt,
}: {
  endAt: string;
  onJoin: (id: string) => void;
  role: string;
  sessionId: string;
  startAt: string;
}) {
  const timing = useSessionTiming(
    startAt,
    endAt,
    role as "patient" | "doctor" | "admin"
  );

  if (timing.mustLeave) {
    return (
      <Badge className="bg-rose-500/10 text-rose-600" variant="outline">
        <VideoOff className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  if (timing.canJoin) {
    return (
      <Button onClick={() => onJoin(sessionId)} size="sm" variant="default">
        <Video className="h-3 w-3" />
        Join
      </Button>
    );
  }

  if (timing.timeStatus === "before" && timing.joinWindowOpenAt) {
    const diff = timing.joinWindowOpenAt.getTime() - Date.now();
    const minutes = Math.max(0, Math.ceil(diff / 60_000));

    return (
      <Badge className="bg-amber-500/10 text-amber-600" variant="outline">
        <Clock className="h-3 w-3" />
        Join in {minutes}m
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      <Clock className="h-3 w-3" />
      Scheduled
    </Badge>
  );
}
