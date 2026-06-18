"use client";

import { Stack } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, BodySm, H1 } from "@/components/design/typography";

export default function LandingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 overflow-hidden bg-bg-app">
        <View className="absolute -top-10 -right-10 h-[280px] w-[280px] rounded-full bg-accent-terracotta opacity-40" />
        <View
          className="absolute top-10 -right-20 h-[450px] w-[300px] rounded-[150px] bg-[#E8E1D5] opacity-60"
          style={{ transform: [{ rotate: "-35deg" }] }}
        />

        <View
          className="absolute -bottom-40 -left-20 h-[600px] w-[600px] rounded-[200px] bg-[#E5E3D8] opacity-50"
          style={{ transform: [{ rotate: "15deg" }] }}
        />

        <View
          className="absolute -right-40 bottom-[10%] h-[600px] w-[450px] rounded-[200px] bg-brand-primary opacity-30"
          style={{ transform: [{ rotate: "40deg" }] }}
        />

        <SafeAreaView className="flex-1 px-8 pt-6 pb-6">
          <View className="w-auto pb-12">
            <Image
              resizeMode="contain"
              source={require("@/assets/images/icon-stripped.png")}
              style={{ height: 300, width: "auto" }}
            />
          </View>

          {/* Hero Section */}
          <View className="flex-1">
            <View className="mb-10">
              <H1 className="font-serif text-[72px] text-brand-primary leading-[0.9]">
                Suwa
              </H1>
            </View>

            <View className="mb-6">
              <Body className="font-medium text-[32px] text-text-charcoal leading-tight">
                Your health.
              </Body>
              <Body className="font-medium text-[32px] text-text-charcoal leading-tight">
                Your privacy.
              </Body>
              <Body className="font-medium text-[32px] text-accent-terracotta leading-tight">
                Always.
              </Body>
            </View>

            {/* Separator Line */}
            <View className="mb-8 h-[1px] w-12 bg-accent-terracotta opacity-50" />

            <View className="max-w-[240px]">
              <BodySm className="font-medium text-[17px] text-text-charcoal leading-relaxed">
                Anonymous by design.{"\n"}Care that understands.
              </BodySm>
            </View>
          </View>

          <View className="mt-auto">
            <View className="mb-10 flex-row items-center">
              <Pressable className="mr-4 flex-1 rounded-full bg-brand-primary px-10 py-6 shadow-sm active:opacity-90">
                <Body className="text-center font-semibold text-lg text-text-muted">
                  Begin your journey
                </Body>
              </Pressable>

              <Pressable className="rounded-full border border-border bg-white p-6 shadow-sm active:opacity-90">
                <ArrowRight color="#2D3E35" size={28} />
              </Pressable>
            </View>

            {/* Pagination Dots */}
            <View className="flex-row justify-center gap-4 pb-2">
              <View className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
              <View className="h-2.5 w-2.5 rounded-full bg-border" />
              <View className="h-2.5 w-2.5 rounded-full bg-border" />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
