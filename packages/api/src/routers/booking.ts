import {
  doctorProfiles,
  doctorScheduleEntries,
  doctorSessions,
} from "@zen-doc/db";
import { env } from "@zen-doc/env/server";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure } from "../index";

// Initialize Stripe helper dynamically using lazy initialization
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = env.STRIPE_SECRET_KEY;
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export const bookingRouter = {
  bookSession: protectedProcedure
    .input(
      z.object({
        doctorId: z.string().min(1),
        scheduleEntryId: z.string().uuid(),
      })
    )
    .handler(async ({ context, input }) => {
      const patientId = context.auth?.userId;
      if (!patientId) {
        throw new Error("Unauthorized: Missing user authentication");
      }

      // Check if slot exists and is "open"
      const [entry] = await context.db
        .select()
        .from(doctorScheduleEntries)
        .where(
          and(
            eq(doctorScheduleEntries.id, input.scheduleEntryId),
            eq(doctorScheduleEntries.doctorId, input.doctorId),
            eq(doctorScheduleEntries.kind, "open")
          )
        )
        .limit(1);

      if (!entry) {
        throw new Error(
          "The selected schedule slot is not available or does not exist"
        );
      }

      const sessionId = crypto.randomUUID();

      // Create session record
      await context.db.insert(doctorSessions).values({
        id: sessionId,
        doctorId: input.doctorId,
        patientId,
        startAt: entry.startAt,
        endAt: entry.endAt,
        status: "scheduled",
        payoutStatus: "none",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update schedule entry to point to this session and change kind to "session"
      await context.db
        .update(doctorScheduleEntries)
        .set({
          kind: "session",
          sessionId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorScheduleEntries.id, input.scheduleEntryId));

      return { ok: true, sessionId };
    }),

  getConnectAccountStatus: protectedProcedure.handler(async ({ context }) => {
    const doctorId = context.auth?.userId;
    if (!doctorId) {
      throw new Error("Unauthorized");
    }

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, doctorId))
      .limit(1);

    if (!profile) {
      throw new Error("Doctor profile not found");
    }

    return {
      stripeAccountId: profile.stripeAccountId ?? null,
      stripeAccountEnabled: !!profile.stripeAccountEnabled,
    };
  }),

  createConnectAccountLink: protectedProcedure
    .input(
      z.object({ returnUrl: z.string().url(), refreshUrl: z.string().url() })
    )
    .handler(async ({ context, input }) => {
      const doctorId = context.auth?.userId;
      if (!doctorId) {
        throw new Error("Unauthorized");
      }

      const [profile] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, doctorId))
        .limit(1);

      if (!profile) {
        throw new Error("Doctor profile not found");
      }

      const stripe = getStripe();
      let stripeAccountId = profile.stripeAccountId;

      if (
        !stripeAccountId ||
        (stripeAccountId && !stripeAccountId.startsWith("acct_"))
      ) {
        try {
          const account = await stripe.accounts.create({
            type: "express",
            capabilities: {
              transfers: { requested: true },
            },
            metadata: {
              doctorId,
            },
          });
          stripeAccountId = account.id;

          await context.db
            .update(doctorProfiles)
            .set({
              stripeAccountId,
              updatedAt: new Date().toISOString(),
            })
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

      return { url: accountLink.url };
    }),

  syncConnectAccountStatus: protectedProcedure.handler(async ({ context }) => {
    const doctorId = context.auth?.userId;
    if (!doctorId) {
      throw new Error("Unauthorized");
    }

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, doctorId))
      .limit(1);

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
  }),

  markSessionAttended: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = context.auth?.userId;
      const role = context.auth?.sessionClaims?.metadata?.role;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const [session] = await context.db
        .select()
        .from(doctorSessions)
        .where(eq(doctorSessions.id, input.sessionId))
        .limit(1);

      if (!session) {
        throw new Error("Session not found");
      }

      const isDoctor = session.doctorId === userId;
      const isAdmin = role === "admin";
      if (!(isDoctor || isAdmin)) {
        throw new Error(
          "Forbidden: You are not authorized to mark this session attended"
        );
      }

      if (session.status === "attended") {
        return {
          ok: true,
          payoutStatus: session.payoutStatus,
          message: "Session already attended",
        };
      }

      await context.db
        .update(doctorSessions)
        .set({
          status: "attended",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorSessions.id, input.sessionId));

      const [doctorProfile] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, session.doctorId))
        .limit(1);

      const stripeAccountId = doctorProfile?.stripeAccountId;
      const stripeEnabled = doctorProfile?.stripeAccountEnabled;

      const payoutAmount = 5000; // $50.00 in cents

      if (!(stripeAccountId && stripeEnabled)) {
        await context.db
          .update(doctorSessions)
          .set({
            payoutStatus: "failed",
            payoutAmount,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(doctorSessions.id, input.sessionId));

        return {
          ok: true,
          payoutStatus: "failed",
          error:
            "Doctor does not have a fully enabled Stripe Connected account. Payout suspended.",
        };
      }

      await context.db
        .update(doctorSessions)
        .set({
          payoutStatus: "pending",
          payoutAmount,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorSessions.id, input.sessionId));

      const stripe = getStripe();
      try {
        const transfer = await stripe.transfers.create({
          amount: payoutAmount,
          currency: "usd",
          destination: stripeAccountId,
          description: `Payout for Session #${session.id} (Patient: ${session.patientId})`,
          metadata: {
            sessionId: session.id,
            doctorId: session.doctorId,
            patientId: session.patientId,
          },
        });

        await context.db
          .update(doctorSessions)
          .set({
            payoutStatus: "paid",
            payoutTransferId: transfer.id,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(doctorSessions.id, input.sessionId));

        return { ok: true, payoutStatus: "paid", transferId: transfer.id };
      } catch (err: unknown) {
        console.error("Stripe connect transfer failed:", err);

        await context.db
          .update(doctorSessions)
          .set({
            payoutStatus: "failed",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(doctorSessions.id, input.sessionId));

        const msg = err instanceof Error ? err.message : String(err);
        return {
          ok: true,
          payoutStatus: "failed",
          error: `Stripe transfer failed: ${msg}`,
        };
      }
    }),

  listPatientSessions: protectedProcedure.handler(async ({ context }) => {
    const patientId = context.auth?.userId;
    if (!patientId) {
      throw new Error("Unauthorized");
    }

    const sessions = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.patientId, patientId))
      .orderBy(doctorSessions.startAt);

    return { sessions };
  }),

  listDoctorSessions: protectedProcedure.handler(async ({ context }) => {
    const doctorId = context.auth?.userId;
    if (!doctorId) {
      throw new Error("Unauthorized");
    }

    const sessions = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.doctorId, doctorId))
      .orderBy(doctorSessions.startAt);

    return { sessions };
  }),
};
