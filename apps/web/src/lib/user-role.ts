export const userRoles = [
  "admin",
  "doctor",
  "pending-doctor",
  "tenant-admin",
  "user",
] as const;

export type UserRole = (typeof userRoles)[number];

export function getUserRole(user: unknown): UserRole | undefined {
  if (typeof user !== "object" || user === null || !("role" in user)) {
    return undefined;
  }

  const role = (user as { role: unknown }).role;
  return typeof role === "string" && userRoles.includes(role as UserRole)
    ? (role as UserRole)
    : undefined;
}
