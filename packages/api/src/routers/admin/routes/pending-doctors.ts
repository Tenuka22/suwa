import { doctorProfiles } from "@suwa/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import {
  getDoctorInfo,
  paginateItems,
  requireAdmin,
} from "../../../hooks";
import { protectedProcedure } from "../../../index";

const OPTIONAL_FIELDS = [
  "displayName",
  "headline",
  "bio",
  "licenseNumber",
  "location",
  "placeName",
  "education",
  "specialties",
  "languages",
  "consultationModes",
  "focusAreas",
  "approach",
  "experienceStartYear",
] as const;

function computeCompleteness(profile: Record<string, unknown>): number {
  let filled = 0;
  for (const field of OPTIONAL_FIELDS) {
    const value = profile[field];
    if (value !== null && value !== undefined && value !== "") {
      const strVal = String(value);
      if (strVal !== "[]" && strVal !== "null" && strVal.length > 0) {
        filled++;
      }
    }
  }
  return Math.round((filled / OPTIONAL_FIELDS.length) * 100);
}

export const adminPendingDoctorsRoute = protectedProcedure
  .input(
    z.object({
      page: z.coerce.number().int().positive().default(1),
      perPage: z.coerce.number().int().positive().max(100).default(10),
      query: z.string().default(""),
      sortBy: z.enum(["name", "email", "completeness"]).default("name"),
      sortDirection: z.enum(["asc", "desc"]).default("asc"),
    })
  )
  .handler(async ({ context, input }) => {
    try {
      requireAdmin(context);
    } catch {
      return {
          items: [],
          page: input.page,
          pageSize: input.perPage,
          prevPage: null,
          nextPage: null,
        firstUserId: null,
        lastUserId: null,
        totalCount: 0,
      };
    }

    const rows = await context.db
      .select()
      .from(doctorProfiles)
      .where(
        and(
          eq(doctorProfiles.permanent, false),
          isNotNull(doctorProfiles.displayName),
          isNotNull(doctorProfiles.faceEmbeddingKvKey)
        )
      );

    const items = await Promise.all(
      rows.map(async (profile) => {
        const info = await getDoctorInfo(
          context.db,
          profile
        );
        const q = input.query.toLowerCase();
        return {
          ...info,
          displayName: profile.displayName,
          specialties: profile.specialties,
          completeness: computeCompleteness(profile as Record<string, unknown>),
          matchesQuery:
            !q ||
            info.name.toLowerCase().includes(q) ||
            (info.email ?? "").toLowerCase().includes(q),
        };
      })
    );

    const filteredItems = items.filter((item) => item.matchesQuery);
    filteredItems.sort((a, b) => {
      const direction = input.sortDirection === "desc" ? -1 : 1;
      const aValue = a[input.sortBy] ?? "";
      const bValue = b[input.sortBy] ?? "";

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });

    const {
      items: pagedItems,
      page,
      prevPage,
      nextPage,
      firstItem,
      lastItem,
      totalCount,
    } = paginateItems(filteredItems, input.page, input.perPage);

    return {
      items: pagedItems,
      page,
      pageSize: input.perPage,
      prevPage,
      nextPage,
      firstUserId: firstItem?.userId ?? null,
      lastUserId: lastItem?.userId ?? null,
      totalCount,
    };
  });
