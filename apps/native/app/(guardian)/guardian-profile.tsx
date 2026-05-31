import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Shield } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { CreditPurchase } from "@/components/ui/credit-purchase";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { useUserMode } from "@/utils/user-mode";
import { useThemeColor } from "@/utils/theme";

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "navigator" in window) {
    const nav = window.navigator as Navigator & {
      vibrate?: (pattern: number | number[]) => boolean;
    };
    nav.vibrate?.(pattern);
  }
}

export default function GuardianProfileScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { mode, toggleMode } = useUserMode();

  useEffect(() => {
    if (mode === "patient") {
      router.replace("/");
    }
  }, [mode, router]);

  const handleBack = () => {
    vibrate(15);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/dashboard");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        contentClassName="gap-section bg-background px-page py-page pb-24"
        scrollClassName="flex-1 bg-background"
      >
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="items-center gap-2 border-border border-b-2 px-card py-6">
            <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted">
              <Shield color={colors.mutedForeground} size={28} />
            </View>
            <Text className="font-black font-sans text-2xl text-foreground tracking-tight">
              Guardian Profile
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            <Text className="font-normal font-sans text-muted-foreground text-sm leading-5">
              You are logged in as a guardian. Your profile and settings will
              appear here.
            </Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="border-border border-b-2 px-card py-4">
            <Text className="font-black font-sans text-lg text-foreground tracking-tight">
              Credits
            </Text>
          </View>
          <View className="px-card py-card">
            <CreditPurchase />
          </View>
        </View>

        {__DEV__ && (
          <View className="overflow-hidden rounded-card border-2 border-dashed border-orange-500 bg-orange-500/5">
            <View className="items-center gap-2 border-border border-b-2 px-card py-3">
              <Text className="font-black font-sans text-orange-500 text-xs uppercase tracking-[0.2em]">
                Dev Mode
              </Text>
            </View>
            <View className="flex-row items-center justify-between gap-4 px-card py-4">
              <View className="flex-1 gap-1">
                <Text className="font-bold font-sans text-foreground text-sm">
                  Switch to Patient
                </Text>
              </View>
              <Button onPress={toggleMode} size="sm" variant="secondary">
                Switch
              </Button>
            </View>
          </View>
        )}
      </Screen>
      <ScreenBottomBar>
        <View className="flex-1 flex-row items-center gap-2">
          <View className="flex-1" />
          <Pressable
            className="aspect-square h-12 items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
            onPress={handleBack}
          >
            <ArrowLeft color="#ffffff" size={16} />
          </Pressable>
        </View>
      </ScreenBottomBar>
    </>
  );
}
