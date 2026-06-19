"use client";

import type { ReactNode } from "react";
import { Text, TextInput, View } from "react-native";

interface InputProps extends React.ComponentProps<typeof TextInput> {
  containerClassName?: string;
  error?: string;
  inputContainerClassName?: string;
  label?: string;
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
        <Text className="font-medium font-sans text-caption text-foreground">
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
        <Text className="font-sans text-caption text-destructive">{error}</Text>
      ) : null}
    </View>
  );
}
