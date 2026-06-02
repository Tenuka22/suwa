import { Stack, useRouter } from "expo-router";
import { ArrowLeft, BarChart3 } from "lucide-react-native";
import { View, Text, Pressable, ScrollView } from "react-native";

import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { useThemeColor } from "@/utils/theme";

export default function GuardianTrackManagementScreen() {
  const colors = useThemeColor();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-section bg-background px-page py-page pb-24">
        <View className="gap-2">
          <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
            Track Management
          </Text>
          <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
            View and manage tracked metrics for your linked patients.
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            
            <View className="items-center justify-center py-20 rounded-card border-2 border-dashed border-border">
                <BarChart3 color={colors.mutedForeground} size={48} />
                <Text className="mt-4 font-bold text-muted-foreground">Metrics tracking coming soon</Text>
            </View>
        </ScrollView>
      </Screen>
      <ScreenBottomBar>
        <View className="flex-1" />
        <Pressable
          className="aspect-square h-12 items-center justify-center self-stretch rounded-control border-2 border-border bg-background"
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.foreground} size={16} />
        </Pressable>
      </ScreenBottomBar>
    </>
  );
}
