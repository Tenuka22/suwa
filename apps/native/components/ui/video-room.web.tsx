import { type Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SessionTimingRole } from "@/hooks/use-session-timing";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

interface VideoRoomProps {
  alias?: string;
  endAt: string;
  onClose: () => void;
  onFetchToken?: (sessionId: string) => Promise<{
    token: string;
    serverUrl: string;
  }>;
  role: SessionTimingRole;
  sessionId: string;
  startAt: string;
}

const iconPaths = {
  mic: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8",
  micOff:
    "M16 6.7V4a3 3 0 0 0-5.4-1.9M13.5 11.5A3 3 0 0 0 17 8M2 2l20 20M19 10v2a7 7 0 0 1-4.2 6.4M12 19v4M8 23h8",
  camera:
    "M23 7l-7 5 7 5V7zM15 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z",
  cameraOff:
    "M23 7l-7 5 7 5V7zM2 2l20 20M9.5 9.5A2 2 0 0 0 7 13M15 5H3a2 2 0 0 0-2 2v7.5M21 15.5V7a2 2 0 0 0-2-2",
  phoneOff:
    "M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91M22 2L2 22",
  videoOff:
    "M10.66 6H14a2 2 0 0 1 2 2v2.34M17 10l4-3v10M2 2l20 20M7 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 1.8-1.1",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  video: "M22 8l-6 4 6 4V8zM2 6h14v12H2V6z",
};

function SvgIcon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg
      aria-label="icon"
      className="shrink-0"
      fill="none"
      height={size}
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((segment, i) => {
          const s = segment.trim();
          if (!s) {
            return null;
          }
          return <path d={`M${s}`} key={i} />;
        })}
    </svg>
  );
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

export function VideoRoom({
  alias,
  onClose,
  onFetchToken,
  role,
  sessionId,
  startAt,
  endAt,
}: VideoRoomProps) {
  const timing = useSessionTiming(startAt, endAt, role);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const hasFetchedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [remoteLabel, setRemoteLabel] = useState("");

  const connectToRoom = useCallback(
    async (serverUrl: string, token: string) => {
      const { Room: RoomClass } = await import("livekit-client");
      const room = new RoomClass({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { height: 720, width: 1280 },
        },
      });

      room.on(RoomEvent.Connected, () => {
        setIsConnected(true);
        setIsConnecting(false);

        const firstRemote = room.remoteParticipants.values().next().value;
        if (firstRemote) {
          setRemoteLabel(formatParticipantLabel(firstRemote.identity));
        }

        for (const pub of room.localParticipant.trackPublications) {
          if (pub.track?.kind === Track.Kind.Video && localVideoRef.current) {
            pub.track.attach(localVideoRef.current);
          }
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setIsConnecting(false);
        roomRef.current = null;
      });

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
        }
      });

      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (
          publication.track?.kind === Track.Kind.Video &&
          localVideoRef.current
        ) {
          publication.track.attach(localVideoRef.current);
        }
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        setRemoteLabel(formatParticipantLabel(participant.identity));
      });

      await room.connect(serverUrl, token);
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = room;
    },
    []
  );

  const startSession = useCallback(async () => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    setIsConnecting(true);
    setTokenError(null);

    try {
      let result: { token: string; serverUrl: string };
      if (onFetchToken) {
        result = await onFetchToken(sessionId);
      } else {
        result = await orpc.getLiveKitToken.call({ sessionId });
      }
      await connectToRoom(result.serverUrl, result.token);
    } catch (err) {
      setTokenError(
        err instanceof Error ? err.message : "Failed to get session token"
      );
      hasFetchedRef.current = false;
    } finally {
      setIsConnecting(false);
    }
  }, [sessionId, onFetchToken, connectToRoom]);

  useEffect(() => {
    if (timing.canJoin && !hasFetchedRef.current) {
      startSession();
    }
  }, [timing.canJoin, startSession]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      roomRef.current.removeAllListeners();
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const handleEndSession = useCallback(async () => {
    await orpc.recordAttendanceEvent
      .call({ sessionId, event: "leave" })
      .catch(() => undefined);
    await disconnect();
    onClose();
  }, [disconnect, onClose, sessionId]);

  const handleToggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }
    const enabled = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    setIsCameraOn(enabled);
  }, []);

  const handleToggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }
    const enabled = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(enabled);
    setIsMicOn(enabled);
  }, []);

  useEffect(
    () => () => {
      if (roomRef.current) {
        roomRef.current.removeAllListeners();
        roomRef.current.disconnect().catch(() => undefined);
      }
    },
    []
  );

  if (tokenError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <SvgIcon d={iconPaths.videoOff} size={48} />
        <p className="text-muted-foreground text-sm">{tokenError}</p>
        <button
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
          onClick={() => {
            hasFetchedRef.current = false;
            startSession();
          }}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <p className="text-muted-foreground text-sm">
          Connecting to session...
        </p>
      </div>
    );
  }

  if (!timing.canJoin) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <SvgIcon d={iconPaths.videoOff} size={48} />
        <p className="text-muted-foreground text-sm">
          This session is not yet available for joining.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        
        {isConnected ? (
          <>
            
            <video
              autoPlay
              className="h-full w-full object-cover"
              playsInline
              ref={videoRef}
            />
            
            <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1">
              <span className="font-medium text-white text-xs">
                {remoteLabel || "Remote"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 animate-pulse rounded-full bg-white/20" />
              <span className="text-white/60 text-xs">
                Waiting for participant...
              </span>
            </div>
          </div>
        )}

        
        {isConnected && (
          <div className="absolute right-4 bottom-4 aspect-[3/4] w-[180px] overflow-hidden rounded-lg border-2 border-white/30 bg-black shadow-2xl">
            <video
              autoPlay
              className="h-full w-full scale-x-[-1] object-cover"
              muted
              playsInline
              ref={localVideoRef}
            />
            <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5">
              <span className="font-bold text-[10px] text-white uppercase">
                You
              </span>
            </div>
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <SvgIcon d={iconPaths.cameraOff} size={24} />
              </div>
            )}
          </div>
        )}

        
        {isConnected && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-white text-xs">Live</span>
          </div>
        )}
      </div>

      
      {isConnected && (
        <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <SvgIcon d={iconPaths.user} />
            </div>
            <div>
              <p className="font-medium text-sm">
                {alias && role === "patient" ? alias : `You (${role})`}
              </p>
              <p className="text-muted-foreground text-xs">
                {(() => {
                  if (isCameraOn && isMicOn) {
                    return "Connected";
                  }
                  if (isCameraOn) {
                    return "Mic Off";
                  }
                  if (isMicOn) {
                    return "Camera Off";
                  }
                  return "Camera & Mic Off";
                })()}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <SvgIcon d={iconPaths.user} />
            </div>
            <div>
              <p className="font-medium text-sm">
                {remoteLabel || "Participant"}
              </p>
              <p className="text-emerald-500 text-xs">Connected</p>
            </div>
          </div>
        </div>
      )}

      
      {isConnected && (
        <div className="flex items-center justify-center gap-4">
          <button
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isMicOn
                ? "bg-secondary hover:bg-secondary/80"
                : "bg-destructive hover:bg-destructive/80"
            }`}
            onClick={handleToggleMic}
            title={isMicOn ? "Mute microphone" : "Unmute microphone"}
            type="button"
          >
            <SvgIcon d={isMicOn ? iconPaths.mic : iconPaths.micOff} />
          </button>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive transition-colors hover:bg-destructive/80"
            onClick={() => setShowEndConfirm(true)}
            title="End call"
            type="button"
          >
            <SvgIcon d={iconPaths.phoneOff} />
          </button>
          <button
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isCameraOn
                ? "bg-secondary hover:bg-secondary/80"
                : "bg-destructive hover:bg-destructive/80"
            }`}
            onClick={handleToggleCamera}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
            type="button"
          >
            <SvgIcon d={isCameraOn ? iconPaths.camera : iconPaths.cameraOff} />
          </button>
        </div>
      )}

      
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
            <p className="mb-4 text-center text-sm">
              Are you sure you want to end this session?
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-accent"
                onClick={() => setShowEndConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground text-sm transition-colors hover:bg-destructive/90"
                onClick={handleEndSession}
                type="button"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
