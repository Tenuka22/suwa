import { doctorPlaylists } from "@suwa/db";
import { idSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getPlaylistRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [playlist] = await context.db
      .select()
      .from(doctorPlaylists)
      .where(
        and(
          eq(doctorPlaylists.id, input.id),
          eq(doctorPlaylists.doctorId, doctorId)
        )
      )
      .limit(1);

    if (!playlist) {
      throw new Error("Playlist not found");
    }

    return playlist;
  });
