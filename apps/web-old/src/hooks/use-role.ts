import { authClient } from "@/utils/auth";

export type Role =
  | "user"
  | "doctor"
  | "admin"
  | "pending-doctor"
  | "tenant-admin";

export function useRole(): Role | null {
  const { data: session } = authClient.useSession();
  const role = (session?.user as any)?.role;
  return (role as Role) ?? null;
}
