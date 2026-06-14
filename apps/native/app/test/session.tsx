'use client';

import { Stack } from "expo-router";
import { Video } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { VideoRoom } from "@/components/ui/video-room";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function TestSessionScreen() {
  const colors = useThemeColor();
  const [sessionId, setSessionId] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
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
    setActiveSessionId(sessionId.trim());
  }, [sessionId]);

  if (activeSessionId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Test Session" }} />
        <Screen contentClassName="gap-section px-page py-page bg-background">
          <VideoRoom
            alias={alias}
            endAt={new Date(Date.now() + 3_600_000).toISOString()}
            onClose={() => setActiveSessionId(null)}
            onFetchToken={(sid: string) =>
              orpc.getTestLiveKitToken.call({ sessionId: sid })
            }
            role={selectedRole}
            sessionId={activeSessionId}
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
              <Video color={colors.foreground} size={20} />
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
              icon={<Video color={colors.primaryForeground} size={16} />}
              onPress={handleJoin}
            >
              Join as{" "}
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Button>
          </View>
        </Card>
      </Screen>
    </>
  );
}
