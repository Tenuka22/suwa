import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
  Video,
  VideoOff,
} from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { RTCView } from "react-native-webrtc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAttendanceTracker } from "@/hooks/use-attendance-tracker";
import { useLiveKitRoom } from "@/hooks/use-livekit-room";
import {
  type SessionTimingRole,
  useSessionTiming,
} from "@/hooks/use-session-timing";
import { formatParticipantLabel } from "@/utils/format-participant";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

interface VideoRoomProps {
  alias?: string;
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
  role: SessionTimingRole;
  sessionId: string;
  startAt: string;
}

export function VideoRoom({
  alias,
  onClose,
  sessionId,
  startAt,
  endAt,
  role,
  onFetchToken,
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

  const [showPrivacyPrompt, setShowPrivacyPrompt] = useState(
    role === "patient"
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showConfirmToggle, setShowConfirmToggle] = useState(false);

  const remoteParticipant = liveKit.remoteParticipants[0];
  const hasRemoteVideo = !!remoteParticipant?.streamURL;
  const hasRemoteConnected = liveKit.remoteParticipants.length > 0;

  const _displayName = isAnonymous && alias ? alias : formatRoleLabel(role);

  useAttendanceTracker({
    isConnected: liveKit.isConnected,
    sessionId,
    endAt,
    role,
  });

  const handlePrivacyChoice = useCallback(
    async (anonymous: boolean) => {
      setIsAnonymous(anonymous);
      setShowPrivacyPrompt(false);

      if (anonymous) {
        await liveKit.toggleCamera();
      }
    },
    [liveKit]
  );

  const handleTogglePrivacy = useCallback(async () => {
    if (isAnonymous) {
      await liveKit.toggleCamera();
    }
    setIsAnonymous((prev) => !prev);
    setShowConfirmToggle(false);
  }, [isAnonymous, liveKit]);

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
    if (
      timing.canJoin &&
      !tokenData &&
      !isFetchingToken &&
      !showPrivacyPrompt
    ) {
      fetchToken();
    }
  }, [
    timing.canJoin,
    tokenData,
    isFetchingToken,
    fetchToken,
    showPrivacyPrompt,
  ]);

  useEffect(() => {
    if (tokenData && !liveKit.isConnected && !liveKit.isConnecting) {
      liveKit
        .connect(tokenData.serverUrl, tokenData.token)
        .catch(() => undefined);
    }
  }, [tokenData, liveKit]);

  const handleEndSession = useCallback(async () => {
    await orpc.recordAttendanceEvent
      .call({ sessionId, event: "leave" })
      .catch(() => undefined);
    await liveKit.disconnect();
    onClose();
  }, [liveKit, onClose, sessionId]);

  if (showConfirmToggle) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Card className="w-full gap-6 p-6">
          <View className="items-center gap-2">
            <EyeOff color={colors.foreground} size={32} />
            <Text className="text-center font-black font-sans text-foreground text-lg uppercase tracking-tight">
              {isAnonymous ? "Show Identity" : "Stay Anonymous"}
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm">
              {isAnonymous
                ? `Your alias "${alias}" will no longer be used. Your real role will be visible.`
                : `You will appear as "${alias}" and your camera will be turned off.`}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              onPress={() => setShowConfirmToggle(false)}
              size="sm"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onPress={handleTogglePrivacy}
              size="sm"
              variant="primary"
            >
              Confirm
            </Button>
          </View>
        </Card>
      </View>
    );
  }

  if (showPrivacyPrompt) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Card className="w-full gap-6 p-6">
          <View className="items-center gap-3">
            <Eye color={colors.foreground} size={40} />
            <Text className="text-center font-black font-sans text-foreground text-xl uppercase tracking-tight">
              Join Anonymously?
            </Text>
            <Text className="text-center font-medium font-sans text-muted-foreground text-sm leading-5">
              {alias
                ? `You will appear as "${alias}" with your camera off. The doctor will not see your real name.`
                : "Your camera will be turned off and you will appear as a patient."}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              onPress={() => handlePrivacyChoice(true)}
              size="sm"
              variant="secondary"
            >
              <EyeOff color={colors.secondaryForeground} size={14} />
              Stay Hidden
            </Button>
            <Button
              className="flex-1"
              onPress={() => handlePrivacyChoice(false)}
              size="sm"
              variant="primary"
            >
              Join Normally
            </Button>
          </View>
        </Card>
      </View>
    );
  }

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

  const remoteLabel = formatParticipantLabel(remoteParticipant?.identity ?? "");

  let remoteContent: React.ReactNode;
  if (liveKit.isConnected && hasRemoteVideo) {
    remoteContent = (
      <RTCView
        mirror={false}
        objectFit="cover"
        streamURL={remoteParticipant.streamURL}
        style={{ height: "100%", width: "100%" }}
        zOrder={0}
      />
    );
  } else if (liveKit.isConnected && hasRemoteConnected) {
    remoteContent = (
      <View className="flex-1 items-center justify-center gap-2">
        <User color="white" size={48} />
        <Text className="font-bold font-sans text-sm text-white">
          {remoteLabel} connected
        </Text>
        <Text className="font-medium font-sans text-white/60 text-xs">
          Audio only - waiting for video...
        </Text>
      </View>
    );
  } else if (liveKit.isConnected) {
    remoteContent = (
      <View className="flex-1 items-center justify-center gap-2">
        <User color="white" size={48} />
        <Text className="font-bold font-sans text-sm text-white">
          Waiting for {remoteLabel}...
        </Text>
        <Text className="font-medium font-sans text-white/60 text-xs">
          No one has joined yet
        </Text>
      </View>
    );
  } else {
    remoteContent = (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }

  let localPreview: React.ReactNode = null;
  if (liveKit.isConnected && !isAnonymous) {
    let pipContent: React.ReactNode;
    if (liveKit.localStreamURL) {
      pipContent = (
        <RTCView
          mirror
          objectFit="cover"
          streamURL={liveKit.localStreamURL}
          style={{ height: "100%", width: "100%" }}
          zOrder={1}
        />
      );
    } else if (liveKit.isCameraEnabled) {
      pipContent = (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ffffff" size="small" />
        </View>
      );
    } else {
      pipContent = (
        <View className="flex-1 items-center justify-center bg-gray-900">
          <CameraOff color="white" size={20} />
        </View>
      );
    }

    localPreview = (
      <View className="absolute top-3 right-3 aspect-[3/4] w-[30%] overflow-hidden rounded-lg border-2 border-white/30 bg-black">
        {pipContent}
        <View className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5">
          <Text className="font-bold font-sans text-[8px] text-white uppercase">
            You
          </Text>
        </View>
      </View>
    );
  }

  const anonymousPlaceholder =
    liveKit.isConnected && isAnonymous ? (
      <View className="absolute top-3 right-3 aspect-[3/4] w-[30%] items-center justify-center overflow-hidden rounded-lg border-2 border-purple-500/50 bg-gray-900">
        <EyeOff color="#a78bfa" size={24} />
        <Text className="mt-1 font-bold font-sans text-[9px] text-purple-300 uppercase">
          Hidden
        </Text>
      </View>
    ) : null;

  let statusDotColor: string;
  if (isAnonymous) {
    statusDotColor = "bg-purple-500";
  } else if (liveKit.isCameraEnabled) {
    statusDotColor = "bg-emerald-500";
  } else {
    statusDotColor = "bg-muted-foreground";
  }

  return (
    <View className="flex-1 gap-3">
      <View className="relative aspect-video w-full overflow-hidden rounded-card bg-black">
        {remoteContent}

        {remoteParticipant && (
          <View className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5">
            <Text className="font-bold font-sans text-[10px] text-white drop-shadow-sm">
              {remoteParticipant.isAnonymous
                ? remoteParticipant.displayName
                : remoteLabel}
            </Text>
            {remoteParticipant.isAnonymous && (
              <Text className="font-bold font-sans text-[7px] text-purple-300 uppercase tracking-wider">
                Anonymous
              </Text>
            )}
          </View>
        )}

        <View className="absolute top-2 left-2">
          <View
            className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${
              liveKit.isConnected ? "bg-emerald-500/80" : "bg-amber-500/80"
            }`}
          >
            <View className="h-1.5 w-1.5 rounded-full bg-white" />
            <Text className="font-bold font-sans text-[9px] text-white uppercase tracking-wider">
              {liveKit.isConnected ? "Connected" : "Connecting"}
            </Text>
          </View>
        </View>

        {localPreview}
        {anonymousPlaceholder}
      </View>

      <View className="flex-row items-center justify-center gap-4 py-2">
        <Button
          className="h-12 w-12 rounded-full"
          icon={
            liveKit.isMicEnabled ? (
              <Mic color="white" size={20} />
            ) : (
              <MicOff color="white" size={20} />
            )
          }
          onPress={liveKit.toggleMic}
          size="sm"
          variant={liveKit.isMicEnabled ? "primary" : "destructive"}
        />
        <Button
          className="h-12 w-12 rounded-full"
          icon={
            liveKit.isCameraEnabled ? (
              <Camera color="white" size={20} />
            ) : (
              <CameraOff color="white" size={20} />
            )
          }
          onPress={liveKit.toggleCamera}
          size="sm"
          variant={liveKit.isCameraEnabled ? "primary" : "destructive"}
        />
        <Button
          className="h-12 w-12 rounded-full"
          icon={<PhoneOff color="white" size={20} />}
          onPress={handleEndSession}
          size="sm"
          variant="destructive"
        />
        {role === "patient" && (
          <Button
            className="h-12 w-12 rounded-full"
            icon={
              isAnonymous ? (
                <EyeOff color="white" size={20} />
              ) : (
                <Eye color="white" size={20} />
              )
            }
            onPress={() => setShowConfirmToggle(true)}
            size="sm"
            variant={isAnonymous ? "secondary" : "destructive"}
          />
        )}
      </View>

      {liveKit.isConnected && (
        <Card className="gap-2">
          <View className="flex-row items-center gap-2">
            <Video color={colors.foreground} size={14} />
            <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
              Session Participants
            </Text>
          </View>
          <View className="gap-1">
            <View className="flex-row items-center gap-2 rounded-lg bg-muted/10 px-3 py-2">
              <View className={`h-2 w-2 rounded-full ${statusDotColor}`} />
              <View className="flex-1 flex-row items-center gap-1.5">
                <Text className="font-bold font-sans text-foreground text-xs">
                  {isAnonymous && alias
                    ? alias
                    : `You (${formatRoleLabel(role)})`}
                </Text>
                {isAnonymous && <EyeOff color="#a78bfa" size={10} />}
              </View>
              <Text className="font-medium font-sans text-[10px] text-success uppercase">
                {(() => {
                  if (isAnonymous) {
                    return "Anonymous";
                  }
                  if (liveKit.isCameraEnabled && liveKit.isMicEnabled) {
                    return "Connected";
                  }
                  if (liveKit.isCameraEnabled) {
                    return "Mic Off";
                  }
                  return "Camera Off";
                })()}
              </Text>
            </View>
            {remoteParticipant && (
              <View className="flex-row items-center gap-2 rounded-lg bg-muted/10 px-3 py-2">
                <View className="h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="flex-1 font-bold font-sans text-foreground text-xs">
                  {remoteLabel}
                </Text>
                <Text className="font-medium font-sans text-[10px] text-success uppercase">
                  {hasRemoteVideo ? "Video" : "Audio Only"}
                </Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {timing.mustLeave && (
        <Card className="border-2 border-destructive bg-destructive/10">
          <View className="px-3 py-2">
            <Text className="font-bold font-sans text-destructive text-xs uppercase tracking-wider">
              Session time has ended. Please disconnect.
            </Text>
          </View>
        </Card>
      )}

      {timing.timeStatus === "grace" && (
        <Card className="border-2 border-warning bg-warning/10">
          <View className="px-3 py-2">
            <Text className="font-bold font-sans text-warning text-xs uppercase tracking-wider">
              Grace period:{" "}
              {timing.remainingMs > 0
                ? `${Math.ceil(timing.remainingMs / 60_000)} minutes remaining`
                : "ending soon"}
            </Text>
          </View>
        </Card>
      )}
    </View>
  );
}

function formatRoleLabel(role: SessionTimingRole): string {
  const map: Record<SessionTimingRole, string> = {
    patient: "Patient",
    doctor: "Doctor",
    admin: "Admin",
  };
  return map[role];
}
