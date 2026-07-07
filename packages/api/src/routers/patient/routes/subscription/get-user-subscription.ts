import { userSubscriptions } from "@suwa/db";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../../../hooks";
import { protectedProcedure } from "../../../../index";

export const getUserSubscriptionRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const [subscription] = await context.db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);

    return subscription ?? null;
  }
);
