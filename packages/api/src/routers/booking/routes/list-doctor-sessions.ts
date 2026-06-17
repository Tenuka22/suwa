import { doctorSessions } from "@suwa/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const listDoctorSessionsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const sessions = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.doctorId, doctorId))
      .orderBy(doctorSessions.startAt);

    return { sessions };
  }
);
