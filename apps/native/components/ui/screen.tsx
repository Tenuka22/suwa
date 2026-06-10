import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { LoadingState } from "@/components/shared/loading-state";
import { useThemeColor } from "@/utils/theme";

interface ScreenProps {
  children: ReactNode;
  contentClassName?: string;
  scrollClassName?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
}

export const Screen = ({
  children,
  contentClassName,
  scrollClassName,
  loading,
  error,
  onRetry,
  loadingMessage,
}: ScreenProps) => {
  const colors = useThemeColor();

  if (loading) {
    return (
      <ScrollView
        className={scrollClassName ?? "flex-1 bg-background"}
        contentContainerStyle={{ flexGrow: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LoadingState message={loadingMessage} />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        className={scrollClassName ?? "flex-1 bg-background"}
        contentContainerStyle={{ flexGrow: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center gap-4 px-page py-page">
          <Text className="text-center font-bold font-sans text-destructive text-lg">
            {error}
          </Text>
          {onRetry && (
            <Pressable
              className="rounded-control border-2 border-border bg-card px-6 py-3"
              onPress={onRetry}
            >
              <Text
                className="font-bold font-sans text-primary text-sm"
                style={{ color: colors.primary }}
              >
                Retry
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className={scrollClassName ?? "flex-1 bg-background"}
      contentContainerStyle={{ flexGrow: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className={contentClassName ?? "flex-1 px-page py-page"}>
        {children}
      </View>
    </ScrollView>
  );
};
