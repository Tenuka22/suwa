"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  Copy,
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  Video,
  VideoOff,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLiveKitRoom } from "@/hooks/use-livekit-room";
import { orpc } from "@/utils/orpc";

type Role = "patient" | "doctor" | "admin";

const ROLE_OPTIONS: Role[] = ["patient", "doctor", "admin"];

function TestVideoRoom({
  lk,
  isMock,
  sessionId,
  onDisconnect,
}: {
  lk: ReturnType<typeof useLiveKitRoom>;
  isMock: boolean;
  sessionId: string;
  onDisconnect: () => void;
}) {
  return (
    <View className="min-h-full flex-1 justify-between px-7 pt-8 pb-6">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 gap-xxl bg-background px-lg pt-12">
        <View className="flex-1 items-center justify-center bg-foreground/5">
          {lk.remoteParticipants.length > 0 ? (
            <View className="w-full flex-1 gap-2 p-4">
              {lk.remoteParticipants.map((p) => (
                <View
                  className="flex-1 items-center justify-center overflow-hidden rounded-3xl bg-background-elevated"
                  key={p.identity}
                >
                  {p.streamURL ? (
                    <View className="w-full flex-1" />
                  ) : (
                    <View className="items-center gap-2">
                      <View className="rounded-full bg-accent/10 p-4">
                        <Shield className="text-accent" size={32} />
                      </View>
                      <Text className="font-poppins-medium text-foreground-muted text-sm">
                        {p.displayName}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center gap-3">
              <View className="rounded-full bg-accent/10 p-4">
                <Shield className="text-accent" size={32} />
              </View>
              <Text className="font-poppins-medium text-foreground-muted">
                {isMock
                  ? "Mock simulation — no remote participants"
                  : `Waiting for participants in "${sessionId.slice(0, 8)}"`}
              </Text>
              {lk.localStreamURL ? (
                <Text className="text-foreground-muted text-micro">
                  Camera active
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {lk.localStreamURL ? (
          <View className="absolute top-20 right-4 h-32 w-24 overflow-hidden rounded-2xl border-2 border-border bg-background-elevated shadow-lg" />
        ) : null}

        {lk.error ? (
          <View className="mx-4 mt-2 rounded-2xl bg-destructive/10 p-3">
            <Text className="text-center font-poppins-medium text-destructive text-sm">
              {lk.error}
            </Text>
          </View>
        ) : null}

        <View className="gap-4 border-border/50 border-t bg-background-elevated px-6 py-6">
          <View className="size-full items-center gap-1">
            <Text className="font-poppins-medium text-foreground-muted text-sm">
              {lk.isConnecting
                ? "Connecting..."
                : `Connected — ${lk.remoteParticipants.length} participant${lk.remoteParticipants.length === 1 ? "" : "s"}`}
            </Text>
            <Text className="text-foreground-muted text-micro">
              Session: {sessionId.slice(0, 8)}
              {isMock ? " (mock)" : ""}
            </Text>
          </View>

          <View className="flex-row justify-center gap-4">
            <Pressable
              className={`h-14 w-14 items-center justify-center rounded-full ${lk.isCameraEnabled ? "bg-accent/10" : "bg-destructive/10"}`}
              onPress={lk.toggleCamera}
            >
              {lk.isCameraEnabled ? (
                <Video className="text-accent" size={22} />
              ) : (
                <VideoOff className="text-destructive" size={22} />
              )}
            </Pressable>

            <Pressable
              className={`h-14 w-14 items-center justify-center rounded-full ${lk.isMicEnabled ? "bg-accent/10" : "bg-destructive/10"}`}
              onPress={lk.toggleMic}
            >
              {lk.isMicEnabled ? (
                <Mic className="text-accent" size={22} />
              ) : (
                <MicOff className="text-destructive" size={22} />
              )}
            </Pressable>

            <Pressable
              className="h-14 w-14 items-center justify-center rounded-full bg-destructive/20"
              onPress={onDisconnect}
            >
              <PhoneOff className="text-destructive" size={22} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TestSessionsScreen() {
  const [sessionId, setSessionId] = useState("");
  const [generatedSessionId, setGeneratedSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [isConnected, setIsConnected] = useState(false);
  const [isMock, setIsMock] = useState(false);

  const lk = useLiveKitRoom({
    onConnected: () => setIsConnected(true),
    onDisconnected: () => {
      setIsConnected(false);
      setIsMock(false);
    },
  });

  const createSession = useMutation(
    orpc.createTestSession.mutationOptions({
      onSuccess: (result) => {
        setGeneratedSessionId(result.sessionId);
        setSessionId(result.sessionId);
      },
    })
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!sessionId) {
      return;
    }

    try {
      const { token, serverUrl } = await orpc.getTestLiveKitToken.call({
        sessionId,
      });
      await lk.connect(serverUrl, token);
    } catch {
      // Token fetch or connection failed silently
    }
  };

  const handleDisconnect = async () => {
    await lk.disconnect();
    setIsConnected(false);
    setIsMock(false);
  };

  const handleMockSimulation = () => {
    setIsMock(true);
    setIsConnected(true);
  };

  if (isConnected) {
    return (
      <TestVideoRoom
        isMock={isMock}
        lk={lk}
        onDisconnect={handleDisconnect}
        sessionId={sessionId}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 gap-6 px-6 py-8">
        {/* Header */}
        <View className="items-center gap-4 pt-4">
          <View className="rounded-full bg-accent/10 p-4">
            <Shield className="text-accent" size={28} />
          </View>
          <View className="items-center gap-1 size-full">
            <Text className="font-serif text-2xl text-primary">
              Test Sessions
            </Text>
            <Text className="text-center font-sans text-foreground-muted text-sm leading-normal">
              Generate or enter a session ID to test 2-way video calling.
            </Text>
          </View>
        </View>

        {/* Role selector */}
        <View className="gap-2">
          <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
            Join as
          </Text>
          <View className="flex-row gap-2">
            {ROLE_OPTIONS.map((role) => (
              <Pressable
                className={`flex-1 rounded-full border px-4 py-3 ${selectedRole === role ? "border-primary bg-primary" : "border-border bg-background-elevated"}`}
                key={role}
                onPress={() => setSelectedRole(role)}
              >
                <Text
                  className={`text-center font-poppins-medium text-sm capitalize ${selectedRole === role ? "text-primary-foreground" : "text-foreground-muted"}`}
                >
                  {role}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Generate + Join side by side on wider screens */}
        <View className="gap-6 md:flex-row md:gap-6">
          {/* Generate session */}
          <View className="gap-3 md:flex-1">
            <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
              Generate session
            </Text>
            <Pressable
              className={`items-center rounded-full px-6 py-4 ${createSession.isPending ? "bg-primary/60" : "bg-primary"}`}
              disabled={createSession.isPending}
              onPress={() => createSession.mutate({})}
            >
              <Text className="font-poppins-medium text-body text-primary-foreground">
                {createSession.isPending ? "Creating..." : "Generate Session ID"}
              </Text>
            </Pressable>
            {generatedSessionId ? (
              <View className="flex-row items-center gap-2 rounded-2xl border border-border/70 bg-background-elevated px-4 py-3">
                <Text className="flex-1 break-all font-mono text-foreground text-xs">
                  {generatedSessionId}
                </Text>
                <Pressable className="rounded-full bg-foreground/5 p-2" onPress={handleCopy}>
                  <Copy className="text-foreground-muted" size={16} />
                </Pressable>
                {copied ? (
                  <Text className="font-poppins-medium text-emerald-600 text-xs">
                    Copied!
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Join session */}
          <View className="gap-3 md:flex-1">
            <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
              Join session
            </Text>
            <View className="rounded-xl border-2 border-input bg-background-elevated px-4 py-4">
              <TextInput
                className="font-sans text-body text-foreground outline-none"
                onChangeText={setSessionId}
                placeholder="Paste or type session ID..."
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={sessionId}
              />
            </View>
            <View className="gap-2">
              <Pressable
                className={`items-center rounded-full px-6 py-4 ${!sessionId || lk.isConnecting ? "bg-primary/60" : "bg-primary"}`}
                disabled={!sessionId || lk.isConnecting}
                onPress={handleJoin}
              >
                {lk.isConnecting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="font-poppins-medium text-body text-primary-foreground">
                    {`Join as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
                  </Text>
                )}
              </Pressable>
              <Pressable
                className="items-center rounded-full border border-border bg-background-elevated px-6 py-4"
                onPress={handleMockSimulation}
              >
                <Text className="font-poppins-medium text-body text-foreground">
                  Mock Simulation (Save Credits)
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
