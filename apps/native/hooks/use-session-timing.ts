import { useMemo } from "react";

export type SessionTimingRole = "patient" | "doctor" | "admin";

export interface SessionTiming {
  canJoin: boolean;
  joinWindowOpenAt: Date | null;
  leaveDeadlineAt: Date | null;
  mustLeave: boolean;
  remainingMs: number;
  timeStatus: "before" | "during" | "grace" | "must-leave" | "ended";
}

const THIRTY_MIN_MS = 30 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function computeSessionTiming(
  startAt: string,
  endAt: string,
  role: SessionTimingRole
): SessionTiming {
  const now = Date.now();
  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";

  const joinWindowOpenAt = new Date(startMs - THIRTY_MIN_MS);
  const patientLeaveDeadline = new Date(endMs + THIRTY_MIN_MS);
  const doctorLeaveDeadline = new Date(endMs + ONE_HOUR_MS);

  let leaveDeadlineAt: Date | null;
  if (isAdmin) {
    leaveDeadlineAt = null;
  } else if (isDoctor) {
    leaveDeadlineAt = doctorLeaveDeadline;
  } else {
    leaveDeadlineAt = patientLeaveDeadline;
  }

  const canJoin =
    isAdmin || (now >= startMs - THIRTY_MIN_MS && now <= endMs + THIRTY_MIN_MS);

  const mustLeave =
    !isAdmin && leaveDeadlineAt !== null && now > leaveDeadlineAt.getTime();

  let timeStatus: SessionTiming["timeStatus"];
  if (now < startMs - THIRTY_MIN_MS) {
    timeStatus = "before";
  } else if (now <= endMs) {
    timeStatus = "during";
  } else if (now <= (isDoctor ? endMs + ONE_HOUR_MS : endMs + THIRTY_MIN_MS)) {
    timeStatus = "grace";
  } else if (mustLeave) {
    timeStatus = "must-leave";
  } else {
    timeStatus = "ended";
  }

  const remainingMs = leaveDeadlineAt
    ? Math.max(0, leaveDeadlineAt.getTime() - now)
    : Number.POSITIVE_INFINITY;

  return {
    canJoin,
    mustLeave,
    timeStatus,
    joinWindowOpenAt,
    leaveDeadlineAt,
    remainingMs,
  };
}

export function useSessionTiming(
  startAt: string,
  endAt: string,
  role: SessionTimingRole
): SessionTiming {
  return useMemo(
    () => computeSessionTiming(startAt, endAt, role),
    [startAt, endAt, role]
  );
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) {
    return "";
  }
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
