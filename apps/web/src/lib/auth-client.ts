import { env } from "@suwa/env/web";
import { polarClient } from "@polar-sh/better-auth/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [polarClient()],
});
