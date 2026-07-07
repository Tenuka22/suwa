import { ORPCError } from "@orpc/server";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getDoctorProfile } from "../../../hooks";
import { createLoginLink } from "../stripe-utils";

export const getStripeDashboardLinkRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const profile = await getDoctorProfile(context.db, doctorId);
    if (!profile?.stripeAccountId) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message: "No Stripe account connected.",
      });
    }

    const loginLink = await createLoginLink(profile.stripeAccountId);
    return { url: loginLink.url };
  }
);