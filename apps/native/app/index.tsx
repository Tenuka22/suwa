import { useAuth, useClerk } from "@clerk/expo";
import { Stack } from "expo-router";
import { ArrowRight, Calendar, Stethoscope } from "lucide-react-native";
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
      <View className="flex-row items-center justify-between border-border border-b-[3px] bg-card px-page py-page">
        <Text className="font-black font-sans text-3xl text-foreground tracking-tight">
          ZenDoc
        </Text>
        {isSignedIn ? (
          <View className="flex-row items-center gap-2">
            <Button href="/appointments" size="sm" variant="secondary">
              <View className="flex-row items-center gap-2">
                <Calendar color="#09090b" size={16} />
                <Text className="font-bold font-sans text-foreground text-sm">
                  Appointments
                </Text>
              </View>
            </Button>
            <Button href="/doctors" size="sm">
              <View className="flex-row items-center gap-2">
                <Stethoscope color="#fafafa" fill="#fafafa" size={16} />
                <Text className="font-bold font-sans text-primary-foreground text-sm">
                  Doctors
                </Text>
                <ArrowRight color="#fafafa" fill="#fafafa" size={14} />
              </View>
            </Button>
          </View>
        ) : (
          <Button href="/sign-up" size="sm">
            Sign Up
          </Button>
        )}
      </View>

      {/* Main Screen Layout */}
      <Screen
        contentClassName="flex-1 px-page py-page justify-between gap-section"
        scrollClassName="flex-1 bg-background"
      >
        {/* Central Content Card/Area */}
        <View className="flex-1 items-center justify-center gap-8 py-8">
          {/* Stark Brutalist Headlines */}
          <View className="items-center gap-1">
            <Text className="text-center font-black font-sans text-4xl text-foreground uppercase leading-none tracking-tight sm:text-5xl">
              Anonymous
            </Text>
            <Text className="text-center font-black font-sans text-4xl text-foreground uppercase leading-none tracking-tight sm:text-5xl">
              Therapy.
            </Text>
            <Text className="text-center font-black font-sans text-4xl text-primary uppercase leading-none tracking-tight sm:text-5xl">
              Real
            </Text>
            <Text className="text-center font-black font-sans text-4xl text-primary uppercase leading-none tracking-tight sm:text-5xl">
              Wellness.
            </Text>
          </View>

          {/* Editorial Subtitle */}
          <Text className="max-w-[340px] px-6 text-center font-bold font-sans text-[15px] text-muted-foreground leading-relaxed">
            Skip the waiting room. Connect with licensed professionals securely,
            anonymously, and instantly. Mental health care rebuilt for the
            modern mind.
          </Text>
        </View>

        {/* Action Buttons Block */}
        <View className="mx-auto w-full max-w-[340px] gap-4 pb-6">
          {isSignedIn ? (
            <Button
              className="w-full"
              onPress={handleSignOut}
              variant="secondary"
            >
              Sign Out
            </Button>
          ) : (
            <>
              {/* Primary "Get Started" brick red button with white chevron */}
              <Button className="w-full" href="/sign-up" variant="primary">
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
              <Button className="w-full" href="/sign-in" variant="secondary">
                Sign In
              </Button>
            </>
          )}

          {/* Test Suite Trigger Link */}
          <View className="mt-4 items-center">
            <TextLink href="/test">Open test suite</TextLink>
            <TextLink href="/doctors">Browse doctors</TextLink>
            <TextLink href="/appointments">View appointments</TextLink>
          </View>
        </View>
      </Screen>
    </>
  );
}
