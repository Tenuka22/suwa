import { doctorPlaylists } from "@zen-doc/db";
import { idSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { and, eq } from "drizzle-orm";

export const deletePlaylistRoute = protectedProcedure
  .input(idSchema)
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

    await context.db
      .delete(doctorPlaylists)
      .where(eq(doctorPlaylists.id, input.id));

    return { ok: true };
  });
