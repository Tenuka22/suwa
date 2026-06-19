"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  GraduationCap,
  Heart,
  MapPin,
  Sparkles,
  Stethoscope,
} from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

import { Screen } from "@/components/design/ui/screen";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { getYearsOfExperience, specialtyLabels } from "@/utils/doctor-profile";
import { orpc } from "@/utils/orpc";
import { useIsDoctorSaved } from "@/utils/saved-doctors";

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;

  const doctorQuery = useQuery(
    orpc.getDoctor.queryOptions({
      input: { doctorId: id ?? "" },
      enabled: !!id,
    })
  );

  const profile = doctorQuery.data?.profile;
  const portraitId = doctorQuery.data?.portrait?.id ?? null;
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(portraitId);
  const { isSaved, toggleSave } = useIsDoctorSaved(id ?? "");

  const yearsOfExperience = useMemo(
    () => getYearsOfExperience(profile?.experienceStartYear ?? null),
    [profile?.experienceStartYear]
  );

  if (doctorQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#2d3e35" size="large" />
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="flex-1 gap-xl pt-12 px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="mt-sm">
          <Text className="font-serif text-hero text-primary leading-tight">
            {profile.displayName}
          </Text>
          <Text className="font-sans text-caption text-foreground-muted uppercase tracking-widest">
            {profile.specialties?.[0]
              ? specialtyLabels[profile.specialties[0]] ||
                profile.specialties[0]
              : "Specialist"}
          </Text>
        </View>

        {/* Hero / Profile Info */}
        <View className="items-center gap-lg">
          <View className="h-32 w-32 overflow-hidden rounded-full border-4 border-background-elevated bg-background-subtle shadow-lg">
            {portraitPreviewUrl ? (
              <Image
                className="h-full w-full"
                resizeMode="cover"
                source={{ uri: portraitPreviewUrl }}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Stethoscope className="text-primary/20" size={48} />
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-lg">
          <View className="flex-1 items-center gap-1 rounded-2xl bg-background-elevated p-md shadow-sm">
            <GraduationCap className="text-tint-green-foreground" size={20} />
            <Text className="font-sans text-foreground-muted text-micro uppercase">
              Experience
            </Text>
            <Text className="font-bold font-sans text-body text-foreground">
              {yearsOfExperience}+ Yrs
            </Text>
          </View>
          <View className="flex-1 items-center gap-1 rounded-2xl bg-background-elevated p-md shadow-sm">
            <MapPin className="text-tint-beige-foreground" size={20} />
            <Text className="font-sans text-foreground-muted text-micro uppercase">
              Location
            </Text>
            <Text
              className="font-bold font-sans text-body text-foreground"
              numberOfLines={1}
            >
              {profile.location || "Remote"}
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View className="gap-md">
          <View className="flex-row items-center gap-sm">
            <BookOpen className="text-primary" size={20} />
            <Text className="font-serif text-primary text-title">About</Text>
          </View>
          <View className="rounded-3xl border border-border/50 bg-background-subtle/50 p-lg">
            <Text className="font-sans text-body text-foreground-secondary leading-relaxed">
              {profile.bio ||
                "Professional clinician dedicated to providing high-quality care."}
            </Text>
          </View>
        </View>

        {/* Approach */}
        {profile.approachSteps?.length > 0 && (
          <View className="gap-md">
            <View className="flex-row items-center gap-sm">
              <Sparkles className="text-primary" size={20} />
              <Text className="font-serif text-primary text-title">
                Approach
              </Text>
            </View>
            <View className="gap-md">
              {profile.approachSteps.map((step, index) => (
                <View className="flex-row items-start gap-md" key={step.id}>
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Text className="font-bold font-sans text-caption text-primary-foreground">
                      {index + 1}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-background-elevated p-md shadow-sm">
                    <Text className="font-sans text-body text-foreground-secondary">
                      {step.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </Screen>

      <ScreenBottomBar
        leftActions={[
          {
            active: isSaved,
            activeClassName: "rounded-full bg-rose-600/70 backdrop-blur-md",
            icon: (
              <Heart
                className={
                  isSaved ? "fill-white text-white" : "text-foreground"
                }
                size={20}
              />
            ),
            label: isSaved ? "Saved" : "Save",
            onPress: toggleSave,
          },
          {
            className: "w-48 rounded-full bg-background-subtle/60 flex-row gap-2",
            textClassName:"text-sm",
            icon: <Calendar className="text-foreground" size={20} />,
            label: "Schedule",
            onPress: () => router.push(`/doctors/${id}/booking`),
          },
        ]}
        returnAction={{
          href: "/(patient)/doctors",
          icon: <ArrowLeft className="text-foreground" size={24} />,
        }}
      />
    </View>
  );
}
