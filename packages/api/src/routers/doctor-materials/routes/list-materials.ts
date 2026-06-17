import { doctorHubMaterials } from "@suwa/db";
import { listMaterialsSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const listMaterialsRoute = protectedProcedure
  .input(listMaterialsSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const conditions = [eq(doctorHubMaterials.doctorId, doctorId)];
    if (input.channelId) {
      conditions.push(eq(doctorHubMaterials.channelId, input.channelId));
    }
    if (input.playlistId) {
      conditions.push(eq(doctorHubMaterials.playlistId, input.playlistId));
    }
    if (input.visibility) {
      conditions.push(eq(doctorHubMaterials.visibility, input.visibility));
    }
    if (input.status) {
      conditions.push(eq(doctorHubMaterials.status, input.status));
    }

    const materials = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(and(...conditions))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);

    return materials.map((m) => ({
      ...m,
      tags: m.tags ? JSON.parse(m.tags) : null,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    }));
  });
