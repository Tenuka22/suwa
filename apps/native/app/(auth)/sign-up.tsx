'use client';

import { useAuth, useSignUp } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { OAuthButtons } from "@/components/OAuthButtons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { TextLink } from "@/components/ui/text-link";
import { pushDecoratedUrl } from "@/utils/auth";
import { useThemeColor } from "@/utils/theme";

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { mutedForeground } = useThemeColor();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatusMessage(null);

    const { error } = await signUp.password({
      emailAddress,
      password,
    });

    if (error) {
      setStatusMessage(
        error.longMessage ?? "Unable to sign up. Please try again."
      );
      return;
    }

    await signUp.verifications.sendEmailCode();
    setStatusMessage(`We sent a verification code to ${emailAddress}.`);
  };

  const handleVerify = async () => {
    setStatusMessage(null);

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          pushDecoratedUrl(router, decorateUrl, "/");
        },
      });
    } else {
      setStatusMessage("That code did not complete sign-up. Please try again.");
    }
  };

  if (isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  if (signUp.status === "complete") {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen contentClassName="flex-1 justify-center px-page py-page">
      <View>
        {signUp.status === "missing_requirements" &&
        signUp.unverifiedFields.includes("email_address") &&
        signUp.missingFields.length === 0 ? (
          <Card>
            <Text className="font-medium font-sans text-4xl text-foreground">
              Verify your account
            </Text>
            {statusMessage ? (
              <Text className="font-normal font-sans text-muted-foreground text-sm">
                {statusMessage}
              </Text>
            ) : null}

            <Input
              autoComplete="one-time-code"
              error={errors.fields.code?.message}
              keyboardType="numeric"
              label="Verification code"
              onChangeText={setCode}
              placeholder="Enter your verification code"
              placeholderTextColor={mutedForeground}
              value={code}
            />

            <Button
              disabled={fetchStatus === "fetching"}
              onPress={handleVerify}
            >
              Verify
            </Button>

            <Button
              onPress={() => signUp.verifications.sendEmailCode()}
              variant="secondary"
            >
              I need a new code
            </Button>
          </Card>
        ) : (
          <Card>
            <Text className="font-medium font-sans text-4xl text-foreground">
              Sign up
            </Text>
            {statusMessage ? (
              <Text className="font-normal font-sans text-muted-foreground text-sm">
                {statusMessage}
              </Text>
            ) : null}

            <Input
              autoCapitalize="none"
              autoComplete="email"
              error={errors.fields.emailAddress?.message}
              keyboardType="email-address"
              label="Email address"
              onChangeText={setEmailAddress}
              placeholder="Enter email"
              placeholderTextColor={mutedForeground}
              value={emailAddress}
            />

            <Input
              error={errors.fields.password?.message}
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={mutedForeground}
              secureTextEntry
              value={password}
            />

            <Button
              disabled={
                !(emailAddress && password) || fetchStatus === "fetching"
              }
              onPress={handleSubmit}
            >
              Sign up
            </Button>

            <View className="flex-row items-center gap-chip">
              <Text className="font-normal font-sans text-foreground">
                Already have an account?
              </Text>
              <TextLink href="/sign-in">Sign in</TextLink>
            </View>

            <View className="mt-6">
              <View className="flex-row items-center">
                <View className="h-px flex-1 bg-border" />
                <Text className="px-3 text-muted-foreground text-sm">or</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <View className="mt-4 gap-3">
                <OAuthButtons disabled={fetchStatus === "fetching"} />
              </View>
            </View>

            <View nativeID="clerk-captcha" />
          </Card>
        )}
      </View>
    </Screen>
  );
}
