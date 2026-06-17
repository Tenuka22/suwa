import { doctorPlaylists } from "@suwa/db";
import { idSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const deletePlaylistRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [existing] = await context.db
      .select()
      .from(doctorPlaylists)
      .where(
        and(
          eq(doctorPlaylists.id, input.id),
          eq(doctorPlaylists.doctorId, doctorId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error("Playlist not found");
    }

    await context.db
      .delete(doctorPlaylists)
      .where(eq(doctorPlaylists.id, input.id));

    return { ok: true };
  });
