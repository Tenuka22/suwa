"use client";

import {
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  Video,
  VideoOff,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/design/ui/button";
import { useAttendanceTracker } from "@/hooks/use-attendance-tracker";
import { useLiveKitRoom } from "@/hooks/use-livekit-room";
import type { SessionTimingRole } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

export type VideoRoomPrivacyMode = "anonymous" | "show-info";

interface TokenResponse {
  roomName: string;
  serverUrl: string;
  session: {
    doctorId: string;
    endAt: string;
    id: string;
    patientId: string;
    startAt: string;
    status: string;
  };
  token: string;
}

interface VideoRoomProps {
  alias?: string;
  endAt: string;
  onClose: () => void;
  onFetchToken?: (sessionId: string) => Promise<TokenResponse>;
  onPrivacyModeChange?: (mode: VideoRoomPrivacyMode | null) => void;
  participantRole: SessionTimingRole;
  sessionId: string;
  startAt: string;
}

interface VideoRoomBaseProps extends VideoRoomProps {
  renderStream: (streamURL: string, mirror?: boolean) => ReactNode;
}

function ControlButton({
  disabled,
  icon,
  onPress,
  tone,
}: {
  disabled?: boolean;
  icon: ReactNode;
  onPress: () => void;
  tone: "danger" | "neutral" | "success";
}) {
  let toneClassName = "bg-foreground/6";
  if (tone === "danger") {
    toneClassName = "bg-destructive/15";
  } else if (tone === "success") {
    toneClassName = "bg-accent/12";
  }

  return (
    <Pressable
      className={`h-14 w-14 items-center justify-center rounded-full ${toneClassName} ${disabled ? "opacity-40" : ""}`.trim()}
      disabled={disabled}
      onPress={onPress}
    >
      {icon}
    </Pressable>
  );
}

function ParticipantFallback({
  label,
  subtitle,
}: {
  label: string;
  subtitle: string;
}) {
  return (
    <View className="items-center gap-3 px-6">
      <View className="rounded-full bg-accent/10 p-4">
        <Shield className="text-accent" size={28} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-center font-poppins-medium text-base text-foreground">
          {label}
        </Text>
        <Text className="text-center text-sm leading-5 text-foreground-muted">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function ParticipantTile({
  label,
  renderStream,
  streamURL,
  subtitle,
}: {
  label: string;
  renderStream: (streamURL: string, mirror?: boolean) => ReactNode;
  streamURL: string;
  subtitle: string;
}) {
  return (
    <View
      className="flex-1 overflow-hidden rounded-3xl border border-border bg-background-elevated"
      style={{ minHeight: 240 }}
    >
      <View className="absolute left-4 top-4 z-10 rounded-full bg-black/45 px-3 py-1.5">
        <Text className="font-poppins-medium text-xs text-white">{label}</Text>
      </View>

      {streamURL ? (
        <View className="flex-1 bg-black">{renderStream(streamURL)}</View>
      ) : (
        <View className="flex-1 items-center justify-center bg-foreground/5">
          <ParticipantFallback label={label} subtitle={subtitle} />
        </View>
      )}
    </View>
  );
}

function PrivacyChoiceModal({
  busy,
  onSelect,
  visible,
}: {
  busy: boolean;
  onSelect: (mode: VideoRoomPrivacyMode) => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        <View
          className="w-full rounded-3xl border border-border bg-background p-6"
          style={{ maxWidth: 480 }}
        >
          <View className="items-center gap-3 p-2">
            <View className="rounded-full bg-accent/10 p-4">
              <Shield className="text-accent" size={28} />
            </View>
            <View className="gap-1">
              <Text className="text-center font-serif text-2xl text-primary">
                Choose how to join
              </Text>
              <Text className="text-center text-sm leading-5 text-foreground-muted">
                Join anonymously with audio only, or share your profile details
                with the doctor.
              </Text>
            </View>
          </View>

          <View className="mt-6 gap-3">
            <Pressable
              className={`rounded-3xl border border-border bg-background-elevated p-4 ${busy ? "opacity-60" : ""}`.trim()}
              disabled={busy}
              onPress={() => onSelect("anonymous")}
            >
              <View className="flex-row items-center gap-3">
                <View className="rounded-full bg-foreground/6 p-3">
                  <VideoOff className="text-foreground" size={20} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-poppins-medium text-base text-foreground">
                    Stay anonymous
                  </Text>
                  <Text className="text-sm leading-5 text-foreground-muted">
                    Your camera stays off. The doctor only gets your audio.
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              className={`rounded-3xl border border-border bg-background-elevated p-4 ${busy ? "opacity-60" : ""}`.trim()}
              disabled={busy}
              onPress={() => onSelect("show-info")}
            >
              <View className="flex-row items-center gap-3">
                <View className="rounded-full bg-accent/10 p-3">
                  <Video className="text-accent" size={20} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-poppins-medium text-base text-foreground">
                    Show info to doctor
                  </Text>
                  <Text className="text-sm leading-5 text-foreground-muted">
                    Enable video and allow your saved details to be shared.
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          {busy ? (
            <View className="mt-5 flex-row items-center justify-center gap-3">
              <ActivityIndicator color="#2d3e35" size="small" />
              <Text className="font-poppins-medium text-sm text-foreground-muted">
                Joining session...
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function VideoRoomBase(props: VideoRoomBaseProps) {
  const {
    alias,
    endAt,
    onClose,
    onFetchToken,
    onPrivacyModeChange,
    participantRole,
    renderStream,
    sessionId,
  } = props;
  const requiresPrivacyChoice = participantRole === "patient";
  const [privacyMode, setPrivacyMode] = useState<VideoRoomPrivacyMode | null>(
    requiresPrivacyChoice ? null : "show-info"
  );
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(
    requiresPrivacyChoice
  );
  const [joinError, setJoinError] = useState<string | null>(null);

  const liveKit = useLiveKitRoom({
    onDisconnected: () => {
      if (requiresPrivacyChoice) {
        setPrivacyMode(null);
        setIsPrivacyModalOpen(true);
        onPrivacyModeChange?.(null);
      }
    },
  });

  const {
    connect,
    disconnect,
    error,
    isCameraEnabled,
    isConnected,
    isConnecting,
    isMicEnabled,
    localStreamURL,
    remoteParticipants,
    toggleCamera,
    toggleMic,
  } = liveKit;

  useAttendanceTracker({
    disabled: false,
    endAt,
    isConnected,
    role: participantRole,
    sessionId,
  });

  const fetchToken = useMemo(
    () =>
      onFetchToken ??
      ((currentSessionId: string) =>
        orpc.getLiveKitToken.call({ sessionId: currentSessionId })),
    [onFetchToken]
  );

  const roomMessage = useMemo(() => {
    if (remoteParticipants.length === 0) {
      return `Waiting for the other participant in ${sessionId.slice(0, 8)}`;
    }

    return `Connected with ${remoteParticipants.length} participant${remoteParticipants.length === 1 ? "" : "s"}`;
  }, [remoteParticipants.length, sessionId]);

  const handleJoin = useCallback(
    async (mode: VideoRoomPrivacyMode) => {
      if (isConnecting) {
        return;
      }

      setJoinError(null);

      try {
        const connection = await fetchToken(sessionId);
        const cameraEnabled =
          !(participantRole === "patient" && mode === "anonymous");

        await connect(connection.serverUrl, connection.token, {
          cameraEnabled,
          microphoneEnabled: true,
        });

        setPrivacyMode(mode);
        setIsPrivacyModalOpen(false);
        onPrivacyModeChange?.(mode);
      } catch (joinFailure) {
        setJoinError(
          joinFailure instanceof Error
            ? joinFailure.message
            : "Failed to join session"
        );
      }
    },
    [
      connect,
      fetchToken,
      isConnecting,
      onPrivacyModeChange,
      participantRole,
      sessionId,
    ]
  );

  const joinStartedRef = useRef(false);
  useEffect(() => {
    if (requiresPrivacyChoice || joinStartedRef.current || isConnected || isConnecting) {
      return;
    }
    joinStartedRef.current = true;
    handleJoin("show-info").catch(() => undefined);
  }, [handleJoin, isConnected, isConnecting, requiresPrivacyChoice]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    onClose();
  }, [disconnect, onClose]);

  const handleCameraToggle = useCallback(async () => {
    if (participantRole === "patient" && privacyMode === "anonymous") {
      return;
    }

    await toggleCamera();
  }, [participantRole, privacyMode, toggleCamera]);

  const activeError = joinError ?? error;
  const localPreviewLabel = alias ? `You (${alias})` : "You";
  let sessionBadge = "Secure consultation";
  if (participantRole === "patient" && privacyMode === "anonymous") {
    sessionBadge = "Anonymous mode: audio only";
  } else if (
    participantRole === "patient" &&
    privacyMode === "show-info"
  ) {
    sessionBadge = "Profile sharing enabled";
  }

  let joinButtonLabel = "Choose how to join";
  if (privacyMode === "anonymous") {
    joinButtonLabel = "Join anonymously";
  } else if (privacyMode === "show-info") {
    joinButtonLabel = "Join with shared info";
  }

  if (!isConnected) {
    return (
      <View className="flex-1 bg-background px-4 py-5">
        <View
          className="flex-1 justify-center self-center"
          style={{ maxWidth: 760, width: "100%" }}
        >
          <View className="rounded-3xl border border-border bg-background-elevated p-6">
            <View className="items-center gap-4">
              <View className="rounded-full bg-accent/10 p-4">
                <Shield className="text-accent" size={30} />
              </View>
              <View className="items-center gap-1">
                <Text className="text-center font-serif text-2xl text-primary">
                  Ready to join
                </Text>
                <Text className="text-center text-sm leading-5 text-foreground-muted">
                  Session {sessionId.slice(0, 8)} is ready. Join when you are
                  comfortable.
                </Text>
              </View>
            </View>

            {activeError ? (
              <View className="mt-5 rounded-2xl bg-destructive/10 px-4 py-3">
                <Text className="text-center font-poppins-medium text-sm text-destructive">
                  {activeError}
                </Text>
              </View>
            ) : null}

            <View className="mt-6 gap-3">
              {requiresPrivacyChoice ? (
                <Button
                  disabled={isConnecting}
                  onPress={() => setIsPrivacyModalOpen(true)}
                >
                  {joinButtonLabel}
                </Button>
              ) : (
                <Button disabled={isConnecting} onPress={() => handleJoin("show-info")}>
                  {isConnecting ? "Joining..." : "Join session"}
                </Button>
              )}

              <Button onPress={onClose} variant="outline">
                Go back
              </Button>
            </View>
          </View>
        </View>

        {requiresPrivacyChoice ? (
          <PrivacyChoiceModal
            busy={isConnecting}
            onSelect={handleJoin}
            visible={isPrivacyModalOpen}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 py-4">
      <View
        className="flex-1 self-center"
        style={{ maxWidth: 840, width: "100%" }}
      >
        <View className="rounded-2xl bg-accent/8 px-4 py-3">
          <Text className="text-center font-poppins-medium text-sm text-foreground">
            {sessionBadge}
          </Text>
        </View>

        <View className="mt-4 flex-1 overflow-hidden rounded-3xl border border-border bg-background-elevated p-3">
          {remoteParticipants.length > 0 ? (
            <View className="flex-1 gap-3">
              {remoteParticipants.map((participant) => (
                <ParticipantTile
                  key={participant.identity}
                  label={participant.displayName}
                  renderStream={renderStream}
                  streamURL={participant.streamURL}
                  subtitle={
                    participant.streamURL
                      ? "Video connected"
                      : "Camera is off or still connecting"
                  }
                />
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center rounded-3xl bg-foreground/5">
              <ParticipantFallback
                label="Waiting for participant"
                subtitle={roomMessage}
              />
            </View>
          )}

          {localStreamURL ? (
            <View className="absolute right-5 top-5 h-32 w-24 overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
              {renderStream(localStreamURL, true)}
              <View className="absolute bottom-0 left-0 right-0 bg-black/45 px-2 py-1.5">
                <Text className="font-poppins-medium text-xs text-white">
                  {localPreviewLabel}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {activeError ? (
          <View className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3">
            <Text className="text-center font-poppins-medium text-sm text-destructive">
              {activeError}
            </Text>
          </View>
        ) : null}

        <View className="mt-4 rounded-3xl border border-border bg-background-elevated px-5 py-5">
          <View className="items-center gap-1">
            <Text className="font-poppins-medium text-base text-foreground">
              {roomMessage}
            </Text>
            <Text className="text-sm text-foreground-muted">
              Session ID: {sessionId.slice(0, 8)}
            </Text>
          </View>

          <View className="mt-5 flex-row items-center justify-center gap-4">
            <ControlButton
              disabled={
                participantRole === "patient" && privacyMode === "anonymous"
              }
              icon={
                isCameraEnabled ? (
                  <Video className="text-accent" size={22} />
                ) : (
                  <VideoOff className="text-destructive" size={22} />
                )
              }
              onPress={handleCameraToggle}
              tone={isCameraEnabled ? "success" : "danger"}
            />

            <ControlButton
              icon={
                isMicEnabled ? (
                  <Mic className="text-accent" size={22} />
                ) : (
                  <MicOff className="text-destructive" size={22} />
                )
              }
              onPress={toggleMic}
              tone={isMicEnabled ? "success" : "danger"}
            />

            <ControlButton
              icon={<PhoneOff className="text-destructive" size={22} />}
              onPress={handleDisconnect}
              tone="danger"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export type { VideoRoomProps };
