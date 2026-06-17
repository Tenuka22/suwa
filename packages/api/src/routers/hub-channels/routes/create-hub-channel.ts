import { doctorHubChannels } from "@suwa/db";
import { createHubChannelSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const createHubChannelRoute = protectedProcedure
  .input(createHubChannelSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await context.db.insert(doctorHubChannels).values({
      id,
      doctorId,
      name: input.name,
      handle: input.handle,
      description: input.description ?? null,
      avatarKey: null,
      bannerKey: null,
      isDefault: input.isDefault,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const [created] = await context.db
      .select()
      .from(doctorHubChannels)
      .where(eq(doctorHubChannels.id, id))
      .limit(1);

    return created;
  });
