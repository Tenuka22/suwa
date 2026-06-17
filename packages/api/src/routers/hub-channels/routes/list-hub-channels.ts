import { doctorHubChannels } from "@suwa/db";
import { listHubChannelsSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const listHubChannelsRoute = protectedProcedure
  .input(listHubChannelsSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    return await context.db
      .select()
      .from(doctorHubChannels)
      .where(eq(doctorHubChannels.doctorId, doctorId))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);
  });
