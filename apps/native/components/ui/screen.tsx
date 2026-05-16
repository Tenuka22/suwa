import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

interface ScreenProps {
  children: ReactNode;
  contentClassName?: string;
  scrollClassName?: string;
}

export const Screen = ({
  children,
  contentClassName,
  scrollClassName,
}: ScreenProps) => (
  <ScrollView
    className={scrollClassName ?? "flex-1 bg-background"}
    contentContainerStyle={{ flexGrow: 1 }}
    contentInsetAdjustmentBehavior="automatic"
    showsVerticalScrollIndicator={false}
  >
    <View className={contentClassName ?? "flex-1 px-page py-page"}>
      {children}
    </View>
  </ScrollView>
);
