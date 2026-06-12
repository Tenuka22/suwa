import { doctorPlaylists } from "@zen-doc/db";
import { updatePlaylistSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { and, eq } from "drizzle-orm";

export const updatePlaylistRoute = protectedProcedure
  .input(updatePlaylistSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [existing] = await context.db
      .select()
      .from(doctorPlaylists)
      .where(and(eq(doctorPlaylists.id, input.id), eq(doctorPlaylists.doctorId, doctorId)))
      .limit(1);

    if (!existing) {
      throw new Error("Playlist not found");
    }

    const timestamp = new Date().toISOString();
    await context.db
      .update(doctorPlaylists)
      .set({
        title: input.title ?? existing.title,
        description: input.description === undefined ? existing.description : input.description,
        updatedAt: timestamp,
      })
      .where(eq(doctorPlaylists.id, input.id));

    return { ok: true };
  });
