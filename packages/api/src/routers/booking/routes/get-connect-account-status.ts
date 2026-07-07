import { getDoctorProfile, requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../stripe-utils";

export const getConnectAccountStatusRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const profile = await getDoctorProfile(context.db, doctorId);
    if (!profile) {
      throw new Error("Doctor profile not found");
    }

    const stripeAccountId = profile.stripeAccountId;
    if (!stripeAccountId?.startsWith("acct_")) {
      return {
        connected: false,
        enabled: false,
        stripeAccountId: null,
        stripeAccountEnabled: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        accountCreatedAt: null,
        accountCountry: null,
      };
    }

    try {
      const stripe = getStripe();
      const account = await stripe.accounts.retrieve(stripeAccountId);

      return {
        connected: true,
        enabled: !!profile.stripeAccountEnabled,
        stripeAccountId,
        stripeAccountEnabled: !!profile.stripeAccountEnabled,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        accountCreatedAt: account.created ? new Date(account.created * 1000).toISOString() : null,
        accountCountry: account.country ?? null,
      };
    } catch {
      return {
        connected: false,
        enabled: !!profile.stripeAccountEnabled,
        stripeAccountId,
        stripeAccountEnabled: !!profile.stripeAccountEnabled,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        accountCreatedAt: null,
        accountCountry: null,
      };
    }
  }
);