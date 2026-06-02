import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onPress?: () => unknown;
}

export const Card = ({ children, className, onPress, href }: CardProps) => {
  const isPressable = !!(onPress || href);

  const cardContent = (pressed?: boolean) => (
    <>
      
      <View
        className="absolute inset-0 rounded-card bg-border"
        style={{
          transform: [{ translateX: 4 }, { translateY: 4 }],
        }}
      />

      
      <View
        className={`gap-section rounded-card border-2 border-border bg-card p-card ${className ?? ""}`.trim()}
        style={{
          transform:
            isPressable && pressed
              ? [{ translateX: 4 }, { translateY: 4 }]
              : [{ translateX: 0 }, { translateY: 0 }],
        }}
      >
        {children}
      </View>
    </>
  );

  if (isPressable) {
    const pressableCard = (
      <Pressable
        className="relative"
        onPress={() => onPress?.()}
        style={{ position: "relative", overflow: "visible" }}
      >
        {({ pressed }) => cardContent(pressed)}
      </Pressable>
    );

    if (href) {
      return (
        <Link asChild href={href as Href}>
          {pressableCard}
        </Link>
      );
    }

    return pressableCard;
  }

  return (
    <View
      className="relative"
      style={{ position: "relative", overflow: "visible" }}
    >
      {cardContent(false)}
    </View>
  );
};
