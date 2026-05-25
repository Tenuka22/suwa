import { useEffect, useMemo, useState } from "react";

type SessionTimingRole = "patient" | "doctor" | "admin";

interface SessionTiming {
  canJoin: boolean;
  mustLeave: boolean;
  remainingMs: number;
  timeStatus: "before" | "during" | "grace" | "must-leave" | "ended";
}

const THIRTY_MIN_MS = 30 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function computeTiming(
  startAt: string,
  endAt: string,
  role: SessionTimingRole
): SessionTiming {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";

  const canJoin =
    isAdmin || (now >= start - THIRTY_MIN_MS && now <= end + THIRTY_MIN_MS);

  let leaveDeadline: number;
  if (isAdmin) {
    leaveDeadline = Number.POSITIVE_INFINITY;
  } else if (isDoctor) {
    leaveDeadline = end + ONE_HOUR_MS;
  } else {
    leaveDeadline = end + THIRTY_MIN_MS;
  }

  const mustLeave = !isAdmin && now > leaveDeadline;

  let timeStatus: SessionTiming["timeStatus"];
  if (now < start - THIRTY_MIN_MS) {
    timeStatus = "before";
  } else if (now <= end) {
    timeStatus = "during";
  } else if (now <= leaveDeadline) {
    timeStatus = "grace";
  } else if (mustLeave) {
    timeStatus = "must-leave";
  } else {
    timeStatus = "ended";
  }

  const remainingMs = Math.max(0, leaveDeadline - now);

  return { canJoin, mustLeave, timeStatus, remainingMs };
}

export function useSessionTiming(
  startAt: string,
  endAt: string,
  role: SessionTimingRole
): SessionTiming & { formattedRemaining: string } {
  const [_now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const timing = useMemo(
    () => computeTiming(startAt, endAt, role),
    [startAt, endAt, role]
  );

  const formattedRemaining = useMemo(() => {
    const ms = timing.remainingMs;
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
  }, [timing.remainingMs]);

  return { ...timing, formattedRemaining };
}
