"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Copy, Shield } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { VideoRoom } from "@/components/design/ui/video-room";
import { orpc } from "@/utils/orpc";

function MockVideoRoom({
  onDisconnect,
  sessionId,
}: {
  onDisconnect: () => void;
  sessionId: string;
}) {
  return (
    <View className="flex-1 bg-background px-4 py-5">
      <Stack.Screen options={{ headerShown: false }} />
      <View
        className="flex-1 self-center"
        style={{ maxWidth: 840, width: "100%" }}
      >
        <View className="rounded-2xl bg-accent/8 px-4 py-3">
          <Text className="text-center font-poppins-medium text-foreground text-sm">
            Mock session mode
          </Text>
        </View>

        <View className="mt-4 flex-1 items-center justify-center rounded-3xl border border-border bg-background-elevated px-6">
          <View className="items-center gap-3">
            <View className="rounded-full bg-accent/10 p-4">
              <Shield className="text-accent" size={32} />
            </View>
            <View className="items-center gap-1">
              <Text className="text-center font-poppins-medium text-foreground text-lg">
                Waiting for participants
              </Text>
              <Text className="text-center text-foreground-muted text-sm leading-5">
                Mock simulation keeps the room layout usable without opening a
                real LiveKit connection.
              </Text>
            </View>
          </View>

          <View className="mt-6 rounded-2xl bg-foreground/5 px-4 py-3">
            <Text className="text-center text-foreground-muted text-sm">
              Session: {sessionId.slice(0, 8)} (mock)
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-3xl border border-border bg-background-elevated px-5 py-5">
          <View className="items-center gap-1">
            <Text className="font-poppins-medium text-base text-foreground">
              Connected - 0 participants
            </Text>
            <Text className="text-foreground-muted text-sm">
              Session ID: {sessionId.slice(0, 8)}
            </Text>
          </View>

          <View className="mt-5 items-center">
            <Pressable
              className="rounded-full bg-destructive/15 px-6 py-4"
              onPress={onDisconnect}
            >
              <Text className="font-poppins-medium text-destructive text-sm">
                End mock session
              </Text>
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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor">("patient");

  const testWindow = useMemo(() => {
    const startAt = new Date().toISOString();
    const endAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();

    return { endAt, startAt };
  }, []);

  const createSession = useMutation(
    orpc.createTestSession.mutationOptions({
      onSuccess: (result) => {
        setGeneratedSessionId(result.sessionId);
        setSessionId(result.sessionId);
      },
    })
  );

  const handleCopy = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    navigator.clipboard.writeText(generatedSessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    setActiveSessionId(null);
    setIsMock(false);
  };

  const handleJoin = () => {
    if (!sessionId) {
      return;
    }

    setIsMock(false);
    setActiveSessionId(sessionId);
  };

  const handleMockSimulation = () => {
    if (!sessionId) {
      return;
    }

    setIsMock(true);
    setActiveSessionId(sessionId);
  };

  if (activeSessionId && isMock) {
    return (
      <MockVideoRoom
        onDisconnect={handleDisconnect}
        sessionId={activeSessionId}
      />
    );
  }

  if (activeSessionId) {
    return (
      <VideoRoom
        endAt={testWindow.endAt}
        onClose={handleDisconnect}
        onFetchToken={(currentSessionId) =>
          orpc.getTestLiveKitToken.call({ sessionId: currentSessionId, role: selectedRole })
        }
        participantRole={selectedRole}
        sessionId={activeSessionId}
        startAt={testWindow.startAt}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View
        className="flex-1 gap-6 self-center px-6 py-8"
        style={{ maxWidth: 760, width: "100%" }}
      >
        <View className="items-center gap-4 pt-4">
          <View className="rounded-full bg-accent/10 p-4">
            <Shield className="text-accent" size={28} />
          </View>
          <View className="items-center gap-1">
            <Text className="font-serif text-2xl text-primary">
              Test Sessions
            </Text>
            <Text className="text-center font-sans text-foreground-muted text-sm leading-normal">
              Generate a session ID, then join with the same reusable room used
              in appointments.
            </Text>
          </View>
        </View>

          <View className="gap-6">
          <View className="gap-3">
            <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
              Join as
            </Text>
            <View className="flex-row gap-2">
              {(["patient", "doctor"] as const).map((role) => (
                <Pressable
                  className={`flex-1 items-center rounded-full border px-4 py-3 ${selectedRole === role ? "border-primary bg-primary/10" : "border-border bg-background-elevated"}`}
                  key={role}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text className={`font-poppins-medium text-sm ${selectedRole === role ? "text-primary" : "text-foreground"}`}>
                    {role}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
              Generate session
            </Text>
            <Pressable
              className={`items-center rounded-full px-6 py-4 ${createSession.isPending ? "bg-primary/60" : "bg-primary"}`}
              disabled={createSession.isPending}
              onPress={() => createSession.mutate({})}
            >
              <Text className="font-poppins-medium text-body text-primary-foreground">
                {createSession.isPending
                  ? "Creating..."
                  : "Generate Session ID"}
              </Text>
            </Pressable>

            {generatedSessionId ? (
              <View className="flex-row items-center gap-2 rounded-2xl border border-border/70 bg-background-elevated px-4 py-3">
                <Text className="flex-1 font-mono text-foreground text-xs">
                  {generatedSessionId}
                </Text>
                <Pressable
                  className="rounded-full bg-foreground/5 p-2"
                  onPress={handleCopy}
                >
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

          <View className="gap-3">
            <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
              Join session
            </Text>
            <View className="rounded-2xl border border-input bg-background-elevated px-4 py-4">
              <TextInput
                className="font-sans text-body text-foreground outline-none"
                onChangeText={setSessionId}
                placeholder="Paste or type session ID..."
                placeholderTextColor="rgba(45,62,53,0.45)"
                value={sessionId}
              />
            </View>

            <View className="gap-2">
              <Pressable
                className={`items-center rounded-full px-6 py-4 ${sessionId ? "bg-primary" : "bg-primary/60"}`}
                disabled={!sessionId}
                onPress={handleJoin}
              >
                <Text className="font-poppins-medium text-body text-primary-foreground">
                  Join Session
                </Text>
              </Pressable>

              <Pressable
                className={`items-center rounded-full border border-border bg-background-elevated px-6 py-4 ${sessionId ? "" : "opacity-60"}`.trim()}
                disabled={!sessionId}
                onPress={handleMockSimulation}
              >
                <Text className="font-poppins-medium text-body text-foreground">
                  Mock Simulation
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
