import { creditTransactions, userCredits } from "@zen-doc/db";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { paginateItems, requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminCreditTransactionsRoute = protectedProcedure
  .input(
    z.object({
      page: z.coerce.number().int().positive().default(1),
    })
  )
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const rows = await context.db
      .select()
      .from(creditTransactions)
      .orderBy(desc(creditTransactions.createdAt));

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

export const adminUserCreditsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    requireAdmin(context);

    const rows = await context.db
      .select()
      .from(userCredits)
      .orderBy(desc(userCredits.balance));

    return { items: rows };
  });
