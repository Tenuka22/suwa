import { useOAuth } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Button } from "@/components/ui/button";
import { OAUTH_STRATEGIES } from "@/utils/auth";

WebBrowser.maybeCompleteAuthSession();

function OAuthButton({
  strategy,
  label,
  icon: Icon,
  disabled,
}: {
  strategy: (typeof OAUTH_STRATEGIES)[number]["strategy"];
  label: string;
  icon: any;
  disabled?: boolean;
}) {
  const { startOAuthFlow } = useOAuth({ strategy });

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/", { scheme: "zen-doc" }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error(`OAuth error with ${strategy}`, err);
    }
  }, [startOAuthFlow, strategy]);

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
          key={provider.strategy}
          strategy={provider.strategy}
          label={provider.label}
          icon={provider.icon}
          disabled={disabled}
        />
      ))}
    </>
  );
}
