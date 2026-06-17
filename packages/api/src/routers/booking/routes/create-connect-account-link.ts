import { doctorProfiles } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDoctorProfile, requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../stripe-utils";

export const createConnectAccountLinkRoute = protectedProcedure
  .input(
    z.object({ returnUrl: z.string().url(), refreshUrl: z.string().url() })
  )
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const profile = await getDoctorProfile(context.db, doctorId);
    if (!profile) {
      throw new Error("Doctor profile not found");
    }

    const stripe = getStripe();
    let stripeAccountId = profile.stripeAccountId;

    if (stripeAccountId?.startsWith("acct_")) {
      // Account already exists — sync its status from Stripe
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        const enabled = account.details_submitted && account.charges_enabled;

        const now = new Date().toISOString();
        await context.db
          .update(doctorProfiles)
          .set({
            stripeAccountEnabled: enabled,
            updatedAt: now,
          })
          .where(eq(doctorProfiles.userId, doctorId));

        if (enabled) {
          return { url: null as string | null, connected: true };
        }
      } catch {
        // If retrieving fails, proceed to create a new onboarding link
      }
    } else {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          capabilities: {
            transfers: { requested: true },
          },
          metadata: { doctorId },
        });
        stripeAccountId = account.id;

        await context.db
          .update(doctorProfiles)
          .set({ stripeAccountId, updatedAt: new Date().toISOString() })
          .where(eq(doctorProfiles.userId, doctorId));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to create Stripe Connected Account: ${msg}`);
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: "account_onboarding",
    });

    return { url: accountLink.url, connected: false };
  });
