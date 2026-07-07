import { doctorSessions } from "@suwa/db";
import { env } from "@suwa/env/server";
import { eq } from "drizzle-orm";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getLiveKitTokenRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role ?? "user";

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
    const isAdmin = role === "admin";

    if (!(isPatient || isDoctor || isAdmin)) {
      throw new Error("Not authorized to join this session");
    }

    const livekitHost = env.LIVEKIT_HOST;
    const apiKey = env.LIVEKIT_API_KEY;
    const apiSecret = env.LIVEKIT_API_SECRET;

    if (!(livekitHost && apiKey && apiSecret)) {
      throw new Error("LiveKit is not configured");
    }

    const roomName = `session_${session.id}`;
    const identity = isDoctor || isAdmin ? `doctor_${userId}` : `patient_${userId}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: "12h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return {
      token,
      serverUrl: livekitHost,
      roomName,
      session: {
        id: session.id,
        startAt: session.startAt,
        endAt: session.endAt,
        status: session.status,
        doctorId: session.doctorId,
        patientId: session.patientId,
      },
    };
  });
