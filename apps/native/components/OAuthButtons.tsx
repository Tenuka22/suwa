"use client";

import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Button } from "@/components/design/ui/button";
import { authClient, getOAuthCallbackURL } from "@/utils/better-auth";
import { OAUTH_STRATEGIES } from "@/utils/auth";

WebBrowser.maybeCompleteAuthSession();

function OAuthButton({
  provider,
  label,
  icon: Icon,
  disabled,
}: {
  provider: "google";
  label: string;
  icon: any;
  disabled?: boolean;
}) {
  const onPress = React.useCallback(async () => {
    try {
      const { data } = await authClient.signIn.social({
        provider,
        callbackURL: getOAuthCallbackURL(),
      });

      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, "suwa://callback");
      }
    } catch (err) {
      console.error(`OAuth error with ${provider}`, err);
    }
  }, [provider]);

  return (
    <Button
      disabled={disabled}
      icon={<Icon size={18} />}
      onPress={onPress}
      variant="secondary"
    >
      Sign in with {label}
    </Button>
  );
}

export function OAuthButtons({ disabled }: { disabled?: boolean }) {
  return (
    <>
      {OAUTH_STRATEGIES.map((provider) => (
        <OAuthButton
          disabled={disabled}
          icon={provider.icon}
          key={provider.strategy}
          label={provider.label}
          provider={provider.strategy as "google"}
        />
      ))}
    </>
  );
}
