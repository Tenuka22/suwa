import { ORPCError } from "@orpc/server";
import type { DoctorProfile } from "@zen-doc/db";
import {
  doctorProfiles,
  parseJsonApproachSteps,
  parseJsonStringArray,
  tenantAdmins,
} from "@zen-doc/db";
import { and, eq } from "drizzle-orm";

import type { Context } from "./context";

interface AuthContext {
  auth: Context["auth"];
}

interface DbOnly {
  db: Context["db"];
}

interface WithAuth extends AuthContext {
  auth: NonNullable<AuthContext["auth"]>;
  userId: string;
}

export function requireAuth(context: AuthContext): WithAuth {
  if (!context.auth?.userId) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return { ...context, auth: context.auth, userId: context.auth.userId };
}

export function requireAdmin(context: AuthContext): WithAuth {
  const auth = requireAuth(context);
  if (auth.auth.sessionClaims?.metadata?.role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }
  return auth;
}

export async function requireDoctorOrAdmin(
  context: AuthContext & DbOnly
): Promise<WithAuth> {
  const auth = requireAuth(context);

  const role = auth.auth.sessionClaims?.metadata?.role;
  if (role === "admin") {
    return auth;
  }

  const [profile] = await context.db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, auth.userId))
    .limit(1);

  if (!profile?.permanent) {
    throw new ORPCError("FORBIDDEN", {
      message: "Doctor or admin access required",
    });
  }

  return auth;
}

export async function requireDoctor(
  context: AuthContext & DbOnly
): Promise<WithAuth> {
  const auth = requireAuth(context);

  const [profile] = await context.db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, auth.userId))
    .limit(1);

  if (!profile?.permanent) {
    throw new ORPCError("FORBIDDEN", {
      message: "Doctor access required",
    });
  }

  return auth;
}

export function resolveDoctorId(
  context: AuthContext,
  inputDoctorId?: string
): string {
  const role = context.auth?.sessionClaims?.metadata?.role;
  if (role === "admin" && inputDoctorId) {
    return inputDoctorId;
  }
  const auth = requireAuth(context);
  return auth.userId;
}

export async function getDoctorProfile(
  db: DbOnly["db"],
  userId: string
): Promise<DoctorProfile | null> {
  const [profile] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export function mapDoctorProfile(profile: typeof doctorProfiles.$inferSelect) {
  return {
    ...profile,
    specialties: parseJsonStringArray(profile.specialties),
    languages: parseJsonStringArray(profile.languages),
    consultationModes: parseJsonStringArray(profile.consultationModes),
    focusAreas: parseJsonStringArray(profile.focusAreas),
    approachSteps: parseJsonApproachSteps(profile.approachSteps),
  };
}

export async function getDoctorWithClerkInfo(
  _db: DbOnly["db"],
  clerk: Context["clerk"],
  profile: DoctorProfile
) {
  try {
    const clerkUser = await clerk.users.getUser(profile.userId);
    const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
    let name = clerkUser.fullName ?? null;
    if (!name && nameParts.length > 0) {
      name = nameParts.join(" ");
    }
    if (!name) {
      name =
        clerkUser.username ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        clerkUser.phoneNumbers[0]?.phoneNumber ??
        "Doctor";
    }
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const phone = clerkUser.phoneNumbers[0]?.phoneNumber ?? null;

    return {
      userId: profile.userId,
      name,
      email,
      phone,
      imageUrl: clerkUser.imageUrl ?? null,
      bio: profile.bio,
      licenseNumber: profile.licenseNumber,
      permanent: profile.permanent,
      role: profile.permanent ? "doctor" : "pending-doctor",
    };
  } catch {
    return {
      userId: profile.userId,
      name: "Doctor",
      email: null,
      phone: null,
      imageUrl: null,
      bio: profile.bio,
      licenseNumber: profile.licenseNumber,
      permanent: profile.permanent,
      role: profile.permanent ? "doctor" : "pending-doctor",
    };
  }
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  items: T[];
  page: number;
  prevPage: number | null;
  nextPage: number | null;
  firstItem: T | null;
  lastItem: T | null;
} {
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);
  return {
    items: pagedItems,
    page,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: start + pageSize < items.length ? page + 1 : null,
    firstItem: pagedItems[0] ?? null,
    lastItem: pagedItems.at(-1) ?? null,
  };
}

export async function requireTenantAdmin(
  context: AuthContext & DbOnly,
  tenantId: string
): Promise<WithAuth> {
  const auth = requireAuth(context);

  // Platform admins can manage any tenant
  if (auth.auth.sessionClaims?.metadata?.role === "admin") {
    return auth;
  }

  const [adminRecord] = await context.db
    .select()
    .from(tenantAdmins)
    .where(
      and(
        eq(tenantAdmins.tenantId, tenantId),
        eq(tenantAdmins.userId, auth.userId)
      )
    )
    .limit(1);

  if (!adminRecord) {
    throw new ORPCError("FORBIDDEN", {
      message: "Tenant admin access required",
    });
  }

  return auth;
}

export async function requireTenantAdminOrDoctor(
  context: AuthContext & DbOnly,
  tenantId: string
): Promise<WithAuth> {
  const auth = requireAuth(context);

  // Platform admins can access any tenant
  if (auth.auth.sessionClaims?.metadata?.role === "admin") {
    return auth;
  }

  // Check if tenant admin
  const [adminRecord] = await context.db
    .select()
    .from(tenantAdmins)
    .where(
      and(
        eq(tenantAdmins.tenantId, tenantId),
        eq(tenantAdmins.userId, auth.userId)
      )
    )
    .limit(1);

  if (adminRecord) {
    return auth;
  }

  // Check if affiliated doctor
  const { doctorHospitalAffiliations } = await import("@zen-doc/db");
  const [affiliation] = await context.db
    .select()
    .from(doctorHospitalAffiliations)
    .where(
      and(
        eq(doctorHospitalAffiliations.tenantId, tenantId),
        eq(doctorHospitalAffiliations.doctorId, auth.userId)
      )
    )
    .limit(1);

  if (affiliation) {
    return auth;
  }

  throw new ORPCError("FORBIDDEN", {
    message: "Tenant admin or affiliated doctor access required",
  });
}
