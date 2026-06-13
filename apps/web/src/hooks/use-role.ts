import { useUser } from "@clerk/tanstack-react-start";

import { getMetadataRole } from "@/utils/clerk-auth";

export type Role = "user" | "doctor" | "admin" | "pending-doctor" | "tenant-admin";

export function useRole(): Role | null {
  const { user } = useUser();
  const role = getMetadataRole(user?.publicMetadata);
  return (role as Role) ?? null;
}
