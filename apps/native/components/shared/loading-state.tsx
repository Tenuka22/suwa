"use client";

import { ActivityIndicator, Text, View } from "react-native";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <View className="items-center justify-center gap-3 py-16">
      <ActivityIndicator className="text-primary" size="large" />
      <Text
        className="font-bold font-sans text-muted-foreground"
        style={{ color: "#ef4444" }}
      >
        {message}
      </Text>
    </View>
  );
}
