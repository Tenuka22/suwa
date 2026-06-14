'use client';

import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { VideoRoom } from "@/components/ui/video-room";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export default function AppointmentSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const colors = useThemeColor();
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
      <Screen contentClassName="items-center justify-center px-page py-page">
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <Screen contentClassName="items-center justify-center px-page py-page gap-4">
        <Text className="text-destructive">Failed to load session</Text>
        <Button onPress={() => router.back()} variant="secondary">
          Back
        </Button>
      </Screen>
    );
  }

  const { session } = sessionQuery.data;

  if (!timing.canJoin) {
    return (
      <Screen contentClassName="items-center justify-center px-page py-page gap-4">
        <Text className="text-center font-bold text-foreground text-lg">
          Join window not open yet
        </Text>
        <Text className="text-center text-muted-foreground text-sm">
          You can join 30 minutes before the session starts until it ends.
        </Text>
        <Button onPress={() => router.back()} variant="secondary">
          Back
        </Button>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="px-page py-page gap-6">
        <View className="flex-row items-center gap-4">
          <Button
            icon={<ArrowLeft color={colors.foreground} size={16} />}
            onPress={() => router.back()}
            size="sm"
            variant="secondary"
          >
            Back
          </Button>
          <View className="flex-1">
            <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
              Session Room
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-xs">
              ID: {sessionId}
            </Text>
          </View>
        </View>

        <VideoRoom
          alias={alias}
          endAt={session.endAt}
          onClose={() => router.back()}
          role={userRole}
          sessionId={sessionId ?? ""}
          startAt={session.startAt}
        />
      </Screen>
    </>
  );
}
