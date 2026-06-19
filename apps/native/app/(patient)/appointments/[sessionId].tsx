"use client";

import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button } from "@/components/design/ui/button";
import { Screen } from "@/components/design/ui/screen";
import { VideoRoom } from "@/components/design/ui/video-room";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

export default function AppointmentSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const metadataRole = user?.publicMetadata?.role;
  let userRole: "patient" | "doctor" | "admin" = "patient";
  if (metadataRole === "admin") {
    userRole = "admin";
  } else if (metadataRole === "doctor") {
    userRole = "doctor";
  }

  const profileQuery = useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: userRole === "patient",
      retry: false,
      meta: { ignoreError: true },
    })
  );

  const alias = profileQuery.data?.alias;

  const sessionQuery = useQuery({
    ...orpc.getLiveKitToken.queryOptions({
      input: { sessionId: sessionId ?? "" },
    }),
    enabled: !!sessionId,
  });

  const timing = useSessionTiming(
    sessionQuery.data?.session.startAt ?? new Date().toISOString(),
    sessionQuery.data?.session.endAt ?? new Date().toISOString(),
    userRole
  );

  if (sessionQuery.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#2d3e35" size="large" />
      </View>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <View className="flex-1 items-center justify-center gap-md bg-background">
        <Text className="font-serif text-primary text-title">
          Failed to load session
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const { session } = sessionQuery.data;

  if (!timing.canJoin) {
    return (
      <View className="flex-1 items-center justify-center gap-md bg-background p-huge">
        <Text className="text-center font-serif text-hero text-primary">
          Join window not open
        </Text>
        <Text className="text-center font-sans text-body text-foreground-secondary">
          You can join 30 minutes before the session starts.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="flex-1 gap-xl pt-12 px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="mt-sm flex-row items-center gap-md">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background-elevated shadow-sm"
            onPress={() => router.back()}
          >
            <ArrowLeft className="text-primary" size={20} />
          </Pressable>
          <View>
            <Text className="font-serif text-hero text-primary leading-tight">
              Session
            </Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
              ID: {sessionId?.slice(0, 8)}
            </Text>
          </View>
        </View>

        <View className="flex-1 overflow-hidden rounded-3xl border border-border bg-background-elevated shadow-lg">
          <VideoRoom
            alias={alias}
            endAt={session.endAt}
            onClose={() => router.back()}
            role={userRole}
            sessionId={sessionId ?? ""}
            startAt={session.startAt}
          />
        </View>
      </Screen>
    </View>
  );
}
