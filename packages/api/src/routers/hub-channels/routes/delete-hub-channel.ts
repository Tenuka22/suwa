import { doctorHubChannels } from "@suwa/db";
import { idSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const deleteHubChannelRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const result = await context.db
      .delete(doctorHubChannels)
      .where(
        and(
          eq(doctorHubChannels.id, input.id),
          eq(doctorHubChannels.doctorId, doctorId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error("Channel not found");
    }

    return { success: true };
  });
