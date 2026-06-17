import { doctorHubChannels } from "@suwa/db";
import { idSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getHubChannelRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [channel] = await context.db
      .select()
      .from(doctorHubChannels)
      .where(
        and(
          eq(doctorHubChannels.id, input.id),
          eq(doctorHubChannels.doctorId, doctorId)
        )
      )
      .limit(1);

    if (!channel) {
      throw new Error("Channel not found");
    }

    return channel;
  });
