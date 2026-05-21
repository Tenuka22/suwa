import type { DoctorEducationEntry } from "@zen-doc/db";
import { doctorEducationEntries } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminDoctorEducationEntriesRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const items = await context.db
      .select()
      .from(doctorEducationEntries)
      .where(eq(doctorEducationEntries.doctorId, input.doctorId));

    return { items: items as DoctorEducationEntry[] };
  });
