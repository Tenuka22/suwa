import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { wearablePackages } from "@/utils/wearable-packages";

export default function TestIndexScreen() {
  return (
    <Screen contentClassName="gap-section px-page py-page">
      <Card>
        <View className="gap-chip">
          <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
            Connection lab
          </Text>
          <Text className="font-medium font-sans text-4xl text-foreground">
            Pick a connection to run.
          </Text>
          <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
            No auth is required here. Each route runs a specific connection and
            action flow.
          </Text>
        </View>

        <View className="gap-chip">
          {wearablePackages.map((item) => (
            <Card className="gap-chip" key={item.route}>
              <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                {item.sourceLabel}
              </Text>
              <Text className="font-medium font-sans text-2xl text-foreground">
                {item.title}
              </Text>
              <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
                {item.docsSummary}
              </Text>
              <Button href={item.route} variant="secondary">
                Open test screen
              </Button>
            </Card>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
