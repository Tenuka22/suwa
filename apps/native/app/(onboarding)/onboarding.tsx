import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";

type OnboardingMode = "self" | "has_guardian" | "guardian" | null;

interface SelectableCardProps {
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  title: string;
}

function SelectableCard({
  icon,
  title,
  description,
  onPress,
}: SelectableCardProps) {
  return (
    <Pressable className="active:opacity-90" onPress={onPress}>
      <Card className="flex-row items-center gap-card p-card">
        <View className="flex h-14 w-14 items-center justify-center rounded-full bg-card border-2 border-border">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="font-extrabold font-sans text-foreground text-lg tracking-tight">
            {title}
          </Text>
          <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
            {description}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const selfSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
});

const hasGuardianSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  guardianEmail: z.string().email("Valid email required"),
  guardianPhone: z.string().min(1, "Phone is required"),
});

const guardianSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  guardianEmail: z.string().email("Valid email required"),
});

type SelfForm = z.infer<typeof selfSchema>;
type HasGuardianForm = z.infer<typeof hasGuardianSchema>;
type GuardianForm = z.infer<typeof guardianSchema>;

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#09090b";

  const [mode, setMode] = useState<OnboardingMode>(null);
  const [step, setStep] = useState<"select" | "form">("select");

  const selfForm = useForm<SelfForm>({
    defaultValues: { alias: "" },
  });

  const hasGuardianForm = useForm<HasGuardianForm>({
    defaultValues: { alias: "", guardianEmail: "", guardianPhone: "" },
  });

  const guardianForm = useForm<GuardianForm>({
    defaultValues: { alias: "", guardianEmail: "" },
  });

  const pendingGuardiansQuery = useQuery({
    queryKey: orpc.getPendingGuardianRequests.queryKey(),
    queryFn: () => orpc.getPendingGuardianRequests.call(),
    enabled: mode === "guardian",
  });

  const completeOnboarding = useMutation(
    orpc.completeOnboarding.mutationOptions({
      onSuccess: () => {
        router.replace("/");
      },
    })
  );

  const handleModeSelect = (
    selectedMode: "self" | "has_guardian" | "guardian"
  ) => {
    setMode(selectedMode);
    setStep("form");
  };

  const onSelfSubmit = (data: SelfForm) => {
    completeOnboarding.mutate({
      mode: "self",
      alias: data.alias,
    });
  };

  const onHasGuardianSubmit = (data: HasGuardianForm) => {
    completeOnboarding.mutate({
      mode: "has_guardian",
      alias: data.alias,
      guardianEmail: data.guardianEmail,
      guardianPhone: data.guardianPhone,
    });
  };

  const onGuardianSubmit = (data: GuardianForm) => {
    completeOnboarding.mutate({
      mode: "guardian",
      alias: data.alias,
      guardianEmail: data.guardianEmail,
    });
  };

  const handleApproveGuardian = useMutation(
    orpc.approveGuardianRequest.mutationOptions({
      onSuccess: () => {
        pendingGuardiansQuery.refetch();
      },
    })
  );

  if (step === "select") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 justify-center gap-section px-page py-page bg-background">
          <View className="gap-2 mb-2">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Welcome to ZenDoc
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Who are you signing up for?
            </Text>
            <Text className="font-normal font-sans text-base text-muted-foreground leading-6 mt-1">
              Choose how you want to configure your medical access and patient details.
            </Text>
          </View>

          <View className="gap-4">
            <SelectableCard
              description="Manage your own appointments, medical records, and daily wellness tracking in one place."
              icon={<FontAwesome color={iconColor} name="user" size={26} />}
              onPress={() => handleModeSelect("self")}
              title="Manage for myself"
            />
            <SelectableCard
              description="Set up a guardian to manage your healthcare and appointments on your behalf."
              icon={<FontAwesome color={iconColor} name="user-plus" size={26} />}
              onPress={() => handleModeSelect("has_guardian")}
              title="I have a guardian"
            />
            <SelectableCard
              description="Act as a guardian to manage healthcare and appointments for a family member or dependent."
              icon={<FontAwesome color={iconColor} name="users" size={26} />}
              onPress={() => handleModeSelect("guardian")}
              title="I'm a guardian"
            />
          </View>
        </Screen>
      </>
    );
  }

  if (mode === "self") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 justify-between gap-section px-page py-page bg-background">
          <View className="gap-section">
            <View className="gap-2 mb-4">
              <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
                Your Profile
              </Text>
              <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
                Tell us about yourself
              </Text>
            </View>

            <Controller
              control={selfForm.control}
              name="alias"
              render={({ field, fieldState }) => (
                <View className="gap-2">
                  <Field
                    label="Your Alias"
                    error={fieldState.error?.message}
                    inputProps={{
                      onChangeText: field.onChange,
                      placeholder: "Enter a nickname",
                      placeholderTextColor: "#6b7280",
                      value: field.value,
                    }}
                  />
                  <Text className="font-normal font-sans text-muted-foreground text-xs leading-4 mt-1">
                    This is how you will appear to doctors. It can be any name
                    you choose.
                  </Text>
                </View>
              )}
            />
          </View>

          <View className="gap-3 mt-4">
            <Button
              disabled={
                completeOnboarding.isPending || !selfForm.watch("alias")
              }
              onPress={selfForm.handleSubmit(onSelfSubmit)}
              className="w-full"
            >
              {completeOnboarding.isPending ? "Setting up..." : "Continue"}
            </Button>
            <Button
              onPress={() => {
                setMode(null);
                setStep("select");
              }}
              variant="secondary"
              className="w-full"
            >
              Back
            </Button>
          </View>
        </Screen>
      </>
    );
  }

  if (mode === "has_guardian") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 justify-between gap-section px-page py-page bg-background">
          <View className="gap-section">
            <View className="gap-2 mb-4">
              <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
                Guardian Setup
              </Text>
              <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
                Set up your guardian
              </Text>
            </View>

            <View className="gap-2">
              <Controller
                control={hasGuardianForm.control}
                name="alias"
                render={({ field, fieldState }) => (
                  <Field
                    label="Your Alias"
                    error={fieldState.error?.message}
                    inputProps={{
                      onChangeText: field.onChange,
                      placeholder: "Enter a nickname",
                      placeholderTextColor: "#6b7280",
                      value: field.value,
                    }}
                  />
                )}
              />

              <Controller
                control={hasGuardianForm.control}
                name="guardianEmail"
                render={({ field, fieldState }) => (
                  <Field
                    label="Guardian Email"
                    error={fieldState.error?.message}
                    inputProps={{
                      autoCapitalize: "none",
                      keyboardType: "email-address",
                      onChangeText: field.onChange,
                      placeholder: "guardian@example.com",
                      placeholderTextColor: "#6b7280",
                      value: field.value,
                    }}
                  />
                )}
              />

              <Controller
                control={hasGuardianForm.control}
                name="guardianPhone"
                render={({ field, fieldState }) => (
                  <Field
                    label="Guardian Phone"
                    error={fieldState.error?.message}
                    inputProps={{
                      keyboardType: "phone-pad",
                      onChangeText: field.onChange,
                      placeholder: "+1 (555) 000-0000",
                      placeholderTextColor: "#6b7280",
                      value: field.value,
                    }}
                  />
                )}
              />
            </View>
          </View>

          <View className="gap-3 mt-4">
            <Button
              disabled={
                completeOnboarding.isPending ||
                !hasGuardianForm.formState.isValid
              }
              onPress={hasGuardianForm.handleSubmit(onHasGuardianSubmit)}
              className="w-full"
            >
              {completeOnboarding.isPending ? "Setting up..." : "Continue"}
            </Button>
            <Button
              onPress={() => {
                setMode(null);
                setStep("select");
              }}
              variant="secondary"
              className="w-full"
            >
              Back
            </Button>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="flex-1 justify-between gap-section px-page py-page bg-background">
        <View className="gap-section">
          <View className="gap-2 mb-4">
            <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
              Guardian Setup
            </Text>
            <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
              Set up your guardian profile
            </Text>
          </View>

          <View className="gap-3">
            <Controller
              control={guardianForm.control}
              name="alias"
              render={({ field, fieldState }) => (
                <View className="gap-1">
                  <Field
                    label="Your Alias"
                    error={fieldState.error?.message}
                    inputProps={{
                      onChangeText: field.onChange,
                      placeholder: "Enter a nickname",
                      placeholderTextColor: "#6b7280",
                      value: field.value,
                    }}
                  />
                  <Text className="font-normal font-sans text-muted-foreground text-xs leading-4 mt-1">
                    This is how patients will identify you.
                  </Text>
                </View>
              )}
            />

            <Controller
              control={guardianForm.control}
              name="guardianEmail"
              render={({ field, fieldState }) => (
                <Field
                  label="Your Email"
                  error={fieldState.error?.message}
                  inputProps={{
                    autoCapitalize: "none",
                    keyboardType: "email-address",
                    onChangeText: field.onChange,
                    placeholder: "guardian@example.com",
                    placeholderTextColor: "#6b7280",
                    value: field.value,
                  }}
                />
              )}
            />

            {pendingGuardiansQuery.data?.requests?.length ? (
              <View className="gap-chip mt-4">
                <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.18em] mb-1">
                  Pending Requests
                </Text>
                {pendingGuardiansQuery.data.requests.map((req) => (
                  <Card key={req.userId} className="gap-3 p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="gap-1 flex-1 mr-3">
                        <Text className="font-extrabold font-sans text-lg text-foreground tracking-tight">
                          {req.alias}
                        </Text>
                        <Text className="font-normal font-sans text-muted-foreground text-xs">
                          {req.guardianEmail} • {req.guardianPhone}
                        </Text>
                      </View>
                      <Button
                        size="sm"
                        onPress={() =>
                          handleApproveGuardian.mutate({
                            patientUserId: req.userId,
                          })
                        }
                      >
                        Approve
                      </Button>
                    </View>
                  </Card>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View className="gap-3 mt-4">
          <Button
            disabled={
              completeOnboarding.isPending || !guardianForm.formState.isValid
            }
            onPress={guardianForm.handleSubmit(onGuardianSubmit)}
            className="w-full"
          >
            {completeOnboarding.isPending ? "Setting up..." : "Continue"}
          </Button>
          <Button
            onPress={() => {
              setMode(null);
              setStep("select");
            }}
            variant="secondary"
            className="w-full"
          >
            Back
          </Button>
        </View>
      </Screen>
    </>
  );
}
