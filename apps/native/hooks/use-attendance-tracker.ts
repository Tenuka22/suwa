import { useEffect, useRef } from "react";
import type { SessionTimingRole } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

export function useAttendanceTracker({
  isConnected,
  sessionId,
  endAt,
  role,
}: {
  isConnected: boolean;
  sessionId: string;
  endAt: string;
  role: SessionTimingRole;
}) {
  const hasRecordedJoin = useRef(false);
  const snapshotTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isConnected && !hasRecordedJoin.current) {
      hasRecordedJoin.current = true;
      orpc.recordAttendanceEvent
        .call({ sessionId, event: "join" })
        .catch(() => undefined);
    }
  }, [isConnected, sessionId]);

  useEffect(() => {
    if (!isConnected && hasRecordedJoin.current) {
      hasRecordedJoin.current = false;
      orpc.recordAttendanceEvent
        .call({ sessionId, event: "leave" })
        .catch(() => undefined);
    }
  }, [isConnected, sessionId]);

  useEffect(() => {
    if (!isConnected || role !== "doctor") {
      return;
    }

    const endMs = new Date(endAt).getTime();
    const tenMinBeforeEnd = endMs - 10 * 60 * 1000 - Date.now();
    const atEnd = endMs - Date.now();

    if (tenMinBeforeEnd > 0) {
      const timer = setTimeout(() => {
        orpc.recordSnapshot
          .call({
            sessionId,
            imageData: "snapshot_10min_before_end",
            reason: "pre_end_check",
          })
          .catch(() => undefined);
      }, tenMinBeforeEnd);
      snapshotTimers.current.push(timer);
    }

    if (atEnd > 0) {
      const timer = setTimeout(() => {
        orpc.recordSnapshot
          .call({
            sessionId,
            imageData: "snapshot_at_end",
            reason: "end_check",
          })
          .catch(() => undefined);
        orpc.autoMarkAttendance.call({ sessionId }).catch(() => undefined);
      }, atEnd);
      snapshotTimers.current.push(timer);
    }

    return () => {
      for (const timer of snapshotTimers.current) {
        clearTimeout(timer);
      }
      snapshotTimers.current = [];
    };
  }, [isConnected, sessionId, endAt, role]);
}
