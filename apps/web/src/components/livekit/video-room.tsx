import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent } from "@zen-doc/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@zen-doc/ui/components/dialog";
import { Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useLiveKitRoomWeb } from "@/hooks/use-livekit-room";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

interface VideoRoomProps {
  endAt: string;
  onClose: () => void;
  open: boolean;
  role: "doctor" | "patient" | "admin";
  sessionId: string;
  startAt: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

interface VideoRoomContentProps {
  fetchToken: () => Promise<void>;
  handleEndSession: () => Promise<void>;
  isFetchingToken: boolean;
  liveKit: ReturnType<typeof useLiveKitRoomWeb>;
  setShowEndConfirm: (v: boolean) => void;
  showEndConfirm: boolean;
  timing: ReturnType<typeof useSessionTiming>;
  tokenError: string | null;
}

function VideoRoomContent({
  fetchToken,
  handleEndSession,
  isFetchingToken,
  liveKit,
  setShowEndConfirm,
  showEndConfirm,
  timing,
  tokenError,
}: VideoRoomContentProps) {
  if (tokenError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
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
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <p className="text-muted-foreground text-sm">
          Connecting to session...
        </p>
      </div>
    );
  }

  if (timing.canJoin) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
          {liveKit.isConnected ? (
            <>
              <video
                autoPlay
                className="h-full w-full object-cover"
                muted
                playsInline
                ref={liveKit.videoRef}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-white text-xs">
                  {liveKit.participantCount + 1} participant
                  {liveKit.participantCount === 0 ? "" : "s"}
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}
        </div>

        {timing.mustLeave && (
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardContent className="p-3">
              <p className="text-rose-600 text-sm dark:text-rose-400">
                Session time has ended. Please disconnect.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          {showEndConfirm ? (
            <>
              <Button
                onClick={() => setShowEndConfirm(false)}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={liveKit.isConnecting}
                onClick={handleEndSession}
                size="sm"
                variant="destructive"
              >
                End Session
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowEndConfirm(true)}
              size="sm"
              variant="outline"
            >
              <VideoOff className="mr-1 h-3 w-3" />
              End Session
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <VideoOff className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm">
        This session is not yet available for joining.
      </p>
    </div>
  );
}

export function VideoRoomWeb({
  onClose,
  open,
  sessionId,
  startAt,
  endAt,
  role,
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
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const fetchToken = useCallback(async () => {
    if (tokenData || isFetchingToken) {
      return;
    }
    setIsFetchingToken(true);
    setTokenError(null);
    try {
      const result = await orpc.getLiveKitToken.call({ sessionId });
      setTokenData(result);
    } catch (err) {
      setTokenError(
        err instanceof Error ? err.message : "Failed to get session token"
      );
    } finally {
      setIsFetchingToken(false);
    }
  }, [sessionId, tokenData, isFetchingToken]);

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
    await liveKit.disconnect();
    setTokenData(null);
    setTokenError(null);
    setShowEndConfirm(false);
    onClose();
  }, [liveKit, onClose]);

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
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-medium text-rose-600 text-xs dark:text-rose-400">
          <VideoOff className="h-3 w-3" />
          Must leave
        </span>
      );
    }
    if (timing.timeStatus === "grace") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-medium text-amber-600 text-xs dark:text-amber-400">
          Grace period ({timing.formattedRemaining})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
        <Video className="h-3 w-3" />
        Live
      </span>
    );
  }, [timing]);

  return (
    <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-emerald-500" />
            Video Session
            {statusBadge}
          </DialogTitle>
        </DialogHeader>

        <VideoRoomContent
          fetchToken={fetchToken}
          handleEndSession={handleEndSession}
          isFetchingToken={isFetchingToken}
          liveKit={liveKit}
          setShowEndConfirm={setShowEndConfirm}
          showEndConfirm={showEndConfirm}
          timing={timing}
          tokenError={tokenError}
        />
      </DialogContent>
    </Dialog>
  );
}

interface SessionJoinButtonProps {
  endAt: string;
  label?: string;
  onJoin: () => void;
  role?: "doctor" | "patient" | "admin";
  startAt: string;
}

export function SessionJoinButton({
  endAt,
  label = "Join Session",
  onJoin,
  startAt,
  role = "doctor",
}: SessionJoinButtonProps) {
  const timing = useSessionTiming(startAt, endAt, role);

  if (timing.canJoin) {
    return (
      <Button onClick={onJoin} size="sm" variant="default">
        <Video className="mr-1 h-3 w-3" />
        {label}
      </Button>
    );
  }

  if (timing.timeStatus === "before") {
    const startMs = new Date(startAt).getTime();
    const opensInMinutes = Math.max(
      0,
      Math.ceil((startMs - 30 * 60 * 1000 - Date.now()) / 60_000)
    );
    return (
      <span className="text-muted-foreground text-xs">
        Opens in {formatDuration(opensInMinutes)}
      </span>
    );
  }

  return null;
}
