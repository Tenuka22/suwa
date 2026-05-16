import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  onPress?: () => unknown;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "items-center rounded-control border-2 border-border bg-primary px-card py-control active:opacity-80 disabled:opacity-50",
  secondary:
    "items-center rounded-control border-2 border-border bg-card px-card py-control active:opacity-80 disabled:opacity-50",
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: "font-medium font-sans text-primary-foreground",
  secondary: "font-medium font-sans text-foreground",
};

export const Button = ({
  children,
  className,
  disabled,
  href,
  onPress,
  variant = "primary",
}: ButtonProps) => {
  const button = (
    <Pressable
      accessibilityRole="button"
      className={`${variantClasses[variant]} ${className ?? ""}`.trim()}
      disabled={disabled}
      onPress={() => onPress?.()}
    >
      <Text className={textVariantClasses[variant]}>{children}</Text>
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
