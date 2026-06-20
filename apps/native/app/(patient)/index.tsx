"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Film,
  Flower2,
  HeartPulse,
  MapPin,
  MessageCircle,
  Mic,
  MicOff,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { PatientTabScaffold } from "@/components/design/patient-tab-scaffold";

import { Card } from "@/components/design/ui/card";
import { Input } from "@/components/design/ui/input";
import { Reveal } from "@/components/design/ui/reveal";
import { Skeleton } from "@/components/design/ui/skeleton";
import { showToast, ToastContainer } from "@/components/design/ui/toast";
import { orpc } from "@/utils/orpc";
import { useSpeechToText } from "@/utils/use-speech-to-text";

interface FeatureCardProps {
  description: string;
  icon: ReactNode;
  iconBackground: string;
  onPress: () => void;
  title: string;
}

function FeatureCard({
  description,
  icon,
  iconBackground,
  onPress,
  title,
}: FeatureCardProps) {
  return (
    <Card
      className="min-h-44"
      description={description}
      icon={icon}
      iconBgColor={iconBackground}
      onPress={onPress}
      title={title}
    />
  );
}

function VoiceOrb({
  isListening,
  onPress,
}: {
  isListening: boolean;
  onPress: () => void;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!isListening) {
      pulse.value = withTiming(1, {
        duration: 140,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.System,
      });
      return;
    }

    pulse.value = withRepeat(
      withTiming(1.14, {
        duration: 720,
        easing: Easing.inOut(Easing.sin),
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [isListening, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Pressable accessibilityLabel="Use voice search" onPress={onPress}>
      <View className="h-11 w-11 items-center justify-center">
        {isListening ? (
          <Animated.View
            className="absolute h-11 w-11 rounded-full bg-accent/20"
            style={pulseStyle}
          />
        ) : null}
        <View
          className={`h-10 w-10 items-center justify-center rounded-full ${isListening ? "bg-accent" : "bg-primary"}`}
        >
          {isListening ? (
            <MicOff color="#fffdf9" size={17} />
          ) : (
            <Mic color="#fffdf9" size={17} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const patientProfileQuery = useQuery(orpc.getPatientProfile.queryOptions());
  const patientName = patientProfileQuery.data?.alias ?? "Guest";
  const [input, setInput] = useState("");
  const {
    error: speechError,
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useSpeechToText();
  const { data: featuredVideos, isPending: videosPending } = useQuery(
    orpc.listPublicMaterials.queryOptions({
      input: { page: 1, pageSize: 10 },
    })
  );

  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [isListening, transcript]);

  useEffect(() => {
    if (speechError) {
      showToast({
        message: speechError,
        title: "Speech recognition",
        type: "warning",
      });
    }
  }, [speechError]);

  const handleSubmit = () => {
    const message = input.trim();
    if (!message) {
      return;
    }
    router.push({ pathname: "/(patient)/ai", params: { message } });
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
      return;
    }
    setInput("");
    startListening();
  };

  return (
    <PatientTabScaffold activeTab="home">
      <Stack.Screen options={{ animation: "fade", headerShown: false }} />
      <View className="flex-1 gap-xxl bg-background px-lg pt-12">
        <Reveal delay={40}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-md">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-subtle">
                <Image
                  resizeMode="contain"
                  source={require("@/assets/images/icon-stripped.png")}
                  style={{ height: 34, width: 22 }}
                />
              </View>
              <View>
                <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
                  Welcome
                </Text>
                <Text className="font-poppins-medium text-foreground text-subtitle">
                  {patientName}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              className="relative h-11 w-11 items-center justify-center rounded-full border border-border bg-background-elevated shadow-sm"
              onPress={() => router.push("/(patient)/appointments")}
            >
              <Bell color="#315b4d" size={19} />
              <View className="absolute top-2 right-2 h-2 w-2 rounded-full border border-background-elevated bg-accent" />
            </Pressable>
          </View>
        </Reveal>

        <Reveal delay={120}>
          <View className="relative overflow-hidden rounded-[32px] bg-primary px-xl py-xxl shadow-lg">
            <View className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-accent/25" />
            <View className="absolute -right-16 bottom-0 h-36 w-36 rounded-full border border-primary-foreground/15" />
            <View className="max-w-[84%] gap-md">
              <View className="self-start rounded-full bg-primary-foreground/10 px-md py-xs">
                <Text className="font-poppins-medium text-micro text-primary-foreground uppercase tracking-widest">
                  Your private space
                </Text>
              </View>
              <View>
                <Text className="font-serif text-[38px] text-primary-foreground leading-[1.08]">
                  Health is personal.
                </Text>
                <Text className="font-serif text-[35px] text-accent-subtle italic leading-[1.08]">
                  Privacy is ours.
                </Text>
              </View>
              <Text className="font-sans text-caption text-primary-foreground/75 leading-relaxed">
                Ask anything. Your identity stays yours.
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={200}>
          <Input
            className="bg-transparent"
            inputContainerClassName={`rounded-full border border-border bg-background-elevated pl-lg pr-xs shadow-md ${isListening ? "border-accent" : ""}`}
            leftIcon={<Search color="#8e9a94" size={19} />}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            placeholder="How can we help you today?"
            returnKeyType="send"
            rightIcon={
              input.trim() ? (
                <Pressable accessibilityLabel="Search" onPress={handleSubmit}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <ChevronRight color="#fffdf9" size={19} />
                  </View>
                </Pressable>
              ) : (
                <VoiceOrb isListening={isListening} onPress={toggleMic} />
              )
            }
            value={input}
          />
        </Reveal>

        <Reveal className="gap-md" delay={260}>
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="font-serif text-[26px] text-foreground">
                Care, your way
              </Text>
              <Text className="font-sans text-caption text-foreground-muted">
                Private support whenever you need it
              </Text>
            </View>
            <Sparkles color="#d78357" size={18} />
          </View>
          <View className="gap-md">
            <View className="flex-row gap-md">
              <FeatureCard
                description="Chat anonymously"
                icon={<MessageCircle color="#5f7267" size={23} />}
                iconBackground="bg-tint-green"
                onPress={() => router.push("/(patient)/doctors")}
                title="Start a consultation"
              />
              <FeatureCard
                description="Learn and understand"
                icon={<BookOpen color="#d78357" size={23} />}
                iconBackground="bg-accent-subtle"
                onPress={() => router.push("/(patient)/materials")}
                title="Health library"
              />
            </View>
            <View className="flex-row gap-md">
              <FeatureCard
                description="Self-care and support"
                icon={<Flower2 color="#9e8cb2" size={23} />}
                iconBackground="bg-tint-purple"
                onPress={() => router.push("/(patient)/health-hub")}
                title="Wellness tools"
              />
              <FeatureCard
                description="You are in control"
                icon={<ShieldCheck color="#c3af5a" size={23} />}
                iconBackground="bg-tint-yellow"
                onPress={() => router.push("/(patient)/profile")}
                title="Privacy center"
              />
            </View>
          </View>
        </Reveal>

        <Reveal delay={340}>
          <Pressable
            className="overflow-hidden rounded-3xl bg-accent-subtle px-xl py-lg"
            onPress={() => router.push("/(patient)/map")}
          >
            <View className="absolute -right-4 -bottom-12 h-32 w-32 rounded-full bg-accent/15" />
            <View className="flex-row items-center gap-lg">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-background-elevated">
                <MapPin color="#d78357" size={23} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-poppins-medium text-foreground text-subtitle">
                  Care nearby
                </Text>
                <Text className="font-sans text-caption text-foreground-secondary">
                  Find trusted doctors and clinics around you
                </Text>
              </View>
              <ChevronRight color="#d78357" size={20} />
            </View>
          </Pressable>
        </Reveal>

        {videosPending ? (
          <Reveal className="gap-md" delay={400}>
            <View className="gap-xs">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-56" />
            </View>
            <View className="flex-row gap-md">
              <Skeleton className="h-48 w-56" />
              <Skeleton className="h-48 w-56" />
            </View>
          </Reveal>
        ) : null}
        {!videosPending && featuredVideos && featuredVideos.length > 0 ? (
          <Reveal className="gap-md" delay={400}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-serif text-[26px] text-foreground">
                  Curated for you
                </Text>
                <Text className="font-sans text-caption text-foreground-muted">
                  A little knowledge for today
                </Text>
              </View>
              <Pressable onPress={() => router.push("/(patient)/materials")}>
                <Text className="font-poppins-medium text-accent text-caption">
                  View all
                </Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerClassName="gap-md"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {featuredVideos.slice(0, 6).map((item) => (
                <Pressable
                  className="w-56 overflow-hidden rounded-3xl border border-border/60 bg-background-elevated shadow-sm"
                  key={item.id}
                  onPress={() =>
                    router.push({
                      params: { materialId: item.id },
                      pathname: "/(patient)/materials/[materialId]",
                    })
                  }
                >
                  <View className="h-28 items-center justify-center bg-primary-subtle">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-background-elevated/90">
                      <Film color="#315b4d" size={22} />
                    </View>
                  </View>
                  <View className="gap-xs p-md">
                    <Text
                      className="font-poppins-medium text-caption text-foreground"
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {item.doctorName ? (
                      <Text className="font-sans text-foreground-muted text-micro">
                        {item.doctorName}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Reveal>
        ) : null}

        <Reveal className="pb-xl" delay={460}>
          <Card
            className="border-0 bg-primary-subtle"
            description="Your personal details stay encrypted and in your control."
            icon={<HeartPulse color="#315b4d" size={23} />}
            iconBgColor="bg-background-elevated"
            onPress={() => router.push("/(patient)/profile")}
            title="Private by design"
            variant="banner"
          />
        </Reveal>
      </View>
      <ToastContainer />
    </PatientTabScaffold>
  );
}
