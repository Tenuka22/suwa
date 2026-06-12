import { doctorPlaylists } from "@zen-doc/db";
import { createPlaylistSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { eq } from "drizzle-orm";

export const createPlaylistRoute = protectedProcedure
  .input(createPlaylistSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    if (doctorId !== input.doctorId) {
      throw new Error("Forbidden");
    }

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
