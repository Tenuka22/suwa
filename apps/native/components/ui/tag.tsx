'use client';

import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useThemeColor } from "@/utils/theme";

type TagVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "muted";

type TagSize = "sm" | "md" | "lg";

type TagShape = "chip" | "pill";

interface TagProps {
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  iconSize?: number;
  shape?: TagShape;
  size?: TagSize;
  variant?: TagVariant;
}

const variantStyles: Record<
  TagVariant,
  {
    container: string;
    text: string;
    colorKey: keyof ReturnType<typeof useThemeColor>;
  }
> = {
  default: {
    container: "border-border bg-card",
    text: "text-foreground",
    colorKey: "foreground",
  },
  primary: {
    container: "border-primary bg-primary",
    text: "text-primary-foreground",
    colorKey: "primaryForeground",
  },
  secondary: {
    container: "border-border bg-secondary",
    text: "text-foreground",
    colorKey: "foreground",
  },
  success: {
    container: "border-success bg-success/10",
    text: "text-success",
    colorKey: "success",
  },
  warning: {
    container: "border-warning/30 bg-warning/20",
    text: "text-warning",
    colorKey: "warning",
  },
  destructive: {
    container: "border-destructive/30 bg-destructive/15",
    text: "text-destructive",
    colorKey: "destructive",
  },
  muted: {
    container: "border-border/50 bg-card",
    text: "text-muted-foreground",
    colorKey: "mutedForeground",
  },
};

const sizeStyles: Record<TagSize, { container: string; text: string }> = {
  sm: {
    container: "px-2 py-0.5",
    text: "text-[9px]",
  },
  md: {
    container: "px-3 py-1",
    text: "text-xs",
  },
  lg: {
    container: "px-3 py-1.5",
    text: "text-[10px]",
  },
};

const shapeStyles: Record<TagShape, string> = {
  chip: "rounded-chip border-2",
  pill: "rounded-full",
};

export const Tag = ({
  children,
  variant = "default",
  size = "md",
  shape = "chip",
  icon: Icon,
  iconSize = 10,
  className = "",
}: TagProps) => {
  const colors = useThemeColor();
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const shapeClass = shapeStyles[shape];

  return (
    <View
      className={`flex-row items-center gap-1 ${shapeClass} ${v.container} ${s.container} ${className}`.trim()}
    >
      {Icon ? (
        <Icon color={colors[v.colorKey]} size={iconSize} strokeWidth={2.5} />
      ) : null}
      <Text
        className={`font-bold font-sans uppercase tracking-wider ${v.text} ${s.text}`}
      >
        {children}
      </Text>
    </View>
  );
};
