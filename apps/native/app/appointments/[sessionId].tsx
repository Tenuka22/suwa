import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { VideoRoom } from "@/components/ui/video-room";
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
  const [alias, setAlias] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (userRole === "patient") {
      orpc.getPatientProfile
        .call()
        .then((profile) => {
          if (profile?.alias) {
            setAlias(profile.alias);
          }
        })
        .catch(() => undefined);
    }
  }, [userRole]);

  const sessionQuery = useQuery({
    queryKey: orpc.getLiveKitToken.queryKey({ sessionId: sessionId ?? "" }),
    queryFn: () => orpc.getLiveKitToken.call({ sessionId: sessionId ?? "" }),
    enabled: !!sessionId,
  });

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
