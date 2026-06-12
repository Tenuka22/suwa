import { doctorHubMaterials } from "@zen-doc/db";
import { listMaterialsSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { eq, and } from "drizzle-orm";

export const listMaterialsRoute = protectedProcedure
  .input(listMaterialsSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const materials = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(
        and(
          eq(doctorHubMaterials.doctorId, doctorId),
          input.playlistId ? eq(doctorHubMaterials.playlistId, input.playlistId) : undefined
        )
      )
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);

    return materials;
  });
