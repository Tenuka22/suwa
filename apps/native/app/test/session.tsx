"use client";

import { Stack } from "expo-router";
import { Video } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/design/ui/button";
import { Card } from "@/components/design/ui/card";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { VideoRoom } from "@/components/design/ui/video-room";
import { orpc } from "@/utils/orpc";

export default function TestSessionScreen() {
  const [sessionId, setSessionId] = useState("");
  const [activeSession, setActiveSession] = useState<{
    id: string;
    isMock: boolean;
  } | null>(null);
  const [alias, setAlias] = useState<string | undefined>(undefined);
  const [selectedRole, setSelectedRole] = useState<
    "patient" | "doctor" | "admin"
  >("patient");

  useEffect(() => {
    orpc.getPatientProfile
      .call()
      .then((profile) => {
        if (profile?.alias) {
          setAlias(profile.alias);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleJoin = useCallback(() => {
    if (!sessionId.trim()) {
      return;
    }
    setActiveSession({ id: sessionId.trim(), isMock: false });
  }, [sessionId]);

  if (activeSession) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, title: "Test Session" }} />
        <Screen contentClassName="flex-1 bg-black">
          <VideoRoom
            alias={alias}
            endAt={new Date(Date.now() + 3_600_000).toISOString()}
            isMock={activeSession.isMock}
            onClose={() => setActiveSession(null)}
            onFetchToken={(sid: string) =>
              orpc.getTestLiveKitToken.call({ sessionId: sid })
            }
            role={selectedRole}
            sessionId={activeSession.id}
            startAt={new Date().toISOString()}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-section px-page py-page bg-background">
        <View className="mb-2 gap-2">
          <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
            Test Lab
          </Text>
          <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
            Video Session
          </Text>
          <Text className="mt-1 font-normal font-sans text-base text-muted-foreground leading-6">
            Enter a session ID from the admin dashboard to join as a patient.
          </Text>
        </View>

        <Card className="gap-4">
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Video className="text-foreground" size={20} />
              <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
                Join Session
              </Text>
            </View>

            <Input
              label="Session ID"
              onChangeText={setSessionId}
              placeholder="Paste a session ID..."
              value={sessionId}
            />

            <View className="gap-2">
              <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                Join as
              </Text>
              <View className="flex-row gap-2">
                {(["patient", "doctor", "admin"] as const).map((role) => (
                  <Button
                    className="flex-1"
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    size="sm"
                    variant={selectedRole === role ? "primary" : "secondary"}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </View>
            </View>

            <Button
              className="w-full"
              disabled={!sessionId.trim()}
              icon={<Video className="text-primaryForeground" size={16} />}
              onPress={handleJoin}
            >
              Join as{" "}
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Button>

            <Button
              className="w-full"
              onPress={() => {
                setActiveSession({ id: "mock-session", isMock: true });
              }}
              variant="secondary"
            >
              🚀 Mock Simulation (Save Credits)
            </Button>
          </View>
        </Card>
      </Screen>
    </>
  );
}
