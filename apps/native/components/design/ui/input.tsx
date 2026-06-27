"use client";

import type { ReactNode } from "react";
import { Text, TextInput, View } from "react-native";

interface InputProps extends React.ComponentProps<typeof TextInput> {
  containerClassName?: string;
  error?: string;
  inputContainerClassName?: string;
  label?: string;
  leftIcon?: ReactNode;
  optional?: boolean;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  containerClassName,
  inputContainerClassName,
  className,
  leftIcon,
  optional,
  rightIcon,
  ...props
}: InputProps) {
  return (
    <View className={`gap-2 ${containerClassName ?? ""}`.trim()}>
      {label ? (
        <View className="flex-row items-center justify-between">
          <Text className="font-poppins-medium text-caption text-foreground">
            {label}
          </Text>
          {optional ? (
            <Text className="font-sans text-foreground-muted text-micro">
              Optional
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        className={`flex-row items-center gap-2 overflow-hidden rounded-xl border-2 bg-background-elevated px-4 ${error ? "border-destructive" : "border-input"} ${inputContainerClassName ?? ""}`.trim()}
      >
        {leftIcon && <View className="shrink-0">{leftIcon}</View>}
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          className={`min-w-0 flex-1 py-4 font-sans text-body text-foreground outline-none placeholder:text-foreground-placeholder ${className ?? ""}`.trim()}
          numberOfLines={1}
          {...props}
        />
        {rightIcon && <View className="shrink-0">{rightIcon}</View>}
      </View>
      {error ? (
        <Text className="font-sans text-caption text-destructive">{error}</Text>
      ) : null}
    </View>
  );
}
