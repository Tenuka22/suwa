import { env } from "@zen-doc/env/server";

export interface DoctorMaterialFileInput {
  fileKey: string;
  fileName: string;
  mimeType: string;
}

export async function readDoctorMaterialFile(
  input: DoctorMaterialFileInput
): Promise<File | null> {
  const object = await env.DOCTOR_MATERIALS_BUCKET.get(input.fileKey);
  if (!object) {
    return null;
  }

  return new File([await object.arrayBuffer()], input.fileName, {
    type: input.mimeType,
  });
}
