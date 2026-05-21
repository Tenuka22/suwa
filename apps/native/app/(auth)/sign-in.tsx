import { useSignIn } from "@clerk/expo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, useColorScheme, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { TextLink } from "@/components/ui/text-link";
import { OAUTH_STRATEGIES, pushDecoratedUrl } from "@/utils/auth";

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const placeholderTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";

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
      console.error(JSON.stringify(error, null, 2));
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
        console.error(
          "Second factor is required, but email_code is not available:",
          signIn
        );
        setStatusMessage(
          "A second factor is required, but this screen only supports email codes right now."
        );
      }
    } else {
      console.error("Sign-in attempt not complete:", signIn);
      setStatusMessage(
        "Sign-in could not be completed. Check the logs for more details."
      );
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
      console.error("Sign-in attempt not complete:", signIn);
      setStatusMessage("That code did not complete sign-in. Please try again.");
    }
  };

  const handleOAuth = async (
    strategy: (typeof OAUTH_STRATEGIES)[number]["strategy"]
  ) => {
    setStatusMessage(null);

    const { error } = await signIn.sso({
      strategy,
      redirectUrl: "/",
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      setStatusMessage(
        error.longMessage ?? "Unable to sign in with SSO. Please try again."
      );
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

            <Field
              error={errors.fields.identifier?.message}
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
              Sign in
            </Button>

            <View className="flex-row items-center gap-chip">
              <Text className="font-normal font-sans text-foreground">
                Don&apos;t have an account?
              </Text>
              <TextLink href="/sign-up">Sign up</TextLink>
            </View>

            <View className="mt-6">
              <View className="flex-row items-center">
                <View className="h-px flex-1 bg-border" />
                <Text className="px-3 text-muted-foreground text-sm">or</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <View className="mt-4 gap-3">
                {OAUTH_STRATEGIES.map((provider) => {
                  const textColor = placeholderTextColor;

                  return (
                    <Button
                      disabled={fetchStatus === "fetching"}
                      key={provider.strategy}
                      onPress={() => handleOAuth(provider.strategy)}
                      variant="secondary"
                    >
                      <FontAwesome
                        color={textColor}
                        name={provider.icon}
                        size={18}
                        style={{ marginRight: 12 }}
                      />
                      <Text>Sign in with {provider.label}</Text>
                    </Button>
                  );
                })}
              </View>
            </View>
          </Card>
        )}
      </View>
    </Screen>
  );
}
