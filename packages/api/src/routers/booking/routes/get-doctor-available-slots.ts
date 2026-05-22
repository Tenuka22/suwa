import { doctorProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getOpenScheduleSlotsForDoctor } from "../../doctor/schedule-utils";

export const getDoctorAvailableSlotsRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      from: z.iso.datetime(),
      to: z.iso.datetime(),
    })
  )
  .handler(async ({ context, input }) => {
    requireAuth(context);

    const [doctor] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, input.doctorId))
      .limit(1);

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const slots = await getOpenScheduleSlotsForDoctor(
      context.db,
      input.doctorId,
      input.from,
      input.to
    );

    return { slots, doctorId: input.doctorId };
  });
