import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

interface FieldProps {
  error?: string;
  inputProps: TextInputProps;
  label: string;
}

export const Field = ({ error, inputProps, label }: FieldProps) => (
  <View className="gap-chip">
    <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
      {label}
    </Text>
    <TextInput
      className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
      {...inputProps}
    />
    {error ? (
      <Text className="font-medium font-sans text-destructive text-sm">
        {error}
      </Text>
    ) : null}
  </View>
);
