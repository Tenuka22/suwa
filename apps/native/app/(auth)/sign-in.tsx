'use client';

import { useAuth, useSignIn } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { OAuthButtons } from "@/components/OAuthButtons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { pushDecoratedUrl } from "@/utils/auth";
import { useThemeColor } from "@/utils/theme";

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const { mutedForeground } = useThemeColor();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  const emailCodeFactor = signIn.supportedSecondFactors.find(
    (factor) => factor.strategy === "email_code"
  );
  const requiresEmailCode =
    signIn.status === "needs_client_trust" ||
    (signIn.status === "needs_second_factor" && !!emailCodeFactor);

  const handleSubmit = async () => {
    setStatusMessage(null);

    const { error } = await signIn.password({
      emailAddress,
      password,
    });

    if (error) {
      setStatusMessage(
        error.longMessage ?? "Unable to sign in. Please try again."
      );
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
    } else if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
        setStatusMessage(
          `We sent a verification code to ${emailCodeFactor.safeIdentifier}.`
        );
      } else {
        setStatusMessage(
          "A second factor is required, but this screen only supports email codes right now."
        );
      }
    } else {
      setStatusMessage("Sign-in could not be completed. Please try again.");
    }
  };

  const handleVerify = async () => {
    setStatusMessage(null);

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          pushDecoratedUrl(router, decorateUrl, "/");
        },
      });
    } else {
      setStatusMessage("That code did not complete sign-in. Please try again.");
    }
  };

  return (
    <Screen contentClassName="flex-1 justify-center px-page py-page">
      <View>
        {requiresEmailCode ? (
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
              onPress={() => signIn.mfa.sendEmailCode()}
              variant="secondary"
            >
              I need a new code
            </Button>
          </Card>
        ) : (
          <Card>
            <Text className="font-medium font-sans text-4xl text-foreground">
              Sign in
            </Text>
            {statusMessage ? (
              <Text className="font-normal font-sans text-muted-foreground text-sm">
                {statusMessage}
              </Text>
            ) : null}

            <Input
              autoCapitalize="none"
              autoComplete="email"
              error={errors.fields.identifier?.message}
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
              Sign in
            </Button>

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
          </Card>
        )}
      </View>
    </Screen>
  );
}
