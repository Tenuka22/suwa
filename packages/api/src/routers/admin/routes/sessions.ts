import { doctorSessions } from "@suwa/db";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { paginateItems, requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminSessionsRoute = protectedProcedure
  .input(
    z.object({
      page: z.coerce.number().int().positive().default(1),
    })
  )
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const rows = await context.db
      .select()
      .from(doctorSessions)
      .orderBy(desc(doctorSessions.createdAt));

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
