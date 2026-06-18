"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Heart,
  MapPin,
  Stethoscope,
  Sparkles,
} from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View, Pressable } from "react-native";

import { Button } from "@/components/design/ui/button";
import { Screen } from "@/components/ui/screen";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import {
  getYearsOfExperience,
  specialtyLabels,
} from "@/utils/doctor-profile";
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

  if (!profile) return null;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="flex-1 gap-xl pb-32 pt-lg px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-sm">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} className="text-primary" />
          </Pressable>
          <Pressable
            onPress={toggleSave}
            className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm"
          >
            <Heart size={20} className={isSaved ? "text-accent fill-accent" : "text-primary"} />
          </Pressable>
        </View>

        {/* Hero / Profile Info */}
        <View className="items-center gap-lg">
          <View className="h-32 w-32 rounded-full border-4 border-background-elevated shadow-lg overflow-hidden bg-background-subtle">
            {portraitPreviewUrl ? (
              <Image source={{ uri: portraitPreviewUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Stethoscope size={48} className="text-primary/20" />
              </View>
            )}
          </View>
          <View className="items-center gap-1">
            <Text className="font-serif text-hero text-primary text-center leading-tight">
              {profile.displayName}
            </Text>
            <Text className="font-sans text-subtitle text-accent font-semibold">
              {profile.specialties?.[0] ? (specialtyLabels[profile.specialties[0]] || profile.specialties[0]) : "Specialist"}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-lg">
          <View className="flex-1 bg-background-elevated p-md rounded-2xl shadow-sm items-center gap-1">
            <GraduationCap size={20} className="text-tint-green-foreground" />
            <Text className="font-sans text-micro text-foreground-muted uppercase">Experience</Text>
            <Text className="font-sans text-body font-bold text-foreground">{yearsOfExperience}+ Yrs</Text>
          </View>
          <View className="flex-1 bg-background-elevated p-md rounded-2xl shadow-sm items-center gap-1">
            <MapPin size={20} className="text-tint-beige-foreground" />
            <Text className="font-sans text-micro text-foreground-muted uppercase">Location</Text>
            <Text className="font-sans text-body font-bold text-foreground" numberOfLines={1}>{profile.location || "Remote"}</Text>
          </View>
        </View>

        {/* Bio */}
        <View className="gap-md">
          <View className="flex-row items-center gap-sm">
            <BookOpen size={20} className="text-primary" />
            <Text className="font-serif text-title text-primary">About</Text>
          </View>
          <View className="bg-background-subtle/50 p-lg rounded-3xl border border-border/50">
            <Text className="font-sans text-body text-foreground-secondary leading-relaxed">
              {profile.bio || "Professional clinician dedicated to providing high-quality care."}
            </Text>
          </View>
        </View>

        {/* Approach */}
        {profile.approachSteps?.length > 0 && (
          <View className="gap-md">
            <View className="flex-row items-center gap-sm">
              <Sparkles size={20} className="text-primary" />
              <Text className="font-serif text-title text-primary">Approach</Text>
            </View>
            <View className="gap-md">
              {profile.approachSteps.map((step, index) => (
                <View key={step.id} className="flex-row gap-md items-start">
                  <View className="h-8 w-8 rounded-full bg-primary items-center justify-center">
                    <Text className="font-sans text-caption text-primary-foreground font-bold">{index + 1}</Text>
                  </View>
                  <View className="flex-1 bg-background-elevated p-md rounded-2xl shadow-sm">
                    <Text className="font-sans text-body text-foreground-secondary">{step.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Book Button */}
        <View className="mt-huge">
          <Button 
            size="lg"
            onPress={() => router.push(`/doctors/${id}/booking`)}
          >
            Schedule Consultation
          </Button>
        </View>
      </Screen>
    </View>
  );
}
