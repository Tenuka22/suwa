"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Film,
  GraduationCap,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react-native";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/design/ui/button";
import { Reveal } from "@/components/design/ui/reveal";
import { Skeleton } from "@/components/design/ui/skeleton";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { getYearsOfExperience, specialtyLabels } from "@/utils/doctor-profile";
import { orpc } from "@/utils/orpc";
import { useIsDoctorSaved } from "@/utils/saved-doctors";

function DoctorProfileSkeleton() {
  return (
    <View className="flex-1 gap-xl bg-background px-lg pt-14">
      <Skeleton className="h-11 w-11 rounded-full" />
      <Skeleton className="h-72 w-full rounded-[32px]" />
      <View className="flex-row gap-md">
        <Skeleton className="h-24 flex-1" />
        <Skeleton className="h-24 flex-1" />
      </View>
      <Skeleton className="h-36 w-full" />
    </View>
  );
}

export default function DoctorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;
  const doctorQuery = useQuery(
    orpc.getDoctor.queryOptions({
      enabled: Boolean(id),
      input: { doctorId: id ?? "" },
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
    return <DoctorProfileSkeleton />;
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center gap-lg bg-background px-huge">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary-subtle">
          <Stethoscope color="#315b4d" size={34} />
        </View>
        <Text className="text-center font-serif text-[30px] text-foreground">
          Clinician unavailable
        </Text>
        <Button onPress={() => router.back()} variant="outline">
          Go back
        </Button>
      </View>
    );
  }

  const specialty = profile.specialties?.[0]
    ? (specialtyLabels[profile.specialties[0]] ?? profile.specialties[0])
    : "Specialist";

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false, title: getScreenTitle("native:patient:doctors:detail") }} />
      <ScrollView
        contentContainerClassName="gap-xl px-lg pt-12 pb-40"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Go back"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-background-elevated"
            onPress={() => router.back()}
          >
            <ArrowLeft color="#315b4d" size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel={isSaved ? "Remove saved doctor" : "Save doctor"}
            className={`h-11 w-11 items-center justify-center rounded-full ${isSaved ? "bg-accent-subtle" : "border border-border bg-background-elevated"}`}
            onPress={toggleSave}
          >
            <Heart
              color={isSaved ? "#d78357" : "#315b4d"}
              fill={isSaved ? "#d78357" : "transparent"}
              size={19}
            />
          </Pressable>
        </View>

        <Reveal delay={40}>
          <View className="relative overflow-hidden rounded-[32px] bg-primary px-xl py-xxl">
            <View className="absolute -top-12 -right-8 h-40 w-40 rounded-full bg-accent/30" />
            <View className="items-center gap-lg">
              <View className="h-32 w-32 overflow-hidden rounded-full border-4 border-primary-foreground/20 bg-primary-subtle">
                {portraitPreviewUrl ? (
                  <Image
                    className="h-full w-full"
                    resizeMode="cover"
                    source={{ uri: portraitPreviewUrl }}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Stethoscope color="#315b4d" size={42} />
                  </View>
                )}
              </View>
              <View className="items-center gap-xs">
                <View className="rounded-full bg-primary-foreground/10 px-md py-xs">
                  <Text className="font-poppins-medium text-micro text-primary-foreground uppercase tracking-widest">
                    {specialty}
                  </Text>
                </View>
                <Text className="text-center font-serif text-[34px] text-primary-foreground leading-tight">
                  {profile.displayName}
                </Text>
                <Text className="text-center font-sans text-caption text-primary-foreground/70">
                  {profile.headline ?? "Compassionate, private care"}
                </Text>
              </View>
            </View>
          </View>
        </Reveal>

        <Reveal className="flex-row gap-md" delay={80}>
          <View className="flex-1 gap-sm rounded-3xl border border-border/60 bg-background-elevated p-lg">
            <GraduationCap color="#315b4d" size={21} />
            <Text className="font-serif text-[24px] text-foreground">
              {yearsOfExperience}+ yrs
            </Text>
            <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
              Experience
            </Text>
          </View>
          <View className="flex-1 gap-sm rounded-3xl bg-accent-subtle p-lg">
            <MapPin color="#d78357" size={21} />
            <Text
              className="font-serif text-[24px] text-foreground"
              numberOfLines={1}
            >
              {profile.location || "Remote"}
            </Text>
            <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
              Location
            </Text>
          </View>
        </Reveal>

        <Reveal className="gap-md" delay={100}>
          <View className="flex-row items-center gap-sm">
            <BookOpen color="#315b4d" size={19} />
            <Text className="font-serif text-[26px] text-foreground">
              About
            </Text>
          </View>
          <Text className="font-sans text-body text-foreground-secondary leading-relaxed">
            {profile.bio ??
              "A trusted clinician focused on thoughtful, judgement-free care tailored to you."}
          </Text>
          <View className="flex-row items-center gap-sm rounded-2xl bg-primary-subtle px-lg py-md">
            <ShieldCheck color="#315b4d" size={19} />
            <Text className="flex-1 font-sans text-caption text-primary">
              Verified professional on the Suwa care network
            </Text>
          </View>
        </Reveal>

        {profile.approachSteps?.length ? (
          <Reveal className="gap-md" delay={100}>
            <View className="flex-row items-center gap-sm">
              <Sparkles color="#d78357" size={19} />
              <Text className="font-serif text-[26px] text-foreground">
                Their approach
              </Text>
            </View>
            <View className="gap-sm">
              {profile.approachSteps.map((step, index) => (
                <View
                  className="flex-row items-start gap-md rounded-2xl bg-background-elevated p-lg"
                  key={step.id}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Text className="font-poppins-medium text-caption text-primary-foreground">
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="flex-1 font-sans text-caption text-foreground-secondary leading-relaxed">
                    {step.text}
                  </Text>
                </View>
              ))}
            </View>
          </Reveal>
        ) : null}

        <Pressable
          className="flex-row items-center gap-md rounded-2xl border border-border bg-background-elevated px-lg py-md"
          onPress={() => router.push("/(patient)/materials")}
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
            <Film color="#d78357" size={19} />
          </View>
          <Text className="flex-1 font-poppins-medium text-caption text-foreground">
            Watch their health resources
          </Text>
        </Pressable>
      </ScrollView>

      <View
        className="absolute right-0 bottom-0 left-0 border-border border-t bg-background-elevated px-lg pt-md"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button
          icon={<Calendar color="#fbf7f0" size={19} />}
          justify="between"
          onPress={() => router.push(`/doctors/${id}/booking`)}
          size="lg"
        >
          Book a consultation
        </Button>
      </View>
    </View>
  );
}
