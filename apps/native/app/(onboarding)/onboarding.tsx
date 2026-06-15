"use client";

import { useAuth } from "@clerk/expo";
import { useMutation } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { orpc, queryClient } from "@/utils/orpc";
import { encryptData, generateUserSecret, storeSecret } from "@/utils/privacy";
import { useErrorHandler } from "@/utils/use-error-handler";

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
  const { handleError } = useErrorHandler();

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
        queryClient.invalidateQueries();
        router.replace("/(patient)");
      },
      onError: (err) => handleError(err),
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
      <ScrollView>
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
                <Input
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
                <Input
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
                <Input
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
                <Input
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
                <Input
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
            className="mt-8 w-full"
            disabled={
              completeOnboarding.isPending || !patientForm.watch("alias")
            }
            onPress={patientForm.handleSubmit(onPatientSubmit)}
          >
            {completeOnboarding.isPending ? "Setting up..." : "Complete Setup"}
          </Button>
        </Screen>
      </ScrollView>
    </>
  );
}
