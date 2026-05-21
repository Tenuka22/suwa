import { doctorFiles, doctorProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import type { Context } from "../../context";

export type UploadableFile = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  size: number;
  type: string;
};

export async function canManageDoctorFiles(
  db: Context["db"],
  doctorId: string
) {
  const [profile] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, doctorId))
    .limit(1);

  return profile?.permanent ?? false;
}

export async function listFilesForDoctor(db: Context["db"], doctorId: string) {
  const rows = await db
    .select()
    .from(doctorFiles)
    .where(eq(doctorFiles.doctorId, doctorId));

  return rows.map((file) => ({
    ...file,
    isVideo: file.mimeType.startsWith("video/"),
  }));
}
