"use client";

import { Text, View } from "react-native";

import { Button } from "@/components/design/ui/button";
import { Card } from "@/components/design/ui/card";
import { Screen } from "@/components/design/ui/screen";
import { wearablePackages } from "@/utils/wearable-packages";

export default function TestIndexScreen() {
  return (
    <Screen contentClassName="gap-section px-page py-page bg-background">
      <View className="mb-2 gap-2">
        <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
          Connection lab
        </Text>
        <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
          Pick a connection.
        </Text>
        <Text className="mt-1 font-normal font-sans text-base text-muted-foreground leading-6">
          No authentication is required here. Select a route below to run its
          integration flow and test action payloads.
        </Text>
      </View>

      <View className="gap-section">
        <Card className="gap-4">
          <View className="gap-1">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
              Conference
            </Text>
            <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
              Video Sessions
            </Text>
            <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-6">
              Test video conferencing features with admin access and no time
              restrictions.
            </Text>
          </View>
          <Button className="w-full" href="/test/session" variant="secondary">
            Open Session Lab ›
          </Button>
        </Card>

        {wearablePackages.map((item) => (
          <Card className="gap-4" key={item.route}>
            <View className="gap-1">
              <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
                {item.sourceLabel}
              </Text>
              <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
                {item.title}
              </Text>
              <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-6">
                {item.docsSummary}
              </Text>
            </View>
            <Button className="w-full" href={item.route} variant="secondary">
              Open Test Screen ›
            </Button>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
