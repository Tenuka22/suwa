import { doctorHubMaterials } from "@zen-doc/db";
import { idSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { eq, and } from "drizzle-orm";

export const getMaterialRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [material] = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(and(eq(doctorHubMaterials.id, input.id), eq(doctorHubMaterials.doctorId, doctorId)))
      .limit(1);

    if (!material) {
      throw new Error("Material not found");
    }

    return material;
  });
