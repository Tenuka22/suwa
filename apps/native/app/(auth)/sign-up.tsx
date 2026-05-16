import { useAuth, useSignUp } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Text, useColorScheme, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { TextLink } from "@/components/ui/text-link";

function pushDecoratedUrl(
  router: ReturnType<typeof useRouter>,
  decorateUrl: (url: string) => string,
  href: string
) {
  const url = decorateUrl(href);
  const nextHref = url.startsWith("http") ? new URL(url).pathname : url;
  router.push(nextHref as Href);
}

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const placeholderTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";

  const handleSubmit = async () => {
    setStatusMessage(null);

    const { error } = await signUp.password({
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
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
      console.error("Sign-up attempt not complete:", signUp);
      setStatusMessage("That code did not complete sign-up. Please try again.");
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
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

            <Field
              error={errors.fields.code?.message}
              inputProps={{
                autoComplete: "one-time-code",
                keyboardType: "numeric",
                onChangeText: setCode,
                placeholder: "Enter your verification code",
                placeholderTextColor,
                value: code,
              }}
              label="Verification code"
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

            <Field
              error={errors.fields.emailAddress?.message}
              inputProps={{
                autoCapitalize: "none",
                autoComplete: "email",
                keyboardType: "email-address",
                onChangeText: setEmailAddress,
                placeholder: "Enter email",
                placeholderTextColor,
                value: emailAddress,
              }}
              label="Email address"
            />

            <Field
              error={errors.fields.password?.message}
              inputProps={{
                onChangeText: setPassword,
                placeholder: "Enter password",
                placeholderTextColor,
                secureTextEntry: true,
                value: password,
              }}
              label="Password"
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

            <View nativeID="clerk-captcha" />
          </Card>
        )}
      </View>
    </Screen>
  );
}
