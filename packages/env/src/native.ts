import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function getRuntimeEnv() {
  return {
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_LIVEKIT_HOST: process.env.EXPO_PUBLIC_LIVEKIT_HOST,
  };
}

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    EXPO_PUBLIC_LIVEKIT_HOST: z.string().min(1),
  },
  runtimeEnv: getRuntimeEnv(),
  emptyStringAsUndefined: true,
});
