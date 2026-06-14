'use client';

import { useEffect, useMemo, useState } from "react";

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

export function _computeSessionTiming(
  startAt: string,
  endAt: string,
  role: SessionTimingRole
): SessionTiming {
  const now = Date.now();
  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();

  const isDoctor = role === "doctor";

  const joinWindowOpenAt = new Date(startMs - THIRTY_MIN_MS);
  const patientLeaveDeadline = new Date(endMs + THIRTY_MIN_MS);
  const doctorLeaveDeadline = new Date(endMs + ONE_HOUR_MS);

  const leaveDeadlineAt = isDoctor ? doctorLeaveDeadline : patientLeaveDeadline;

  const canJoin = now >= startMs - THIRTY_MIN_MS && now <= endMs;

  const mustLeave = now > leaveDeadlineAt.getTime();

  let timeStatus: SessionTiming["timeStatus"];
  if (now < startMs - THIRTY_MIN_MS) {
    timeStatus = "before";
  } else if (now <= endMs) {
    timeStatus = "during";
  } else if (now <= leaveDeadlineAt.getTime()) {
    timeStatus = "grace";
  } else {
    timeStatus = "ended";
  }

  const remainingMs = Math.max(0, leaveDeadlineAt.getTime() - now);

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
  const [_now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(
    () => _computeSessionTiming(startAt, endAt, role),
    // _now triggers recalculation so timing updates as time passes
    [startAt, endAt, role, _now]
  );
}

export function _formatDuration(ms: number): string {
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
