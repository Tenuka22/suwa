import { doctorProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getDoctorWithClerkInfo,
  paginateItems,
  requireAdmin,
} from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminApprovedDoctorsRoute = protectedProcedure
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
      };
    }

    const rows = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.permanent, true));

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
          role: "doctor" as const,
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
    } = paginateItems(filteredItems, input.page, 10);

    return {
      items: pagedItems,
      page,
      prevPage,
      nextPage,
      firstUserId: firstItem?.userId ?? null,
      lastUserId: lastItem?.userId ?? null,
    };
  });
