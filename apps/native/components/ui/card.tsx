import type { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => (
  <View
    className={`gap-section rounded-card border-2 border-border bg-card p-card ${className ?? ""}`.trim()}
  >
    {children}
  </View>
);
