import { doctorProfiles } from "@suwa/db";
import { eq } from "drizzle-orm";
import { getDoctorProfile, requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../stripe-utils";

export const syncConnectAccountStatusRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const profile = await getDoctorProfile(context.db, doctorId);
    if (!profile?.stripeAccountId) {
      return { enabled: false };
    }

    const stripe = getStripe();
    try {
      const account = await stripe.accounts.retrieve(profile.stripeAccountId);
      const enabled = account.details_submitted && account.charges_enabled;

      await context.db
        .update(doctorProfiles)
        .set({
          stripeAccountEnabled: enabled,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorProfiles.userId, doctorId));

      return { enabled };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to sync Stripe Connected Account status: ${msg}`);
    }
  }
);
