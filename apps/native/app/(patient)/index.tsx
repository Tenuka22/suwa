"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  AudioLines,
  Bell,
  BookOpen,
  Flower2,
  Heart,
  Home,
  Library,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  SquarePlus,
  User,
} from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";

import { Card } from "@/components/design/ui/card";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { orpc } from "@/utils/orpc";

export default function HomeScreen() {
  const router = useRouter();
  const patientProfileQuery = useQuery(orpc.getPatientProfile.queryOptions());
  const patientName = patientProfileQuery.data?.alias ?? "Guest";

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen
        contentClassName="flex-1 gap-xl pb-32 pt-lg px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-sm">
          <View className="flex-row items-center gap-md">
            <View className="h-14 w-14 rounded-full items-center justify-center overflow-hidden">
              <Image
              style={{width:32}}
                source={require("@/assets/images/icon-stripped.png")}
                resizeMode="contain"
              />
            </View>
            <View className="flex flex-col">
              <Text className="font-sans font-light text-title text-foreground-muted">
                Welcome
              </Text>
              <Text className="font-sans text-subtitle text-primary">
                {patientName},
              </Text>
            </View>
          </View>
          <View className="h-10 w-10 rounded-full border border-border bg-background-elevated items-center justify-center shadow-sm">
            <Bell size={20} className="text-primary" />
          </View>
        </View>

        {/* Hero Section */}
        <View className="gap-0 my-sm">
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
            <Text className="font-serif text-hero text-accent italic leading-tight">
              ours.
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="How can we help you today?"
          inputContainerClassName="rounded-full border-0 shadow-sm bg-background-elevated"
          className="bg-transparent"
          leftIcon={<Search size={20} className="text-foreground-placeholder" />}
          rightIcon={
            <View className="h-10 w-10 rounded-full bg-primary items-center justify-center">
              <AudioLines size={18} className="text-primary-foreground" />
            </View>
          }
        />

        {/* 2x2 Grid */}
        <View className="gap-xl">
          <View className="flex-row gap-xl">
            <Card
              title="Start a Consultation"
              description="Chat anonymously"
              icon={<Heart size={24} className="text-tint-green-foreground" />}
              iconBgColor="bg-tint-green"
              onPress={() => router.push("/doctors")}
            />

          </View>
          <View className="flex-row gap-xl">
            <Card
              title="Wellness Tools"
              description="Self-care & support"
              icon={<Flower2 size={24} className="text-tint-purple-foreground" />}
              iconBgColor="bg-tint-purple"
              onPress={() => router.push("/health-hub")}
            />
            <Card
              title="Privacy Center"
              description="You're in control"
              icon={<Shield size={24} className="text-tint-yellow-foreground" />}
              iconBgColor="bg-tint-yellow"
              onPress={() => router.push("/profile")}
            />
          </View>
        </View>

        {/* Bottom Banner */}
        <Card
          variant="banner"
          title="100% Anonymous"
          description="No names. No data linked to you. Ever."
          icon={<ShieldCheck size={24} className="text-primary" />}
          iconBgColor="bg-primary-subtle"
          className="bg-background-subtle border-0"
          onPress={() => router.push("/profile")}
        />
      </Screen>

      {/* Custom Tab Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-background-elevated/90 px-lg py-md flex-row justify-between items-center border-t border-border/50 rounded-t-3xl shadow-lg">
        <TabItem icon={<Home size={24} className="text-primary" />} label="Home" active />
        <TabItem icon={<MessageCircle size={24} className="text-foreground-muted" />} label="Consultations" />
        <TabItem icon={<BookOpen size={24} className="text-foreground-muted" />} label="Library" />
        <TabItem icon={<User size={24} className="text-foreground-muted" />} label="Profile" />
      </View>
    </View>
  );
}

function TabItem({ icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <Pressable className="items-center gap-1 flex-1">
      {icon}
      <Text className={`text-micro font-sans ${active ? "text-primary font-bold" : "text-foreground-muted"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
