import { userCredits } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getUserCreditsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role;

    if (role === "admin") {
      return { balance: -1, isAdmin: true };
    }

    try {
      const [creditRecord] = await context.db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!creditRecord) {
        const creditId = crypto.randomUUID();
        const now = new Date().toISOString();
        await context.db.insert(userCredits).values({
          id: creditId,
          userId,
          balance: 1,
          createdAt: now,
          updatedAt: now,
        });
        return { balance: 1, isAdmin: false };
      }

      return { balance: creditRecord.balance, isAdmin: false };
    } catch {
      return { balance: 1, isAdmin: false };
    }
  }
);
