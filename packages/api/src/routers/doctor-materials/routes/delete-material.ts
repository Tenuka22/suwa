import { doctorHubMaterials } from "@zen-doc/db";
import { idSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { eq, and } from "drizzle-orm";

export const deleteMaterialRoute = protectedProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const result = await context.db
      .delete(doctorHubMaterials)
      .where(and(eq(doctorHubMaterials.id, input.id), eq(doctorHubMaterials.doctorId, doctorId)))
      .returning();

    if (result.length === 0) {
      throw new Error("Material not found");
    }

    return { success: true };
  });
