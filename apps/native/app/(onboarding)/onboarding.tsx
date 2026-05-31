import { useAuth } from "@clerk/expo";
import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";
import { encryptData, generateUserSecret, storeSecret } from "@/utils/privacy";

const patientSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  fullName: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

export default function OnboardingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const patientForm = useForm<PatientForm>({
    defaultValues: {
      alias: "",
      email: "",
      phone: "",
      fullName: "",
      address: "",
    },
  });

  const completeOnboarding = useMutation(
    orpc.completeOnboarding.mutationOptions({
      onSuccess: () => {
        router.replace("/(patient)");
      },
    })
  );

  if (isLoaded && !isSignedIn) {
    router.replace("/(auth)/sign-in");
    return null;
  }

  const onPatientSubmit = async (data: PatientForm) => {
    const secret = generateUserSecret();
    await storeSecret(secret);

    const _securedData = await encryptData(
      {
        email: data.email ?? "",
        phone: data.phone ?? "",
        fullName: data.fullName ?? "",
        address: data.address ?? "",
      },
      secret
    );

    completeOnboarding.mutate({
      alias: data.alias,
      _securedData,
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="flex-1 justify-between gap-section px-page py-page bg-background">
        <View className="gap-section">
          <View className="mb-4 gap-2">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Your Profile
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Tell us about yourself
            </Text>
          </View>

          <Controller
            control={patientForm.control}
            name="alias"
            render={({ field, fieldState }) => (
              <Field
                error={fieldState.error?.message}
                label="Your Alias"
                onChangeText={field.onChange}
                placeholder="Enter a nickname"
                value={field.value}
              />
            )}
          />

          <Controller
            control={patientForm.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field
                autoCapitalize="none"
                error={fieldState.error?.message}
                keyboardType="email-address"
                label="Email"
                onChangeText={field.onChange}
                placeholder="email@example.com"
                value={field.value}
              />
            )}
          />

          <Controller
            control={patientForm.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field
                error={fieldState.error?.message}
                keyboardType="phone-pad"
                label="Phone"
                onChangeText={field.onChange}
                placeholder="+1 (555) 000-0000"
                value={field.value}
              />
            )}
          />

          <Controller
            control={patientForm.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <Field
                error={fieldState.error?.message}
                label="Full Name"
                onChangeText={field.onChange}
                placeholder="Your full name"
                value={field.value}
              />
            )}
          />

          <Controller
            control={patientForm.control}
            name="address"
            render={({ field, fieldState }) => (
              <Field
                error={fieldState.error?.message}
                label="Address"
                onChangeText={field.onChange}
                placeholder="Your address"
                value={field.value}
              />
            )}
          />
        </View>

        <Button
          className="w-full"
          disabled={
            completeOnboarding.isPending || !patientForm.watch("alias")
          }
          onPress={patientForm.handleSubmit(onPatientSubmit)}
        >
          {completeOnboarding.isPending ? "Setting up..." : "Complete Setup"}
        </Button>
      </Screen>
    </>
  );
}
