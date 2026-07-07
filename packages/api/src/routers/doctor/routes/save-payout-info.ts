import { doctorProfiles } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const savePayoutInfoRoute = protectedProcedure
  .input(z.object({ payoutInfo: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId } = await requireDoctor(context);

    await context.db
      .update(doctorProfiles)
      .set({ payoutInfo: input.payoutInfo, updatedAt: new Date().toISOString() })
      .where(eq(doctorProfiles.userId, userId));

    return { success: true };
  });