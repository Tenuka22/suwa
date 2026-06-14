'use client';

import { useClerk, useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Key, Shield, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorDialog, useErrorDialog } from "@/components/ui/error-dialog";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { orpc } from "@/utils/orpc";
import {
  generateUserSecret,
  getStoredSecret,
  storeSecret,
} from "@/utils/privacy";
import { useThemeColor } from "@/utils/theme";

export default function GuardianProfileScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { showError, dialogProps } = useErrorDialog();
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const profileQuery = useQuery(orpc.getGuardianProfile.queryOptions());

  useEffect(() => {
    getStoredSecret().then((secret) => {
      setHasKey(secret !== null);
    });
  }, []);

  const handleGenerateKey = async () => {
    const secret = generateUserSecret();
    await storeSecret(secret);
    setHasKey(true);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(guardian)");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page pb-24">
        <View className="overflow-hidden rounded-card border-2 border-border bg-card">
          <View className="items-center gap-2 border-border border-b-2 px-card py-6">
            <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted">
              <User color={colors.mutedForeground} size={28} />
            </View>
            <Text className="font-black font-sans text-2xl text-foreground tracking-tight">
              Guardian Profile
            </Text>
          </View>

          <View className="gap-4 px-card py-card">
            <View className="gap-1">
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-widest">
                Name
              </Text>
              <Text className="font-black font-sans text-foreground text-lg">
                {user?.fullName || "Not set"}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-widest">
                Email
              </Text>
              <Text className="font-medium font-sans text-foreground">
                {profileQuery.data?.email ||
                  user?.primaryEmailAddress?.emailAddress ||
                  "Not set"}
              </Text>
            </View>

            {profileQuery.data?.phone && (
              <View className="gap-1">
                <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-widest">
                  Phone
                </Text>
                <Text className="font-medium font-sans text-foreground">
                  {profileQuery.data.phone}
                </Text>
              </View>
            )}

            <View className="mt-2 flex-row items-center gap-2 rounded-lg bg-primary/5 p-3">
              <Shield color={colors.primary} size={16} />
              <Text className="font-medium font-sans text-primary text-xs">
                Verified Guardian Account
              </Text>
            </View>
          </View>
        </View>

        {hasKey === false && (
          <Card className="gap-4 border-primary/30">
            <View className="flex-row items-center gap-3">
              <View className="rounded-full border-2 border-border bg-muted p-2">
                <Key color={colors.primary} size={20} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-bold font-sans text-foreground text-sm">
                  Encryption Key Required
                </Text>
                <Text className="font-medium font-sans text-muted-foreground text-xs leading-5">
                  Generate a local encryption key to secure your profile data
                  and access patient stress information.
                </Text>
              </View>
            </View>
            <Button onPress={handleGenerateKey} variant="primary">
              Generate Encryption Key
            </Button>
          </Card>
        )}

        {hasKey === true && (
          <View className="flex-row items-center gap-2 rounded-lg bg-success/10 px-4 py-3">
            <Key color="#22c55e" size={14} />
            <Text className="font-medium font-sans text-success text-xs">
              Encryption key configured
            </Text>
          </View>
        )}

        <View className="overflow-hidden rounded-card border-2 border-destructive/30 bg-card">
          <View className="px-card py-card">
            <Button
              className="flex-row items-center justify-center gap-2"
              onPress={() =>
                showError("Sign Out", "Are you sure you want to sign out?", [
                  { label: "Cancel", variant: "secondary", onPress: () => {} },
                  { label: "Sign Out", onPress: () => signOut() },
                ])
              }
              variant="secondary"
            >
              <Text className="font-bold font-sans text-destructive text-sm">
                Sign Out
              </Text>
            </Button>
          </View>
        </View>
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
      <ErrorDialog {...dialogProps} />
    </>
  );
}
