import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { PackageScreen } from "@/components/test/package-screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { getWearablePackage } from "@/utils/wearable-packages";

export default function PackageTestScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const route = Array.isArray(slug) ? slug[0] : slug;
  const item = route ? getWearablePackage(`/test/${route}`) : undefined;

  if (!item) {
    return (
      <Screen contentClassName="items-center justify-center px-page py-page">
        <Card className="items-center">
          <Text className="text-center font-medium font-sans text-2xl text-foreground">
            Unknown test screen.
          </Text>
          <Button href="/test">Back to test list</Button>
        </Card>
      </Screen>
    );
  }

  return <PackageScreen item={item} />;
}
