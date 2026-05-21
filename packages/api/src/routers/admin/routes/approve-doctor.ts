import { doctorProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminApproveDoctorRoute = protectedProcedure
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    requireAdmin(context);

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
  });
