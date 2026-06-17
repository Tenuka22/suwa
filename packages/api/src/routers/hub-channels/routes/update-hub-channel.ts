import { doctorHubChannels } from "@suwa/db";
import { updateHubChannelSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const updateHubChannelRoute = protectedProcedure
  .input(updateHubChannelSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const timestamp = new Date().toISOString();
    const { id, ...data } = input;

    const result = await context.db
      .update(doctorHubChannels)
      .set({ ...data, updatedAt: timestamp })
      .where(
        and(
          eq(doctorHubChannels.id, id),
          eq(doctorHubChannels.doctorId, doctorId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error("Channel not found");
    }

    return result[0];
  });
