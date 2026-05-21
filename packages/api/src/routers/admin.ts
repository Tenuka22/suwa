import type {
  DoctorEducationEntry,
  DoctorProfile,
  DoctorScheduleEntry,
} from "@zen-doc/db";
import {
  doctorEducationEntries,
  doctorProfiles,
  doctorScheduleEntries,
} from "@zen-doc/db";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const adminRouter = {
  pendingDoctors: protectedProcedure
    .input(
      z.object({
        page: z.coerce.number().int().positive().default(1),
        query: z.string().default(""),
      })
    )
    .handler(async ({ context, input }) => {
      if (context.auth?.sessionClaims?.metadata?.role !== "admin") {
        return {
          items: [],
          page: input.page,
          prevPage: null,
          nextPage: null,
          firstUserId: null,
          lastUserId: null,
        };
      }

      const rows = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.permanent, false));
      const q = input.query.toLowerCase();
      const items = await Promise.all(
        rows.map(async (profile: DoctorProfile) => {
          const clerkUser = await context.clerk.users.getUser(profile.userId);
          const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(
            Boolean
          );
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
            role:
              context.auth?.sessionClaims?.metadata?.role ?? "pending-doctor",
            matchesQuery:
              !q ||
              name.toLowerCase().includes(q) ||
              (email ?? "").toLowerCase().includes(q),
          };
        })
      );

      const pageSize = 10;
      const start = (input.page - 1) * pageSize;
      const filteredItems = items.filter((item) => item.matchesQuery);
      const pagedItems = filteredItems.slice(start, start + pageSize);
      return {
        items: pagedItems,
        page: input.page,
        prevPage: input.page > 1 ? input.page - 1 : null,
        nextPage:
          start + pageSize < filteredItems.length ? input.page + 1 : null,
        firstUserId: pagedItems[0]?.userId ?? null,
        lastUserId: pagedItems.at(-1)?.userId ?? null,
      };
    }),
  approveDoctor: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      if (context.auth?.sessionClaims?.metadata?.role !== "admin") {
        throw new Error("Forbidden");
      }

      const [profile] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, input.userId))
        .limit(1);
      if (!profile) {
        throw new Error("Profile not found");
      }

      await context.db
        .update(doctorProfiles)
        .set({
          permanent: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorProfiles.userId, input.userId));
      await context.clerk.users.updateUserMetadata(input.userId, {
        publicMetadata: { role: "doctor" },
      });
      return { ok: true };
    }),
  approvedDoctors: protectedProcedure
    .input(
      z.object({
        page: z.coerce.number().int().positive().default(1),
        query: z.string().default(""),
      })
    )
    .handler(async ({ context, input }) => {
      if (context.auth?.sessionClaims?.metadata?.role !== "admin") {
        return {
          items: [],
          page: input.page,
          prevPage: null,
          nextPage: null,
          firstUserId: null,
          lastUserId: null,
        };
      }

      const rows = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.permanent, true));
      const q = input.query.toLowerCase();
      const items = await Promise.all(
        rows.map(async (profile: DoctorProfile) => {
          const clerkUser = await context.clerk.users.getUser(profile.userId);
          const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(
            Boolean
          );
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
            role: "doctor",
            matchesQuery:
              !q ||
              name.toLowerCase().includes(q) ||
              (email ?? "").toLowerCase().includes(q),
          };
        })
      );

      const pageSize = 10;
      const start = (input.page - 1) * pageSize;
      const filteredItems = items.filter((item) => item.matchesQuery);
      const pagedItems = filteredItems.slice(start, start + pageSize);
      return {
        items: pagedItems,
        page: input.page,
        prevPage: input.page > 1 ? input.page - 1 : null,
        nextPage:
          start + pageSize < filteredItems.length ? input.page + 1 : null,
        firstUserId: pagedItems[0]?.userId ?? null,
        lastUserId: pagedItems.at(-1)?.userId ?? null,
      };
    }),
  doctorScheduleEntries: protectedProcedure
    .input(
      z.object({
        doctorId: z.string().min(1),
        from: z.iso.datetime(),
        to: z.iso.datetime(),
      })
    )
    .handler(async ({ context, input }) => {
      if (context.auth?.sessionClaims?.metadata?.role !== "admin") {
        return { items: [] };
      }

      const items = await context.db
        .select()
        .from(doctorScheduleEntries)
        .where(
          and(
            eq(doctorScheduleEntries.doctorId, input.doctorId),
            gte(doctorScheduleEntries.startAt, input.from),
            lte(doctorScheduleEntries.endAt, input.to)
          )
        );

      return { items: items as DoctorScheduleEntry[] };
    }),
  doctorEducationEntries: protectedProcedure
    .input(
      z.object({
        doctorId: z.string().min(1),
      })
    )
    .handler(async ({ context, input }) => {
      if (context.auth?.sessionClaims?.metadata?.role !== "admin") {
        return { items: [] };
      }

      const items = await context.db
        .select()
        .from(doctorEducationEntries)
        .where(eq(doctorEducationEntries.doctorId, input.doctorId));

      return { items: items as DoctorEducationEntry[] };
    }),
};
