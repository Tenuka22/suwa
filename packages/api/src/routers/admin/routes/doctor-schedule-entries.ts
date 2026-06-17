import type { DoctorScheduleEntry } from "@suwa/db";
import { doctorScheduleEntries } from "@suwa/db";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminDoctorScheduleEntriesRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      from: z.iso.datetime(),
      to: z.iso.datetime(),
    })
  )
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const items = await context.db
      .select()
      .from(doctorScheduleEntries)
      .where(
        and(
          eq(doctorScheduleEntries.doctorId, input.doctorId),
          gte(doctorScheduleEntries.startAt, input.from),
          lte(doctorScheduleEntries.endAt, input.to)
        )
      );

    return { items: items as DoctorScheduleEntry[] };
  });
