import { redirect } from "@tanstack/react-router";
import { createAuthClient } from "better-auth/react";
import { adminClient, multiSessionClient } from "better-auth/client/plugins";

import { env } from "@suwa/env/web";
import { client } from "@/utils/orpc";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [adminClient(), multiSessionClient()],
});

export interface UserAccount {
  email?: string;
  id: string;
  image_url?: string;
  name?: string;
  phone?: string;
  role: string;
}

export async function requireAuth(allowedRoles: string[]) {
  const session = await getServerSession();
  if (!session) {
    throw redirect({ to: "/sign-in" });
  }
  if (session.role === "user") {
    throw redirect({ to: "/onboarding" });
  }
  if (!allowedRoles.includes(session.role)) {
    throw redirect({ to: "/" });
  }
  return session;
}

export async function getServerSession(): Promise<UserAccount | null> {
  try {
    return await client.getSession();
  } catch {
    return null;
  }
}

export async function setOnboardingRole(role: "tenant-admin" | "pending-doctor") {
  await client.setOnboardingRole({ role });
}
