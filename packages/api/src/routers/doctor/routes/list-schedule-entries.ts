import type { DoctorScheduleEntry, DoctorSession } from "@zen-doc/db";
import { listScheduleEntriesSchema } from "@zen-doc/db/schemas-types";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getScheduleEntriesForDoctor } from "../schedule-utils";

type ScheduleEntryRow = DoctorScheduleEntry & {
  session: DoctorSession | null;
};

export const listScheduleEntriesRoute = protectedProcedure
  .input(listScheduleEntriesSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const items = await getScheduleEntriesForDoctor(
      context.db,
      doctorId,
      input.from,
      input.to
    );

    return {
      items: items as ScheduleEntryRow[],
    };
  });
