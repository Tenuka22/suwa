"use client";

import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ActivityIndicator, Text, View, Pressable } from "react-native";
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
      <View className="flex-1 items-center justify-center bg-background gap-md">
        <Text className="font-serif text-title text-primary">Failed to load session</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const { session } = sessionQuery.data;

  if (!timing.canJoin) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-huge gap-md">
        <Text className="font-serif text-hero text-primary text-center">Join window not open</Text>
        <Text className="font-sans text-body text-foreground-secondary text-center">
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
        contentClassName="flex-1 gap-xl pb-32 pt-lg px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center gap-md mt-sm">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} className="text-primary" />
          </Pressable>
          <View>
            <Text className="font-serif text-hero text-primary leading-tight">Session</Text>
            <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">ID: {sessionId?.slice(0, 8)}</Text>
          </View>
        </View>

        <View className="flex-1 rounded-3xl overflow-hidden border border-border shadow-lg bg-background-elevated">
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
