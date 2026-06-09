import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";

import { useThemeColor } from "@/utils/theme";

interface IconButtonProps {
  className?: string;
  disabled?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  iconSize?: number;
  onPress?: () => void;
  strokeWidth?: number;
}

export const IconButton = ({
  icon: Icon,
  onPress,
  disabled,
  className = "",
  iconSize = 18,
  iconColor,
  strokeWidth = 2.5,
}: IconButtonProps) => {
  const colors = useThemeColor();

  return (
    <Pressable
      className={`aspect-square items-center justify-center self-stretch rounded-control border-2 border-border bg-background ${disabled ? "opacity-50" : ""} ${className}`.trim()}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon
        color={
          iconColor ?? (disabled ? colors.mutedForeground : colors.foreground)
        }
        size={iconSize}
        strokeWidth={strokeWidth}
      />
    </Pressable>
  );
};
