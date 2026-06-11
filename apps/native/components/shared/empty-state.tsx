import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useThemeColor } from "@/utils/theme";

interface EmptyStateProps {
  action?: ReactNode;
  description?: string;
  icon?: LucideIcon;
  title: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const colors = useThemeColor();

  return (
    <View className="items-center justify-center rounded-card border-2 border-border border-dashed py-16">
      {Icon && (
        <View className="mb-4">
          <Icon color={colors.mutedForeground} size={48} />
        </View>
      )}
      <Text className="text-center font-bold font-sans text-muted-foreground text-sm">
        {title}
      </Text>
      {description && (
        <Text className="mt-2 max-w-[280px] text-center font-normal font-sans text-muted-foreground text-xs leading-5">
          {description}
        </Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
