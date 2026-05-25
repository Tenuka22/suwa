import { Video, VideoOff } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLiveKitRoom } from "@/components/ui/use-livekit-room";
import {
  type SessionTimingRole,
  useSessionTiming,
} from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

interface VideoRoomProps {
  endAt: string;
  onClose: () => void;
  role: SessionTimingRole;
  sessionId: string;
  startAt: string;
}

export function VideoRoom({
  onClose,
  sessionId,
  startAt,
  endAt,
  role,
}: VideoRoomProps) {
  const colors = useThemeColor();
  const timing = useSessionTiming(startAt, endAt, role);
  const liveKit = useLiveKitRoom();
  const [tokenData, setTokenData] = useState<{
    token: string;
    serverUrl: string;
    roomName: string;
  } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const roleLabel = useMemo(() => {
    const map: Record<SessionTimingRole, string> = {
      patient: "Patient",
      doctor: "Doctor",
      admin: "Admin",
    };
    return map[role];
  }, [role]);

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
    if (timing.canJoin && !tokenData && !isFetchingToken) {
      fetchToken();
    }
  }, [timing.canJoin, tokenData, isFetchingToken, fetchToken]);

  useEffect(() => {
    if (tokenData && !liveKit.isConnected && !liveKit.isConnecting) {
      liveKit
        .connect(tokenData.serverUrl, tokenData.token)
        .catch(() => undefined);
    }
  }, [tokenData, liveKit]);

  const handleEndSession = useCallback(async () => {
    setIsEnding(true);
    await liveKit.disconnect();
    onClose();
  }, [liveKit, onClose]);

  if (!(timing.canJoin || liveKit.isConnected)) {
    const now = Date.now();
    const startMs = new Date(startAt).getTime();
    const opensIn = Math.max(
      0,
      Math.ceil((startMs - 30 * 60 * 1000 - now) / 60_000)
    );

    return (
      <Card className="gap-4">
        <View className="items-center gap-3 py-4">
          <VideoOff color={colors.mutedForeground} size={32} />
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
            Session Not Available
          </Text>
          <Text className="text-center font-medium font-sans text-muted-foreground text-sm">
            {opensIn > 0
              ? `The session opens in ${opensIn} minutes. You can join 30 minutes before the scheduled time.`
              : "This session has ended."}
          </Text>
        </View>
      </Card>
    );
  }

  if (tokenError) {
    return (
      <Card className="gap-4">
        <View className="items-center gap-3 py-4">
          <VideoOff color={colors.destructive} size={32} />
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
            Connection Failed
          </Text>
          <Text className="text-center font-medium font-sans text-muted-foreground text-sm">
            {tokenError}
          </Text>
          <Button onPress={fetchToken} size="sm" variant="primary">
            Retry
          </Button>
        </View>
      </Card>
    );
  }

  if (isFetchingToken || liveKit.isConnecting) {
    return (
      <Card className="gap-4">
        <View className="items-center gap-3 py-4">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text className="font-black font-sans text-foreground text-sm uppercase tracking-wider">
            Connecting to session...
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="gap-4 overflow-hidden">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Video color={colors.success} size={16} />
            <Text className="font-black font-sans text-success text-xs uppercase tracking-wider">
              Live - {roleLabel}
            </Text>
          </View>
          <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
            {liveKit.participants.length + 1} participant
            {liveKit.participants.length > 0 ? "s" : ""}
          </Text>
        </View>

        <View className="aspect-video items-center justify-center rounded-card border-2 border-border bg-black">
          {liveKit.isConnected ? (
            <View className="items-center gap-2">
              <Video color={colors.success} size={32} />
              <Text className="font-bold font-sans text-white text-xs uppercase tracking-wider">
                Video Connected
              </Text>
            </View>
          ) : (
            <ActivityIndicator color="#ffffff" size="large" />
          )}
        </View>

        {timing.mustLeave && (
          <View className="rounded-card border-2 border-destructive bg-destructive/10 px-3 py-2">
            <Text className="font-bold font-sans text-destructive text-xs uppercase tracking-wider">
              Session time has ended. Please disconnect.
            </Text>
          </View>
        )}

        {timing.timeStatus === "grace" && (
          <View className="rounded-card border-2 border-warning bg-warning/10 px-3 py-2">
            <Text className="font-bold font-sans text-warning text-xs uppercase tracking-wider">
              Grace period:{" "}
              {timing.remainingMs > 0
                ? `${Math.ceil(timing.remainingMs / 60_000)} minutes remaining`
                : "ending soon"}
            </Text>
          </View>
        )}

        <View className="flex-row gap-2">
          <Button
            className="flex-1"
            disabled={isEnding}
            onPress={handleEndSession}
            size="sm"
            variant="secondary"
          >
            {isEnding ? "Ending..." : "End Session"}
          </Button>
        </View>
      </View>
    </Card>
  );
}
