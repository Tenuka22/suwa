import { patientProfiles } from "@zen-doc/db";
import { or, eq, and } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getPendingRequestsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const clerkUser = await context.clerk.users.getUser(userId);
    const emails = clerkUser.emailAddresses.map((e) => e.emailAddress);
    const phones = clerkUser.phoneNumbers.map((p) => p.phoneNumber);

    if (emails.length === 0 && phones.length === 0) {
      return [];
    }

    const conditions = [];
    if (emails.length > 0) {
      conditions.push(...emails.map((email) => eq(patientProfiles.guardianEmail, email)));
    }
    if (phones.length > 0) {
      conditions.push(...phones.map((phone) => eq(patientProfiles.guardianPhone, phone)));
    }

    const pendingRequests = await context.db.query.patientProfiles.findMany({
      where: and(
        eq(patientProfiles.guardianRequestStatus, "pending"),
        or(...conditions)
      ),
    });

    return pendingRequests;
  }
);
