import { useEffect, useMemo, useState } from "react";

type SessionTimingRole = "patient" | "doctor" | "admin";

interface SessionTiming {
  canJoin: boolean;
  joinWindowOpenAt: Date | null;
  leaveDeadlineAt: Date | null;
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

  const isDoctor = role === "doctor";

  const joinWindowOpenAt = new Date(start - THIRTY_MIN_MS);

  const leaveDeadline = isDoctor ? end + ONE_HOUR_MS : end + THIRTY_MIN_MS;

  const leaveDeadlineAt = new Date(leaveDeadline);

  const canJoin = now >= start - THIRTY_MIN_MS && now <= end;

  const mustLeave = now > leaveDeadline;

  let timeStatus: SessionTiming["timeStatus"];
  if (now < start - THIRTY_MIN_MS) {
    timeStatus = "before";
  } else if (now <= end) {
    timeStatus = "during";
  } else if (now <= leaveDeadline) {
    timeStatus = "grace";
  } else {
    timeStatus = "ended";
  }

  const remainingMs = Math.max(0, leaveDeadline - now);

  return {
    canJoin,
    joinWindowOpenAt,
    leaveDeadlineAt,
    mustLeave,
    timeStatus,
    remainingMs,
  };
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
    [startAt, endAt, role, _now]
  );

  const formattedRemaining = useMemo(() => {
    const totalMinutes = Math.ceil(timing.remainingMs / 60_000);
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }, [timing.remainingMs]);

  return { ...timing, formattedRemaining };
}
