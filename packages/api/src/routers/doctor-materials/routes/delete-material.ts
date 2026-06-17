import { doctorHubMaterials } from "@suwa/db";
import { idSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const deleteMaterialRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const result = await context.db
      .delete(doctorHubMaterials)
      .where(
        and(
          eq(doctorHubMaterials.id, input.id),
          eq(doctorHubMaterials.doctorId, doctorId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error("Material not found");
    }

    return { success: true };
  });
