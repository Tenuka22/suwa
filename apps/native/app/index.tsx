import { useAuth, useClerk } from "@clerk/expo";
import { Stack } from "expo-router";
import { Text, useColorScheme, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const colorScheme = useColorScheme();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="flex-1 justify-between gap-section px-page py-page">
        <View className="gap-section">
          <View className="gap-chip">
            <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
              NativeWind v5
            </Text>
            <Text className="font-medium font-sans text-4xl text-foreground leading-tight">
              Neo brutalist home screen.
            </Text>
            <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
              The app uses shared design tokens for colors, spacing, and radius.
            </Text>
          </View>

          <Card>
            <View className="flex-row items-center justify-between gap-chip">
              <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                Current theme
              </Text>
              <Text className="font-medium font-sans text-primary text-sm">
                {colorScheme ?? "light"}
              </Text>
            </View>
            <View className="mt-section flex-row gap-chip">
              <View className="h-16 flex-1 rounded-control border-2 border-border bg-muted" />
              <View className="h-16 flex-1 rounded-control border-2 border-border bg-primary" />
            </View>
          </Card>
        </View>

        <View className="gap-chip">
          {isSignedIn ? (
            <Button onPress={handleSignOut} variant="secondary">
              Sign out
            </Button>
          ) : (
            <View className="flex-row gap-chip">
              <Button className="flex-1" href="/sign-in" variant="secondary">
                Sign in
              </Button>
              <Button className="flex-1" href="/sign-up">
                Sign up
              </Button>
            </View>
          )}
          <Button href="/test" variant="secondary">
            Open test suite
          </Button>
        </View>
      </Screen>
    </>
  );
}
