import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { wearablePackages } from "@/utils/wearable-packages";

export default function TestIndexScreen() {
  return (
    <Screen contentClassName="gap-section px-page py-page bg-background">
      {/* Intro Header Section (Flat, Editorial, Direct on Page Background) */}
      <View className="gap-2 mb-2">
        <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
          Connection lab
        </Text>
        <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
          Pick a connection.
        </Text>
        <Text className="font-normal font-sans text-base text-muted-foreground leading-6 mt-1">
          No authentication is required here. Select a route below to run its integration flow and test action payloads.
        </Text>
      </View>

      {/* Connection Cards List */}
      <View className="gap-section">
        {wearablePackages.map((item) => (
          <Card key={item.route} className="gap-4">
            <View className="gap-1">
              <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.18em]">
                {item.sourceLabel}
              </Text>
              <Text className="font-extrabold font-sans text-2xl text-foreground tracking-tight">
                {item.title}
              </Text>
              <Text className="font-normal font-sans text-muted-foreground text-sm leading-6 mt-1">
                {item.docsSummary}
              </Text>
            </View>
            <Button href={item.route} variant="secondary" className="w-full">
              Open Test Screen ›
            </Button>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
