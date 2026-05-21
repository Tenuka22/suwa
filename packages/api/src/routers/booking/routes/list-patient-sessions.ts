import { doctorSessions } from "@zen-doc/db";
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

    return { sessions };
  }
);
