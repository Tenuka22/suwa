import { doctorFiles } from "@zen-doc/db";
import { fileKeySchema } from "@zen-doc/db/schemas-types";
import { eq } from "drizzle-orm";
import { readDoctorMaterialFile } from "../../../doctor-materials";
import { publicProcedure } from "../../../index";

export const getDoctorFileRoute = publicProcedure
  .input(fileKeySchema)
  .handler(async ({ context, input }) => {
    const [file] = await context.db
      .select()
      .from(doctorFiles)
      .where(eq(doctorFiles.id, input.id))
      .limit(1);

    if (!file) {
      throw new Error("Doctor file not found");
    }

    const doctorMaterialFile = await readDoctorMaterialFile({
      fileKey: file.fileKey,
      fileName: file.fileName,
      mimeType: file.mimeType,
    });

    if (!doctorMaterialFile) {
      throw new Error("Doctor file not found in bucket");
    }

    return doctorMaterialFile;
  });
