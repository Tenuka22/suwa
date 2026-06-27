import { doctorProfiles } from "@suwa/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import {
  getDoctorWithClerkInfo,
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
      query: z.string().default(""),
    })
  )
  .handler(async ({ context, input }) => {
    try {
      requireAdmin(context);
    } catch {
      return {
        items: [],
        page: input.page,
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
        const info = await getDoctorWithClerkInfo(
          context.db,
          context.clerk,
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
    const {
      items: pagedItems,
      page,
      prevPage,
      nextPage,
      firstItem,
      lastItem,
      totalCount,
    } = paginateItems(filteredItems, input.page, 10);

    return {
      items: pagedItems,
      page,
      prevPage,
      nextPage,
      firstUserId: firstItem?.userId ?? null,
      lastUserId: lastItem?.userId ?? null,
      totalCount,
    };
  });
