'use client';

import { useRef, useState } from "react";
import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

interface InputProps extends TextInputProps {
  error?: string;
  label: string;
}

export const Input = ({ error, label, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View className="mb-4 gap-1.5">
      <Text
        className="font-medium font-sans text-foreground text-sm"
        onPress={() => inputRef.current?.focus()}
      >
        {label}
      </Text>
      <View>
        <TextInput
          className={`rounded-control border-2 bg-card px-card py-control font-sans text-base text-foreground ${error ? "border-destructive" : isFocused ? "border-primary" : "border-border"}`}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          placeholderTextColor="#71717a"
          ref={inputRef}
          {...props}
        />
        {error ? (
          <Text className="mt-1 font-sans text-destructive text-sm">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
};
