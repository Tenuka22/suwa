import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "default";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  onPress?: () => unknown;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = ({
  children,
  className,
  disabled,
  href,
  onPress,
  variant = "primary",
  size = "default",
}: ButtonProps) => {
  const isString = typeof children === "string";
  const paddingClass = size === "sm" ? "px-4 py-1.5" : "px-card py-control";

  const button = (
    <Pressable
      accessibilityRole="button"
      className={`relative ${disabled ? "opacity-60" : ""} ${className ?? ""}`.trim()}
      disabled={disabled}
      onPress={() => onPress?.()}
      style={{ position: "relative", overflow: "visible" }}
    >
      {({ pressed }) => (
        <>
          {/* Neo-brutalist Solid Shadow Layer (does not move) */}
          <View
            className="absolute inset-0 rounded-control bg-border"
            style={{
              transform: [{ translateX: 4 }, { translateY: 4 }],
            }}
          />

          {/* Main Interactive Button Front (translates on click to align with shadow) */}
          <View
            className={`w-full flex-row items-center justify-center rounded-control border-2 border-border ${paddingClass} ${
              variant === "primary" ? "bg-primary" : "bg-card"
            }`}
            style={{
              transform:
                pressed && !disabled
                  ? [{ translateX: 4 }, { translateY: 4 }]
                  : [{ translateX: 0 }, { translateY: 0 }],
            }}
          >
            {isString ? (
              <Text
                className={`text-center font-bold font-sans ${
                  size === "sm" ? "text-sm" : "text-base"
                } ${variant === "primary" ? "text-primary-foreground" : "text-foreground"}`}
              >
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        </>
      )}
    </Pressable>
  );

  if (href) {
    return (
      <Link asChild href={href as Href}>
        {button}
      </Link>
    );
  }

  return button;
};
