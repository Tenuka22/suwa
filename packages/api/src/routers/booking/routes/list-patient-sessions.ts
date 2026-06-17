import { doctorPlans, doctorProfiles, doctorSessions } from "@suwa/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const listPatientSessionsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: patientId } = requireAuth(context);

    const sessions = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.patientId, patientId))
      .orderBy(doctorSessions.startAt);

    const enhancedSessions = await Promise.all(
      sessions.map(async (session) => {
        const [doctor] = await context.db
          .select()
          .from(doctorProfiles)
          .where(eq(doctorProfiles.userId, session.doctorId))
          .limit(1);

        const [plan] = session.planId
          ? await context.db
              .select()
              .from(doctorPlans)
              .where(eq(doctorPlans.id, session.planId))
              .limit(1)
          : [null];

        return {
          ...session,
          doctor: doctor
            ? {
                displayName: doctor.displayName,
                headline: doctor.headline,
                location: doctor.location,
              }
            : null,
          plan: plan
            ? {
                name: plan.name,
                priceCents: plan.priceCents,
                durationMinutes: plan.durationMinutes,
              }
            : null,
        };
      })
    );

    return { sessions: enhancedSessions };
  }
);
