"use client";

import { Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { addMinutes, format, isWithinInterval, subMinutes } from "date-fns";
import { VideoIcon } from "lucide-react";

import { SessionStatusBadge } from "@/components/session-status-badge";

interface SessionItem {
  createdAt?: string;
  doctorEarnedCents?: number | null;
  endAt: string;
  id: string;
  patientId: string;
  startAt: string;
  status: string;
}

export function DoctorSessionCard({
  session,
  showEarnings,
}: {
  session: SessionItem;
  showEarnings?: boolean;
}) {
  const navigate = useNavigate();
  const start = new Date(session.startAt);
  const end = new Date(session.endAt);
  const created = session.createdAt ? new Date(session.createdAt) : null;

  const isValidStart = !Number.isNaN(start.getTime());
  const isValidEnd = !Number.isNaN(end.getTime());

  const durationMinutes =
    isValidStart && isValidEnd
      ? Math.round((end.getTime() - start.getTime()) / 60_000)
      : null;

  const sessionValue =
    session.doctorEarnedCents == null
      ? "--"
      : `$${(session.doctorEarnedCents / 100).toFixed(2)}`;

  const canJoin =
    session.status === "approved" &&
    isValidStart &&
    isValidEnd &&
    isWithinInterval(new Date(), {
      start: subMinutes(start, 30),
      end: addMinutes(end, 30),
    });

  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-light text-sm leading-tight">
            {session.patientId.slice(0, 12)}...
          </p>
          <p className="font-light text-[10px] text-foreground/60">
            ID: {session.id.slice(0, 8)}...
          </p>
        </div>
        <SessionStatusBadge status={session.status} />
      </div>

      <div className="my-3 h-px bg-border" />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-foreground/60">Date</span>
          <p className="font-medium">
            {isValidStart ? format(start, "MMM d, yyyy") : "--"}
          </p>
        </div>
        <div>
          <span className="text-foreground/60">Time</span>
          <p className="font-medium">
            {isValidStart && isValidEnd
              ? `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
              : "--"}
          </p>
        </div>
        <div>
          <span className="text-foreground/60">Duration</span>
          <p className="font-medium">
            {durationMinutes == null ? "--" : `${durationMinutes} min`}
          </p>
        </div>
        {showEarnings ? (
          <div>
            <span className="text-foreground/60">Earnings</span>
            <p className="font-medium">{sessionValue}</p>
          </div>
        ) : null}
        {created && !Number.isNaN(created.getTime()) ? (
          <div className="col-span-2">
            <span className="text-foreground/60">Booked</span>
            <p className="font-medium">{format(created, "MMM d, h:mm a")}</p>
          </div>
        ) : null}
        {canJoin && (
          <div className="col-span-2">
            <Button
              className="w-full"
              onPress={() => {
                navigate({
                  to: `/doctor/sessions/${session.id}`,
                });
              }}
              size="sm"
              variant="outline"
            >
              <VideoIcon className="size-4" />
              Join Conference
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
