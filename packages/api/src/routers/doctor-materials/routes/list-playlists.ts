import { doctorPlaylists } from "@zen-doc/db";
import { listPlaylistsSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { eq } from "drizzle-orm";

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
