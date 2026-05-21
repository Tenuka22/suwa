import { createIsomorphicFn } from "@tanstack/react-start";

type ClerkTokenGetter = () => Promise<string | null>;

let clerkTokenGetter: ClerkTokenGetter | null = null;

export function setClerkAuthTokenGetter(getToken: ClerkTokenGetter | null) {
  clerkTokenGetter = getToken;
}

export const getClerkAuthToken = createIsomorphicFn()
  .server(async () => {
    const { auth } = await import("@clerk/tanstack-react-start/server");
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
