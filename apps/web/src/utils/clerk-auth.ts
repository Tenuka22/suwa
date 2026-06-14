import { auth } from "@clerk/tanstack-react-start/server";
import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";

type ClerkTokenGetter = () => Promise<string | null>;

let clerkTokenGetter: ClerkTokenGetter | null = null;

export function setClerkAuthTokenGetter(getToken: ClerkTokenGetter | null) {
  clerkTokenGetter = getToken;
}

export const getClerkAuthToken = createIsomorphicFn()
  .server(async () => {
    const sessionAuth = await auth();
    return (await sessionAuth.getToken?.()) ?? null;
  })
  .client(async () => (await clerkTokenGetter?.()) ?? null);

export function getMetadataRole(
  metadata: Record<string, unknown> | null | undefined
): string | undefined {
  const role = metadata?.role;
  return typeof role === "string" ? role : undefined;
}

export interface UserAccount {
  email?: string;
  id: string;
  image_url?: string;
  name?: string;
  phone?: string;
  role:
    | "admin"
    | "user"
    | "doctor"
    | "pending-doctor"
    | "guardian"
    | "tenant-admin";
}

export const getServerSession = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { userId, sessionClaims } = await auth();

      if (!userId) {
        return null;
      }

      const session = {
        id: userId,
        email: sessionClaims.email as string | undefined,
        name: sessionClaims.name as string | undefined,
        phone: sessionClaims.phone as string | undefined,
        image_url: sessionClaims.image_url as string | undefined,
        role:
          (sessionClaims?.metadata?.role as
            | "admin"
            | "user"
            | "doctor"
            | "pending-doctor"
            | "guardian"
            | "tenant-admin") || "user",
      } satisfies UserAccount;

      return session;
    } catch {
      return null;
    }
  }
);
