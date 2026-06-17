import { doctorHubMaterials } from "@suwa/db";
import { idSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getMaterialRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [material] = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(
        and(
          eq(doctorHubMaterials.id, input.id),
          eq(doctorHubMaterials.doctorId, doctorId)
        )
      )
      .limit(1);

    if (!material) {
      throw new Error("Material not found");
    }

    return material;
  });
