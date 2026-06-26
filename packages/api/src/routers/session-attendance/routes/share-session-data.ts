import { doctorSessions, sessionSharedData } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const sharePatientDataRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      encryptedData: z.string().min(1),
      patientPublicKey: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.patientId !== userId) {
      throw new Error("Only the patient can share their data");
    }

    await context.db
      .insert(sessionSharedData)
      .values({
        sessionId: input.sessionId,
        encryptedData: input.encryptedData,
        patientPublicKey: input.patientPublicKey,
      })
      .onConflictDoUpdate({
        target: sessionSharedData.sessionId,
        set: {
          encryptedData: input.encryptedData,
          patientPublicKey: input.patientPublicKey,
        },
      });

    return { ok: true };
  });

export const getSharedPatientDataRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isPatient = session.patientId === userId;
    const isDoctor = session.doctorId === userId;

    if (!(isPatient || isDoctor)) {
      throw new Error("Not authorized for this session");
    }

    const shared = await context.db.query.sessionSharedData.findFirst({
      where: eq(sessionSharedData.sessionId, input.sessionId),
    });

    if (!shared) {
      return null;
    }

    return {
      encryptedData: shared.encryptedData,
      patientPublicKey: shared.patientPublicKey,
    };
  });

export const storeDoctorPublicKeyRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      publicKey: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = await requireDoctor(context);

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.doctorId !== userId) {
      throw new Error("Not authorized for this session");
    }

    await context.db
      .insert(sessionSharedData)
      .values({
        sessionId: input.sessionId,
        doctorPublicKey: input.publicKey,
      })
      .onConflictDoUpdate({
        target: sessionSharedData.sessionId,
        set: {
          doctorPublicKey: input.publicKey,
        },
      });

    return { ok: true };
  });

export const getDoctorPublicKeyRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isPatient = session.patientId === userId;
    const isDoctor = session.doctorId === userId;

    if (!(isPatient || isDoctor)) {
      throw new Error("Not authorized for this session");
    }

    const shared = await context.db.query.sessionSharedData.findFirst({
      where: eq(sessionSharedData.sessionId, input.sessionId),
    });

    if (!shared?.doctorPublicKey) {
      return null;
    }

    return { publicKey: shared.doctorPublicKey };
  });
