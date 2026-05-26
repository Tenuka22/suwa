import { env } from "@zen-doc/env/server";

export interface DoctorMaterialFileInput {
  fileKey: string;
  fileName: string;
  mimeType: string;
}

export async function readDoctorMaterialFile(
  input: DoctorMaterialFileInput
): Promise<File | null> {
  const data = await env.DOCTOR_MATERIALS_KV.get(input.fileKey, {
    type: "arrayBuffer",
  });
  if (!data) {
    return null;
  }

  return new File([data], input.fileName, {
    type: input.mimeType,
  });
}
