"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  Bell,
  BookOpen,
  Flower2,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Mic,
  MicOff,
  Search,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { Card } from "@/components/design/ui/card";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { ScreenTabBar } from "@/components/design/ui/screen-tab-bar";
import { showToast, ToastContainer } from "@/components/design/ui/toast";
import { orpc } from "@/utils/orpc";
import { useSpeechToText } from "@/utils/use-speech-to-text";

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

  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [isListening, transcript]);

  useEffect(() => {
    if (speechError) {
      showToast({
        type: "warning",
        title: "Speech Recognition",
        message: speechError,
      });
    }
  }, [speechError]);

  function handleSubmit() {
    const text = input.trim();
    if (!text) {
      return;
    }
    router.push({ pathname: "/(patient)/ai", params: { message: text } });
  }

  function toggleMic() {
    if (isListening) {
      stopListening();
    } else {
      setInput("");
      startListening();
    }
  }

  return (
    <ScreenTabBar
      tabs={[
        {
          active: true,
          icon: <Home className="text-primary-foreground" size={20} />,
          label: "Home",
          onPress: () => router.push("/(patient)"),
        },
        {
          icon: <MessageCircle className="text-foreground" size={20} />,
          label: "Doctors",
          onPress: () => router.push("/(patient)/doctors"),
        },
        {
          icon: <BookOpen className="text-foreground" size={20} />,
          label: "Health",
          onPress: () => router.push("/(patient)/health-hub"),
        },
        {
          icon: <User className="text-foreground" size={20} />,
          label: "Profile",
          onPress: () => router.push("/(patient)/profile"),
        },
      ]}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <Screen
          contentClassName="flex-1 gap-xl pt-12 px-lg bg-background"
          scrollClassName="flex-1 bg-background"
        >
          {/* Header */}
          <View className="mt-sm flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full -ml-3">
                <Image
                  resizeMode="contain"
                  source={require("@/assets/images/icon-stripped.png")}
                  style={{ width: 32 }}
                />
              </View>
              <View className="flex flex-col">
                <Text className="font-sans text-foreground-muted text-title">
                  Welcome
                </Text>
                <Text className="font-sans text-primary text-subtitle">
                  {patientName},
                </Text>
              </View>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background-elevated shadow-sm">
              <Bell className="text-primary" size={20} />
            </View>
          </View>

          {/* Hero Section */}
          <View className="my-sm gap-0">
            <Text className="font-serif text-hero text-primary leading-tight">
              Health is
            </Text>
            <Text className="font-serif text-hero text-primary leading-tight">
              personal.
            </Text>
            <View className="flex-row items-baseline">
              <Text className="font-serif text-hero text-primary leading-tight">
                Privacy is{" "}
              </Text>
              <Text className="font-serif text-accent text-hero italic leading-tight">
                ours.
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <Input
            className="bg-transparent"
            inputContainerClassName={`rounded-full border-0 shadow-sm ${isListening ? "bg-accent/10" : "bg-background-elevated"}`}
            leftIcon={
              <Search className="text-foreground-placeholder" size={20} />
            }
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            placeholder="How can we help you today?"
            returnKeyType="send"
            rightIcon={
              input.trim() ? (
                <Pressable onPress={handleSubmit}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <Search className="text-primary-foreground" size={18} />
                  </View>
                </Pressable>
              ) : (
                <Pressable onPress={toggleMic}>
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${isListening ? "bg-accent" : "bg-primary"}`}
                  >
                    {isListening ? (
                      <MicOff className="text-primary-foreground" size={18} />
                    ) : (
                      <Mic className="text-primary-foreground" size={18} />
                    )}
                  </View>
                </Pressable>
              )
            }
            value={input}
          />

          {/* 2x2 Grid */}
          <View className="gap-xl">
            <View className="flex-row gap-xl">
              <Card
                description="Chat anonymously"
                icon={
                  <Heart className="text-tint-green-foreground" size={24} />
                }
                iconBgColor="bg-tint-green"
                onPress={() => router.push("/doctors")}
                title="Start a Consultation"
              />
            </View>
            <View className="flex-row gap-xl">
              <Card
                description="Self-care & support"
                icon={
                  <Flower2 className="text-tint-purple-foreground" size={24} />
                }
                iconBgColor="bg-tint-purple"
                onPress={() => router.push("/health-hub")}
                title="Wellness Tools"
              />
              <Card
                description="You're in control"
                icon={
                  <Shield className="text-tint-yellow-foreground" size={24} />
                }
                iconBgColor="bg-tint-yellow"
                onPress={() => router.push("/profile")}
                title="Privacy Center"
              />
            </View>
          </View>

          {/* Doctor Map */}
          <View className="flex-row gap-xl">
            <Card
              description="Find nearby clinics"
              icon={<MapPin className="text-tint-beige-foreground" size={24} />}
              iconBgColor="bg-tint-beige"
              onPress={() => router.push("/(patient)/map")}
              title="Doctor Map"
            />
          </View>

          {/* Bottom Banner */}
          <Card
            className="border-0 bg-background-subtle"
            description="No names. No data linked to you. Ever."
            icon={<ShieldCheck className="text-primary" size={24} />}
            iconBgColor="bg-primary-subtle"
            onPress={() => router.push("/profile")}
            title="100% Anonymous"
            variant="banner"
          />
        </Screen>

        <ToastContainer />
      </View>
    </ScreenTabBar>
  );
}
