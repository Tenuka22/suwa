import { doctorPlaylists } from "@suwa/db";
import { listPlaylistsSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const listPlaylistsRoute = protectedProcedure
  .input(listPlaylistsSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    return await context.db
      .select()
      .from(doctorPlaylists)
      .where(eq(doctorPlaylists.doctorId, doctorId))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);
  });
