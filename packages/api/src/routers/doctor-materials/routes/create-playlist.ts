import { doctorPlaylists } from "@suwa/db";
import { createPlaylistSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const createPlaylistRoute = protectedProcedure
  .input(createPlaylistSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await context.db.insert(doctorPlaylists).values({
      id,
      doctorId,
      title: input.title,
      description: input.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const [created] = await context.db
      .select()
      .from(doctorPlaylists)
      .where(eq(doctorPlaylists.id, id))
      .limit(1);

    return created;
  });
