'use client';

import { Stack } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <Screen contentClassName="flex-1 items-center justify-center px-page py-page">
        <View>
          <Card className="items-center">
            <Text className="font-normal font-sans text-6xl">🤔</Text>
            <Text className="text-center font-medium font-sans text-2xl text-foreground">
              Page Not Found
            </Text>
            <Text className="max-w-sm text-center font-normal font-sans text-base text-muted-foreground leading-6">
              Sorry, the page you&apos;re looking for doesn&apos;t exist.
            </Text>
            <Button href="/">Go to Home</Button>
          </Card>
        </View>
      </Screen>
    </>
  );
}
