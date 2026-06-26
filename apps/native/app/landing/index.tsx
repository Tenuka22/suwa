"use client";

import { useAuth, useOAuth, useSignIn, useSignUp } from "@clerk/expo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createURL } from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "@/components/design/ui/button";
import { Input } from "@/components/design/ui/input";
import { Reveal } from "@/components/design/ui/reveal";
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

type AuthMode = "sign-in" | "sign-up";
type PatientForm = z.infer<typeof patientSchema>;
type ProviderStrategy = "oauth_google" | "oauth_facebook";
type Step = "start" | "auth" | "profile";
type TransitionDirection = "back" | "forward";

interface AuthStepProps {
  busy: boolean;
  code: string;
  codeError?: string;
  emailAddress: string;
  emailError?: string;
  mode: AuthMode;
  needsCode: boolean;
  onBack: () => void;
  onCodeChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onModeChange: (value: AuthMode) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onVerify: () => void;
  password: string;
  passwordError?: string;
  statusMessage: string | null;
}

function BrandBackdrop() {
  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <View className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent-subtle" />
      <View className="absolute top-20 -right-3 h-40 w-40 rounded-full border border-accent/30" />
      <View className="absolute bottom-16 -left-28 h-72 w-72 rounded-full bg-primary-subtle/80" />
      <Image
        className="absolute right-0 bottom-0 opacity-30"
        resizeMode="contain"
        source={require("@/assets/leaves01.png")}
        style={{ height: "80%", width: 400 }}
      />
    </View>
  );
}

function FlowHeader({
  eyebrow,
  title,
  onBack,
}: {
  eyebrow: string;
  onBack: () => void;
  title: string;
}) {
  return (
    <Reveal className="gap-xl" delay={80}>
      <Pressable
        accessibilityLabel="Go back"
        className="h-11 w-11 items-center justify-center rounded-full border border-border bg-background-elevated shadow-sm"
        onPress={onBack}
      >
        <ArrowLeft color="#315b4d" size={20} />
      </Pressable>
      <View className="gap-sm">
        <Text className="font-poppins-medium text-accent text-micro uppercase tracking-widest">
          {eyebrow}
        </Text>
        <Text className="font-serif text-[44px] text-foreground leading-tight">
          {title}
        </Text>
        <View className="h-1 w-10 rounded-full bg-accent" />
      </View>
    </Reveal>
  );
}

function ActionButton({
  children,
  onPress,
  disabled,
}: {
  children: string;
  disabled?: boolean;
  onPress: () => void;
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

  const handlePress = async () => {
    const { createdSessionId, setActive } = await startOAuthFlow({
      redirectUrl: createURL("/", { scheme: "suwa" }),
    });
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
    }
  };

  return (
    <Button
      icon={
        <FontAwesome6
          color={strategy === "oauth_google" ? "#4285F4" : "#1877F2"}
          name={strategy === "oauth_google" ? "google" : "facebook-f"}
          size={17}
        />
      }
      iconPlacement="left"
      onPress={handlePress}
      variant="outline"
    >
      {label}
    </Button>
  );
}

function StartStep({ onStart }: { onStart: () => void }) {
  return (
    <View className="min-h-full flex-1 justify-between px-7 pt-8 pb-6">
      <Reveal delay={60}>
        <View className="flex-row items-center justify-between">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-background-elevated/80 shadow-sm">
            <Image
              resizeMode="contain"
              source={require("@/assets/images/icon-stripped.png")}
              style={{ height: 48, width: 30 }}
            />
          </View>
          <View className="flex-row items-center gap-xs rounded-full border border-border bg-background-elevated/80 px-md py-sm">
            <ShieldCheck color="#315b4d" size={15} />
            <Text className="font-poppins-medium text-micro text-primary">
              Privacy saved by design
            </Text>
          </View>
        </View>
      </Reveal>

      <View className="gap-xl py-12">
        <Reveal delay={160}>
          <Text className="font-serif text-[76px] text-primary leading-[0.95]">
            Suwa
          </Text>
        </Reveal>
        <Reveal className="gap-xl" delay={260}>
          <View>
            <Text className="font-poppins-light text-[30px] text-foreground leading-tight">
              Your health.
            </Text>
            <Text className="font-poppins-light text-[30px] text-foreground leading-tight">
              Your privacy.
            </Text>
          </View>
          <Text className="max-w-64 font-sans text-sm text-foreground-secondary leading-relaxed">
            Thoughtful care that understands you, without asking you to give up
            who you are.
          </Text>
        </Reveal>
      </View>

      <Reveal className="gap-md" delay={380}>
        <Button
          icon={
            <View className="h-9 w-9 items-center justify-center rounded-full bg-background-elevated/15">
              <ArrowRight color="white" size={18} />
            </View>
          }
          justify="between"
          onPress={onStart}
          size="default"
        >
          Begin your journey
        </Button>
        <Text className="text-center font-sans text-foreground-muted text-micro">
          Anonymous by default. You stay in control.
        </Text>
      </Reveal>
    </View>
  );
}

function AuthStep({
  busy,
  code,
  codeError,
  emailAddress,
  emailError,
  mode,
  needsCode,
  onBack,
  onCodeChange,
  onEmailChange,
  onModeChange,
  onPasswordChange,
  onSubmit,
  onVerify,
  password,
  passwordError,
  statusMessage,
}: AuthStepProps) {
  const title = mode === "sign-in" ? "Welcome back" : "Create account";
  const actionLabel = mode === "sign-in" ? "Sign in" : "Sign up";

  return (
    <View className="min-h-full flex-1 gap-huge px-7 pt-5 pb-10">
      <FlowHeader eyebrow="Welcome to Suwa" onBack={onBack} title={title} />
      <Reveal className="gap-lg" delay={180}>
        <View className="gap-sm">
          <ToggleGroup
            className="w-full"
            items={[
              { label: "Sign in", value: "sign-in" },
              { label: "Sign up", value: "sign-up" },
            ]}
            onValueChange={(value) => onModeChange(value as AuthMode)}
            value={mode}
          />
          <Animated.Text
            className="px-1 font-sans text-foreground-muted text-micro"
            entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
            key={mode}
          >
            {mode === "sign-in"
              ? "Continue securely to your private health space."
              : "Create a private account in less than a minute."}
          </Animated.Text>
        </View>
        <Input
          autoCapitalize="none"
          autoComplete="email"
          error={emailError}
          keyboardType="email-address"
          label="Email address"
          onChangeText={onEmailChange}
          placeholder="you@example.com"
          value={emailAddress}
        />
        <Input
          error={passwordError}
          label="Password"
          onChangeText={onPasswordChange}
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
            error={codeError}
            keyboardType="numeric"
            label="Verification code"
            onChangeText={onCodeChange}
            placeholder="000000"
            value={code}
          />
        ) : null}
        <ActionButton disabled={busy} onPress={needsCode ? onVerify : onSubmit}>
          {needsCode ? "Verify" : actionLabel}
        </ActionButton>
      </Reveal>
      <Reveal className="gap-lg" delay={260}>
        <View className="flex-row items-center gap-md">
          <View className="h-px flex-1 bg-border" />
          <Text className="font-sans text-foreground-muted text-micro uppercase tracking-widest">
            Or continue with
          </Text>
          <View className="h-px flex-1 bg-border" />
        </View>
        <View className="gap-md">
          <OAuthButton label="Continue with Google" strategy="oauth_google" />
          <OAuthButton
            label="Continue with Facebook"
            strategy="oauth_facebook"
          />
        </View>
      </Reveal>
    </View>
  );
}

function ProfileStep({
  form,
  isPending,
  onBack,
  onChange,
  onSubmit,
}: {
  form: PatientForm;
  isPending: boolean;
  onBack: () => void;
  onChange: (field: keyof PatientForm, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View className="min-h-full flex-1 gap-huge px-7 pt-5 pb-10">
      <FlowHeader
        eyebrow="One last step"
        onBack={onBack}
        title="Make it yours"
      />
      <Reveal className="gap-lg" delay={180}>
        <View className="flex-row items-center gap-md rounded-2xl bg-primary-subtle px-lg py-md">
          <ShieldCheck color="#315b4d" size={20} />
          <Text className="flex-1 font-sans text-caption text-primary leading-relaxed">
            Your alias is public. Personal details stay encrypted and private.
          </Text>
        </View>
        <Input
          label="Alias"
          onChangeText={(value) => onChange("alias", value)}
          placeholder="Choose an alias"
          value={form.alias}
        />
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => onChange("email", value)}
          optional
          placeholder="you@example.com"
          value={form.email ?? ""}
        />
        <Input
          keyboardType="phone-pad"
          label="Phone"
          onChangeText={(value) => onChange("phone", value)}
          optional
          placeholder="+1 (555) 000-0000"
          value={form.phone ?? ""}
        />
        <Input
          label="Full name"
          onChangeText={(value) => onChange("fullName", value)}
          optional
          placeholder="Your full name"
          value={form.fullName ?? ""}
        />
        <Input
          label="Address"
          onChangeText={(value) => onChange("address", value)}
          optional
          placeholder="Your address"
          value={form.address ?? ""}
        />
        <ActionButton disabled={isPending || !form.alias} onPress={onSubmit}>
          {isPending ? "Setting up..." : "Complete setup"}
        </ActionButton>
      </Reveal>
    </View>
  );
}

function LandingFrame({
  children,
  direction,
  transitionKey,
}: {
  children: ReactNode;
  direction: TransitionDirection;
  transitionKey: Step;
}) {
  const enteringAnimation =
    direction === "forward"
      ? SlideInRight.duration(420)
          .easing(Easing.bezier(0.22, 1, 0.36, 1))
          .reduceMotion(ReduceMotion.System)
      : SlideInLeft.duration(420)
          .easing(Easing.bezier(0.22, 1, 0.36, 1))
          .reduceMotion(ReduceMotion.System);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <BrandBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            className="flex-1"
            entering={enteringAnimation}
            key={transitionKey}
          >
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  const [transitionDirection, setTransitionDirection] =
    useState<TransitionDirection>("forward");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState<PatientForm>({
    address: "",
    alias: "",
    email: "",
    fullName: "",
    phone: "",
  });

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setTransitionDirection("forward");
      setStep("profile");
    }
  }, [isLoaded, isSignedIn]);

  useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      meta: { ignoreError: true },
      retry: false,
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

  const navigateStep = (nextStep: Step, direction: TransitionDirection) => {
    setTransitionDirection(direction);
    setStep(nextStep);
  };

  const needsCode =
    mode === "sign-up"
      ? signUp.status === "missing_requirements" &&
        signUp.unverifiedFields.includes("email_address") &&
        signUp.missingFields.length === 0
      : signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust";
  const busy =
    (mode === "sign-in" ? signInStatus : signUpStatus) === "fetching";
  const emailError =
    mode === "sign-in"
      ? signInErrors.fields.identifier?.message
      : signUpErrors.fields.emailAddress?.message;
  const passwordError =
    mode === "sign-in"
      ? signInErrors.fields.password?.message
      : signUpErrors.fields.password?.message;
  const codeError =
    mode === "sign-in"
      ? signInErrors.fields.code?.message
      : signUpErrors.fields.code?.message;

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
      setStatusMessage("We sent a verification code to your email.");
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (!session?.currentTask) {
            pushDecoratedUrl(router, decorateUrl, "/");
          }
        },
      });
    }
  };

  const verifyCode = async () => {
    setStatusMessage(null);
    if (mode === "sign-in") {
      const result = await signIn.mfa.verifyEmailCode({ code });
      if (result.error) {
        setStatusMessage(result.error.longMessage ?? "That code did not work.");
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (!session?.currentTask) {
              pushDecoratedUrl(router, decorateUrl, "/");
            }
          },
        });
      }
      return;
    }
    const result = await signUp.verifications.verifyEmailCode({ code });
    if (result.error) {
      setStatusMessage(result.error.longMessage ?? "That code did not work.");
      return;
    }
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session }) => {
          if (!session?.currentTask) {
            navigateStep("profile", "forward");
          }
        },
      });
      return;
    }
    navigateStep("profile", "forward");
  };

  const submitOnboarding = async () => {
    const secret = generateUserSecret();
    await storeSecret(secret);
    const securedData = await encryptData(
      {
        address: patientForm.address ?? "",
        email: patientForm.email ?? "",
        fullName: patientForm.fullName ?? "",
        phone: patientForm.phone ?? "",
      },
      secret
    );
    completeOnboarding.mutate({
      _securedData: securedData,
      alias: patientForm.alias,
    });
  };

  const changePatientForm = (field: keyof PatientForm, value: string) => {
    setPatientForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  let stepContent: ReactNode;
  if (step === "start") {
    stepContent = <StartStep onStart={() => navigateStep("auth", "forward")} />;
  } else if (step === "auth") {
    stepContent = (
      <AuthStep
        busy={busy}
        code={code}
        codeError={codeError}
        emailAddress={emailAddress}
        emailError={emailError}
        mode={mode}
        needsCode={needsCode}
        onBack={() => navigateStep("start", "back")}
        onCodeChange={setCode}
        onEmailChange={setEmailAddress}
        onModeChange={(value) => {
          setMode(value);
          setStatusMessage(null);
        }}
        onPasswordChange={setPassword}
        onSubmit={submitAuth}
        onVerify={verifyCode}
        password={password}
        passwordError={passwordError}
        statusMessage={statusMessage}
      />
    );
  } else {
    stepContent = (
      <ProfileStep
        form={patientForm}
        isPending={completeOnboarding.isPending}
        onBack={() => navigateStep("auth", "back")}
        onChange={changePatientForm}
        onSubmit={submitOnboarding}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LandingFrame direction={transitionDirection} transitionKey={step}>
        {stepContent}
      </LandingFrame>
    </>
  );
}
