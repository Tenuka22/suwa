'use client';

import { useAuth } from "@clerk/expo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  guardianEmail: z
    .string()
    .email("Valid email required")
    .optional()
    .or(z.literal("")),
  guardianPhone: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

export default function OnboardingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { handleError } = useErrorHandler();
  const [role, setRole] = useState<"patient" | "guardian" | null>(null);

  const patientForm = useForm<PatientForm>({
    defaultValues: {
      alias: "",
      email: "",
      phone: "",
      fullName: "",
      address: "",
      guardianEmail: "",
      guardianPhone: "",
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

  const pendingRequests = useQuery(
    orpc.getPendingRequests.queryOptions({
      enabled: role === "guardian",
    })
  );

  const acceptRequest = useMutation(
    orpc.acceptRequest.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        router.replace("/(patient)"); // Or wherever guardians go
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
      guardianEmail: data.guardianEmail,
      guardianPhone: data.guardianPhone,
      _securedData,
    });
  };

  if (!role) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 justify-center gap-section px-page py-page bg-background">
          <View className="mb-8 gap-2">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Welcome
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Choose your role
            </Text>
            <Text className="font-normal font-sans text-muted-foreground text-sm">
              How will you be using ZenDoc?
            </Text>
          </View>

          <View className="gap-4">
            <Button
              className="h-24 justify-start px-6"
              onPress={() => setRole("patient")}
              variant="outline"
            >
              <View className="items-start">
                <Text className="font-bold font-sans text-foreground text-lg">
                  Patient
                </Text>
                <Text className="font-normal font-sans text-muted-foreground text-sm">
                  I want to track my health and sessions.
                </Text>
              </View>
            </Button>

            <Button
              className="h-24 justify-start px-6"
              onPress={() => setRole("guardian")}
              variant="outline"
            >
              <View className="items-start">
                <Text className="font-bold font-sans text-foreground text-lg">
                  Guardian
                </Text>
                <Text className="font-normal font-sans text-muted-foreground text-sm">
                  I want to support and monitor a patient.
                </Text>
              </View>
            </Button>
          </View>
        </Screen>
      </>
    );
  }

  if (role === "guardian") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 gap-section px-page py-page bg-background">
          <View className="mb-4 gap-2">
            <Button
              className="mb-4 self-start"
              onPress={() => setRole(null)}
              variant="ghost"
            >
              ← Back
            </Button>
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Guardian
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Pending Requests
            </Text>
            <Text className="font-normal font-sans text-muted-foreground text-sm">
              Patients who have invited you to be their guardian.
            </Text>
          </View>

          {pendingRequests.isLoading ? (
            <Text>Loading requests...</Text>
          ) : pendingRequests.data?.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-4">
              <Text className="text-center font-normal font-sans text-muted-foreground text-sm">
                No pending requests found for your email or phone number.
              </Text>
              <Button
                onPress={() => pendingRequests.refetch()}
                variant="secondary"
              >
                Refresh
              </Button>
            </View>
          ) : (
            <ScrollView className="flex-1">
              <View className="gap-4">
                {pendingRequests.data?.map((request) => (
                  <Card className="gap-4 p-4" key={request.userId}>
                    <View>
                      <Text className="font-bold font-sans text-foreground text-lg">
                        {request.alias}
                      </Text>
                      <Text className="font-normal font-sans text-muted-foreground text-sm">
                        wants you to be their guardian
                      </Text>
                    </View>
                    <Button
                      disabled={acceptRequest.isPending}
                      onPress={() =>
                        acceptRequest.mutate({ patientUserId: request.userId })
                      }
                    >
                      {acceptRequest.isPending
                        ? "Accepting..."
                        : "Accept Request"}
                    </Button>
                  </Card>
                ))}
              </View>
            </ScrollView>
          )}
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView>
        <Screen contentClassName="flex-1 justify-between gap-section px-page py-page bg-background">
          <View className="gap-section">
            <View className="mb-4 gap-2">
              <Button
                className="mb-4 self-start"
                onPress={() => setRole(null)}
                variant="ghost"
              >
                ← Back
              </Button>
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

            <View className="mt-8 mb-4 gap-2">
              <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
                Guardian (Optional)
              </Text>
              <Text className="font-black font-sans text-2xl text-foreground tracking-tight">
                Who supports you?
              </Text>
              <Text className="font-normal font-sans text-muted-foreground text-sm">
                We'll send an invite to your guardian.
              </Text>
            </View>

            <Controller
              control={patientForm.control}
              name="guardianEmail"
              render={({ field, fieldState }) => (
                <Input
                  autoCapitalize="none"
                  error={fieldState.error?.message}
                  keyboardType="email-address"
                  label="Guardian Email"
                  onChangeText={field.onChange}
                  placeholder="guardian@example.com"
                  value={field.value}
                />
              )}
            />

            <Controller
              control={patientForm.control}
              name="guardianPhone"
              render={({ field, fieldState }) => (
                <Input
                  error={fieldState.error?.message}
                  keyboardType="phone-pad"
                  label="Guardian Phone"
                  onChangeText={field.onChange}
                  placeholder="+1 (555) 000-0000"
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
