import { useAuth, useClerk } from "@clerk/expo";
import { Stack } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { TextLink } from "@/components/ui/text-link";

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Neo-brutalist Top Header Bar */}
      <View className="bg-card border-b-[3px] border-border px-page flex-row items-center py-page justify-between">
        <Text className="font-black font-sans text-3xl text-foreground tracking-tight">
          ZenDoc
        </Text>
        {isSignedIn ? (
          <Button size="sm">
            Application
          </Button>
        ) : (
          <Button href="/sign-up" size="sm">
            Sign Up
          </Button>
        )}
      </View>

      {/* Main Screen Layout */}
      <Screen
        scrollClassName="flex-1 bg-background"
        contentClassName="flex-1 px-page py-page justify-between gap-section"
      >
        {/* Central Content Card/Area */}
        <View className="flex-1 justify-center py-8 gap-8 items-center">

          {/* Stark Brutalist Headlines */}
          <View className="gap-1 items-center">
            <Text className="font-black font-sans text-4xl sm:text-5xl text-center text-foreground uppercase tracking-tight leading-none">
              Anonymous
            </Text>
            <Text className="font-black font-sans text-4xl sm:text-5xl text-center text-foreground uppercase tracking-tight leading-none">
              Therapy.
            </Text>
            <Text className="font-black font-sans text-4xl sm:text-5xl text-center text-primary uppercase tracking-tight leading-none">
              Real
            </Text>
            <Text className="font-black font-sans text-4xl sm:text-5xl text-center text-primary uppercase tracking-tight leading-none">
              Wellness.
            </Text>
          </View>

          {/* Editorial Subtitle */}
          <Text className="font-bold font-sans text-[15px] text-muted-foreground text-center leading-relaxed px-6 max-w-[340px]">
            Skip the waiting room. Connect with licensed professionals securely, anonymously, and instantly. Mental health care rebuilt for the modern mind.
          </Text>
        </View>

        {/* Action Buttons Block */}
        <View className="gap-4 w-full max-w-[340px] mx-auto pb-6">
          {isSignedIn ? (
            <>
              <Button onPress={handleSignOut} variant="secondary" className="w-full">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              {/* Primary "Get Started" brick red button with white chevron */}
              <Button href="/sign-up" variant="primary" className="w-full">
                <View className="flex-row items-center justify-center gap-2 py-0.5">
                  <Text className="font-bold font-sans text-base text-primary-foreground">
                    Get Started
                  </Text>
                  <Text className="font-bold font-sans text-lg text-primary-foreground leading-none">
                    {"\u203A"}
                  </Text>
                </View>
              </Button>

              {/* Secondary "Sign In" zinc button */}
              <Button href="/sign-in" variant="secondary" className="w-full">
                Sign In
              </Button>
            </>
          )}

          {/* Test Suite Trigger Link */}
          <View className="mt-4 items-center">
            <TextLink href="/test">
              Open test suite
            </TextLink>

          </View>
        </View>
      </Screen>
    </>
  );
}
