import { Redirect, Stack } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { RootBottomBar } from "@/components/ui/root-bottom-bar";
import { Screen } from "@/components/ui/screen";
import { TextLink } from "@/components/ui/text-link";

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen
        contentClassName="flex-1 justify-between gap-section px-page py-page pb-24"
        scrollClassName="flex-1 bg-background"
      >
        <View className="gap-4">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            ZenDoc
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Go to the test page to continue.
          </Text>
          <Button
            className="w-full max-w-[340px]"
            href="/test"
            variant="primary"
          >
            Open test page
          </Button>
          <TextLink href="/test">Open test page</TextLink>
        </View>
      </Screen>

      <View className="absolute right-page bottom-page left-page">
        <RootBottomBar />
      </View>
    </>
  );
}
