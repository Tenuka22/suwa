import { doctorSessions, sessionSnapshots } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { base64ToUint8Array, putStoredFile } from "../../../doctor-materials";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

function decodeSnapshotImage(imageData: string) {
  const dataUrlMatch = imageData.match(/^data:(?<mimeType>[^;]+);base64,(?<data>.+)$/);
  const dataUrlGroups = dataUrlMatch?.groups as
    | { data?: string; mimeType?: string }
    | undefined;
  if (dataUrlGroups?.data && dataUrlGroups.mimeType) {
    return {
      data: base64ToUint8Array(dataUrlGroups.data),
      extension: dataUrlGroups.mimeType.split("/")[1] ?? "bin",
      mimeType: dataUrlGroups.mimeType,
    };
  }

  try {
    return {
      data: base64ToUint8Array(imageData),
      extension: "jpg",
      mimeType: "image/jpeg",
    };
  } catch {
    return {
      data: new TextEncoder().encode(imageData),
      extension: "txt",
      mimeType: "text/plain",
    };
  }
}

export const recordSnapshotRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      imageData: z.string().min(1),
      reason: z.enum(["pre_end_check", "end_check"]),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isPatient = session.patientId === userId;
    const isDoctor = session.doctorId === userId;

    if (!(isPatient || isDoctor)) {
      throw new Error("Not authorized for this session");
    }

    const participantType = isDoctor ? "doctor" : "patient";
    const snapshotId = crypto.randomUUID();
    const capturedAt = new Date().toISOString();
    const snapshot = decodeSnapshotImage(input.imageData);
    const snapshotKey = `session-snapshots/${input.sessionId}/${snapshotId}.${snapshot.extension}`;

    await putStoredFile(context.fileStorageBucket, {
      key: snapshotKey,
      data: snapshot.data,
      mimeType: snapshot.mimeType,
    });

    await context.db.insert(sessionSnapshots).values({
      id: snapshotId,
      sessionId: input.sessionId,
      capturedAt,
      imageUrl: snapshotKey,
      imageData: null,
      participantType,
      reason: input.reason,
    });

    return { ok: true };
  });
