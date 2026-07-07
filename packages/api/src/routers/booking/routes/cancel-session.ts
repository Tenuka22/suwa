import { doctorSessions } from "@suwa/db";
import { cancelSessionSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { cancelPaymentIntent } from "../stripe-utils";

export const cancelSessionRoute = protectedProcedure
  .input(cancelSessionSchema)
  .handler(async ({ context, input }) => {
    const { userId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role;

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isDoctor = session.doctorId === userId;
    const isPatient = session.patientId === userId;
    const isAdmin = role === "admin";
    if (!(isDoctor || isPatient || isAdmin)) {
      throw new Error("Not authorized to cancel this session");
    }

    if (
      session.status === "attended" ||
      session.status === "timing_balance_failure"
    ) {
      throw new Error(
        "Cannot cancel a session that has already ended or failed"
      );
    }

    const now = new Date().toISOString();
    const nowMs = Date.now();
    const startAtMs = new Date(session.startAt).getTime();
    const createdAtMs = new Date(session.createdAt).getTime();
    const totalWindow = startAtMs - createdAtMs;
    const remaining = startAtMs - nowMs;

    if (remaining < totalWindow / 6) {
      throw new Error(
        "Cancellation period has closed. Sessions can only be cancelled within the first 5/6 of the time from booking to session start."
      );
    }

    // Cancel the held payment to release the hold on the patient's card
    if (session.paymentIntentId && session.paymentIntentId.startsWith("pi_")) {
      await cancelPaymentIntent(session.paymentIntentId);
    }

    await context.db
      .update(doctorSessions)
      .set({
        status: "timing_balance_failure",
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    return { ok: true };
  });
