import { guardianProfiles } from "@zen-doc/db";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { paginateItems, requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminGuardiansRoute = protectedProcedure
  .input(
    z.object({
      page: z.coerce.number().int().positive().default(1),
    })
  )
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const rows = await context.db
      .select()
      .from(guardianProfiles)
      .orderBy(desc(guardianProfiles.createdAt));

    const { items, page, prevPage, nextPage } = paginateItems(
      rows,
      input.page,
      20
    );

    return {
      items,
      page,
      prevPage,
      nextPage,
    };
  });
