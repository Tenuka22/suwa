"use client";

import type { ReactNode } from "react";
import { Text, TextInput, View } from "react-native";

interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputContainerClassName?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  containerClassName,
  inputContainerClassName,
  className,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  return (
    <View className={`gap-2 ${containerClassName ?? ""}`.trim()}>
      {label ? (
        <Text className="font-medium font-sans text-foreground text-caption">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-xl border-2 bg-background-elevated px-4 ${error ? "border-destructive" : "border-input"} ${inputContainerClassName ?? ""}`.trim()}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className={`flex-1 py-4 font-sans text-body text-foreground outline-none placeholder:text-foreground-placeholder ${className ?? ""}`.trim()}
          {...props}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error ? (
        <Text className="font-sans text-destructive text-caption">{error}</Text>
      ) : null}
    </View>
  );
}
