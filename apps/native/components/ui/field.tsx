import { useState } from "react";
import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

interface FieldProps {
  error?: string;
  inputProps: TextInputProps;
  label: string;
}

export const Field = ({ error, inputProps, label }: FieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-2 gap-chip">
      <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
        {label}
      </Text>

      <View
        className="relative"
        style={{ position: "relative", overflow: "visible" }}
      >
        {/* Solid Cohesive Shadow Layer (Only active when input is focused) */}
        <View
          className="absolute inset-0 rounded-control bg-border"
          style={{
            transform: [{ translateX: 4 }, { translateY: 4 }],
            opacity: isFocused ? 1 : 0,
          }}
        />

        {/* The Text Input */}
        <TextInput
          className={`rounded-control border-2 border-border bg-card px-card py-control font-sans text-base text-foreground ${error ? "border-destructive" : ""}
          `.trim()}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          {...inputProps}
        />
      </View>

      {error ? (
        <Text className="font-sans font-semibold text-destructive text-sm">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
