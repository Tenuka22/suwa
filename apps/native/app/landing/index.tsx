"use client";

import { useAuth, useOAuth, useSignIn, useSignUp } from "@clerk/expo";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/design/ui/button";
import { Input } from "@/components/design/ui/input";
import { ToggleGroup } from "@/components/design/ui/toggle-group";
import { pushDecoratedUrl } from "@/utils/auth";
import { orpc, queryClient } from "@/utils/orpc";
import { encryptData, generateUserSecret, storeSecret } from "@/utils/privacy";

const patientSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  fullName: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

type Step = "start" | "auth" | "profile";

type AuthMode = "sign-in" | "sign-up";

type ProviderStrategy = "oauth_google" | "oauth_facebook";

function ActionButton({
  children,
  onPress,
  disabled,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      disabled={disabled}
      icon={<ArrowRight color="white" size={18} />}
      justify="between"
      onPress={onPress}
    >
      {children}
    </Button>
  );
}

function OAuthButton({
  label,
  strategy,
}: {
  label: string;
  strategy: ProviderStrategy;
}) {
  const { startOAuthFlow } = useOAuth({ strategy });
  return (
    <Button
      variant="outline"
      onPress={async () => {
        const { createdSessionId, setActive } = await startOAuthFlow({
          redirectUrl: Linking.createURL("/", { scheme: "suwa" }),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      }}
    >
      {label}
    </Button>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const {
    signIn,
    errors: signInErrors,
    fetchStatus: signInStatus,
  } = useSignIn();
  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpStatus,
  } = useSignUp();
  const [step, setStep] = useState<Step>("start");
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setStep("profile");
    }
  }, [isLoaded, isSignedIn]);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState<PatientForm>({
    alias: "",
    email: "",
    phone: "",
    fullName: "",
    address: "",
  });
  useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      meta: { ignoreError: true },
    })
  );
  const completeOnboarding = useMutation(
    orpc.completeOnboarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        router.replace("/(patient)");
      },
    })
  );
  const needsCode =
    mode === "sign-up"
      ? signUp.status === "missing_requirements" &&
        signUp.unverifiedFields.includes("email_address") &&
        signUp.missingFields.length === 0
      : signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust";
  const currentFlow = useMemo(
    () => (step === "profile" ? "profile" : step === "auth" ? "auth" : "start"),
    [step]
  );
  const submitAuth = async () => {
    setStatusMessage(null);
    const result =
      mode === "sign-in"
        ? await signIn.password({ emailAddress, password })
        : await signUp.password({ emailAddress, password });
    if (result.error) {
      setStatusMessage(
        result.error.longMessage ?? `Unable to ${mode.replace("-", " ")}.`
      );
      return;
    }
    if (mode === "sign-up") {
      await signUp.verifications.sendEmailCode();
      setStep("profile");
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }
          pushDecoratedUrl(router, decorateUrl, "/");
        },
      });
    }
  };
  const verifyCode = async () => {
    setStatusMessage(null);
    if (mode === "sign-in") {
      await signIn.mfa.verifyEmailCode({ code });
    } else {
      await signUp.verifications.verifyEmailCode({ code });
    }
  };
  const submitOnboarding = async () => {
    const secret = generateUserSecret();
    await storeSecret(secret);
    const securedData = await encryptData(
      {
        email: patientForm.email ?? "",
        phone: patientForm.phone ?? "",
        fullName: patientForm.fullName ?? "",
        address: patientForm.address ?? "",
      },
      secret
    );
    completeOnboarding.mutate({
      alias: patientForm.alias,
      _securedData: securedData,
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex flex-1 justify-center">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {currentFlow === "start" ? (
            <View className="flex-1 relative">
              <Image
                resizeMode="cover"
                className="absolute  right-0 bottom-0"
                source={require("@/assets/leaves01.png")}
                style={{  width:  480, height:820  }}
              />
              <View className="gap-8 px-8 flex-1 justify-center">
                <Image
                  resizeMode="contain"
                  source={require("@/assets/images/icon-stripped.png")}
                  style={{ height: 220, width: 120 }}
                />
                <View className="gap-6 pb-12">
                  <Text className="font-serif text-display text-foreground">
                    Suwa
                  </Text>
                  <View>
                    <Text className="font-sans text-foreground text-sub-display leading-tight">
                      Your health.
                    </Text>
                    <Text className="font-sans text-foreground text-sub-display leading-tight">
                      Your privacy.
                    </Text>
                    <Text className="font-sans font-semibold text-accent text-sub-display leading-tight">
                      Always.
                    </Text>
                    <View className="h-1 w-12 bg-accent" />
                  </View>
                </View>
                <Button
                  icon={<ArrowRight color="white" />}
                  justify="between"
                  size="lg"
                  onPress={() => setStep("auth")}
                >
                  Begin your journey
                </Button>
              </View>
            </View>
          ) : currentFlow === "auth" ? (
            <View className="gap-8 px-8">
              <View className="gap-6">
                <Text className="font-serif text-display text-foreground">
                  {mode === "sign-in" ? "Sign in" : "Sign up"}
                </Text>
                <View className="h-1 w-12 bg-accent" />
              </View>
              <View className="gap-4">
                <ToggleGroup
                  items={[
                    { label: "Sign in", value: "sign-in" },
                    { label: "Sign up", value: "sign-up" },
                  ]}
                  onValueChange={(val) => {
                    setMode(val as AuthMode);
                    setStatusMessage(null);
                  }}
                  value={mode}
                />

                <Input
                  autoCapitalize="none"
                  autoComplete="email"
                  error={
                    mode === "sign-in"
                      ? signInErrors.fields.identifier?.message
                      : signUpErrors.fields.emailAddress?.message
                  }
                  keyboardType="email-address"
                  label="Email address"
                  onChangeText={setEmailAddress}
                  placeholder="you@example.com"
                  value={emailAddress}
                />
                <Input
                  error={
                    mode === "sign-in"
                      ? signInErrors.fields.password?.message
                      : signUpErrors.fields.password?.message
                  }
                  label="Password"
                  onChangeText={setPassword}
                  placeholder="Your password"
                  secureTextEntry
                  value={password}
                />
                {statusMessage ? (
                  <Text className="font-sans text-destructive text-sm">
                    {statusMessage}
                  </Text>
                ) : null}
                {needsCode ? (
                  <Input
                    autoComplete="one-time-code"
                    error={
                      mode === "sign-in"
                        ? signInErrors.fields.code?.message
                        : signUpErrors.fields.code?.message
                    }
                    keyboardType="numeric"
                    label="Verification code"
                    onChangeText={setCode}
                    placeholder="000000"
                    value={code}
                  />
                ) : null}
                {needsCode ? (
                  <ActionButton
                    disabled={
                      (mode === "sign-in" ? signInStatus : signUpStatus) ===
                      "fetching"
                    }
                    onPress={verifyCode}
                  >
                    Verify
                  </ActionButton>
                ) : (
                  <ActionButton
                    disabled={
                      (mode === "sign-in" ? signInStatus : signUpStatus) ===
                      "fetching"
                    }
                    onPress={submitAuth}
                  >
                    {mode === "sign-in" ? "Sign in" : "Sign up"}
                  </ActionButton>
                )}
              </View>
              <View className="gap-4">
                <View className="h-px bg-border" />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <OAuthButton label="Google" strategy="oauth_google" />
                  </View>
                  <View className="flex-1">
                    <OAuthButton label="Facebook" strategy="oauth_facebook" />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="gap-8 px-8">
              <View className="gap-6">
                <Text className="font-serif text-display text-foreground leading-none">
                  Finish setup
                </Text>
                <View className="h-1 w-12 bg-accent" />
              </View>
              <View className="gap-4">
                <Input
                  label="Alias"
                  onChangeText={(alias: string) =>
                    setPatientForm((value) => ({ ...value, alias }))
                  }
                  placeholder="Choose an alias"
                  value={patientForm.alias}
                />
                <Input
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={(email: string) =>
                    setPatientForm((value) => ({ ...value, email }))
                  }
                  placeholder="you@example.com"
                  value={patientForm.email ?? ""}
                />
                <Input
                  keyboardType="phone-pad"
                  label="Phone"
                  onChangeText={(phone: string) =>
                    setPatientForm((value) => ({ ...value, phone }))
                  }
                  placeholder="+1 (555) 000-0000"
                  value={patientForm.phone ?? ""}
                />
                <Input
                  label="Full name"
                  onChangeText={(fullName: string) =>
                    setPatientForm((value) => ({ ...value, fullName }))
                  }
                  placeholder="Your full name"
                  value={patientForm.fullName ?? ""}
                />
                <Input
                  label="Address"
                  onChangeText={(address: string) =>
                    setPatientForm((value) => ({ ...value, address }))
                  }
                  placeholder="Your address"
                  value={patientForm.address ?? ""}
                />
                <ActionButton
                  disabled={completeOnboarding.isPending || !patientForm.alias}
                  onPress={submitOnboarding}
                >
                  {completeOnboarding.isPending
                    ? "Setting up..."
                    : "Complete setup"}
                </ActionButton>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
