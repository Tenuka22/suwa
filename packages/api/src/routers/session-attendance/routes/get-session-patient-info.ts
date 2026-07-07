import { doctorSessions, patientProfiles } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getSessionPatientInfoRoute = protectedProcedure
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

    const role = context.auth?.sessionClaims?.metadata?.role ?? "user";
    const isPatient = session.patientId === userId;
    const isDoctor = session.doctorId === userId;
    const isAdmin = role === "admin";

    if (!(isPatient || isDoctor || isAdmin)) {
      throw new Error("Not authorized for this session");
    }

    const patient = await context.db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, session.patientId),
    });

    if (!patient) {
      return null;
    }

    return {
      alias: patient.alias,
      ageCategory: patient.ageCategory,
      profession: patient.profession,
    };
  });
