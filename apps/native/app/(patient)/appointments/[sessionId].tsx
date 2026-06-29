"use client";

import { authClient } from "@/utils/better-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button } from "@/components/design/ui/button";
import { Screen } from "@/components/design/ui/screen";
import { VideoRoom } from "@/components/design/ui/video-room";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import {
  decryptData,
  deriveSharedKey,
  encryptData,
  generateKeyPair,
  getStoredSecret,
} from "@/utils/privacy";

export default function AppointmentSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { data: authSession } = authClient.useSession();
  const role = (authSession?.user as { role?: string } | undefined)?.role;
  let userRole: "patient" | "doctor" | "admin" = "patient";
  if (role === "admin") {
    userRole = "admin";
  } else if (role === "doctor") {
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
  const [privacyMode, setPrivacyMode] = useState<
    "anonymous" | "show-info" | null
  >(null);
  const hasSharedInfoRef = useRef(false);

  const sessionQuery = useQuery({
    ...orpc.getLiveKitToken.queryOptions({
      input: { sessionId: sessionId ?? "" },
    }),
    enabled: !!sessionId,
  });

  const doctorKeyQuery = useQuery(
    orpc.getDoctorPublicKey.queryOptions({
      input: { sessionId: sessionId ?? "" },
      enabled: !!sessionId && userRole === "patient",
      refetchInterval: 5000,
      meta: { ignoreError: true },
    })
  );

  const shareMutation = useMutation(
    orpc.sharePatientData.mutationOptions({
      meta: { ignoreError: true },
    })
  );

  const profile = profileQuery.data;
  const hasInfoToShare = profile?.secured && profile?._securedData;
  const doctorPublicKey = doctorKeyQuery.data?.publicKey;

  useEffect(() => {
    hasSharedInfoRef.current = false;
    setPrivacyMode(null);
  }, [sessionId]);

  useEffect(() => {
    if (
      privacyMode !== "show-info" ||
      !(hasInfoToShare && sessionId && doctorPublicKey) ||
      shareMutation.isPending ||
      shareMutation.isSuccess ||
      hasSharedInfoRef.current
    ) {
      return;
    }

    hasSharedInfoRef.current = true;

    getStoredSecret()
      .then(async (secret) => {
        if (!(secret && profile?._securedData)) {
          hasSharedInfoRef.current = false;
          return;
        }

        const decrypted = await decryptData(profile._securedData, secret);
        if (!decrypted) {
          hasSharedInfoRef.current = false;
          return;
        }

        const keyPair = await generateKeyPair();
        const sessionKey = await deriveSharedKey(
          keyPair.privateKey,
          doctorPublicKey
        );
        const encrypted = await encryptData(
          {
            email: decrypted.email,
            phone: decrypted.phone,
            fullName: decrypted.fullName,
            address: decrypted.address,
            ageCategory: decrypted.ageCategory,
            profession: decrypted.profession,
          },
          sessionKey
        );

        shareMutation.mutate(
          {
            sessionId,
            encryptedData: encrypted,
            patientPublicKey: keyPair.publicKey,
          },
          {
            onError: () => {
              hasSharedInfoRef.current = false;
            },
          }
        );
      })
      .catch(() => {
        hasSharedInfoRef.current = false;
      });
  }, [
    privacyMode,
    hasInfoToShare,
    sessionId,
    doctorPublicKey,
    shareMutation.isPending,
    shareMutation.isSuccess,
    shareMutation.mutate,
    profile?._securedData,
  ]);

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

  const { session: sessionData } = sessionQuery.data;

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

        <View className="flex-1">
          <VideoRoom
            alias={alias}
            endAt={sessionData.endAt}
            onClose={() => router.back()}
            onPrivacyModeChange={setPrivacyMode}
            participantRole={userRole}
            sessionId={sessionId ?? ""}
            startAt={sessionData.startAt}
          />
        </View>
      </Screen>
    </View>
  );
}
