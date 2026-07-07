import { getDoctorProfile, requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getConnectAccountStatusRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const profile = await getDoctorProfile(context.db, doctorId);
    if (!profile) {
      throw new Error("Doctor profile not found");
    }

    return {
      stripeAccountId: profile.stripeAccountId ?? null,
      stripeAccountEnabled: !!profile.stripeAccountEnabled,
    };
  }
);
