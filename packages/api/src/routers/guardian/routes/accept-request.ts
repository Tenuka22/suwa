import { guardianProfiles, patientProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const acceptRequestSchema = z.object({
  patientUserId: z.string(),
});

export const acceptRequestRoute = protectedProcedure
  .input(acceptRequestSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { patientUserId } = input;

    const clerkUser = await context.clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const phone = clerkUser.phoneNumbers[0]?.phoneNumber;

    if (!email && !phone) {
        throw new Error("Guardian must have an email or phone number in Clerk");
    }

    await context.db
      .insert(guardianProfiles)
      .values({
        clerkUserId: userId,
        email: email ?? null,
        phone: phone ?? null,
      })
      .onConflictDoUpdate({
        target: guardianProfiles.clerkUserId,
        set: {
            email: email ?? null,
            phone: phone ?? null,
            updatedAt: new Date().toISOString(),
        }
      });

    await context.db
      .update(patientProfiles)
      .set({
        guardianUserId: userId,
        guardianRequestStatus: "accepted",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(patientProfiles.userId, patientUserId));

    return { success: true };
  });
