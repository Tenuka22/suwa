import { doctorHubMaterials } from "@zen-doc/db";
import { updateMaterialSchema } from "@zen-doc/db/schemas-types";
import { requireDoctor } from "../../../../../hooks";
import { protectedProcedure } from "../../../../../index";
import { eq, and } from "drizzle-orm";

export const updateMaterialRoute = protectedProcedure
  .input(updateMaterialSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const { id, ...data } = input;
    const timestamp = new Date().toISOString();

    const result = await context.db
      .update(doctorHubMaterials)
      .set({ ...data, updatedAt: timestamp })
      .where(and(eq(doctorHubMaterials.id, id), eq(doctorHubMaterials.doctorId, doctorId)))
      .returning();

    if (result.length === 0) {
      throw new Error("Material not found");
    }

    return result[0];
  });
