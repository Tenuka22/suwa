import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zen-doc/ui/components/alert-dialog";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { format } from "date-fns";
import {
  BanIcon,
  CheckCircleIcon,
  ClockIcon,
  Loader2,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useUser } from "@clerk/tanstack-react-start";
import { getMetadataRole } from "@/utils/clerk-auth";

import {
  SessionJoinButton,
  VideoRoomWeb,
} from "@/components/livekit/video-room";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/sessions")({
  component: DoctorSessionsRoute,
});

function SessionStatusBadge({ status }: { status: string }) {
  if (status === "scheduled") {
    return (
      <Badge
        className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
        variant="outline"
      >
        <ClockIcon className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    );
  }

  if (status === "attended") {
    return (
      <Badge
        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        variant="outline"
      >
        <CheckCircleIcon className="mr-1 h-3 w-3" />
        Confirmed
      </Badge>
    );
  }

  return (
    <Badge
      className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
      variant="outline"
    >
      <XCircleIcon className="mr-1 h-3 w-3" />
      Cancelled
    </Badge>
  );
}

function DoctorSessionsRoute() {
  const { user } = useUser();
  const metadataRole = getMetadataRole(user?.publicMetadata);
  const userRole: "patient" | "doctor" | "admin" = metadataRole === "admin" ? "admin" : metadataRole === "doctor" ? "doctor" : "patient";
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [videoSession, setVideoSession] = useState<{
    sessionId: string;
    startAt: string;
    endAt: string;
  } | null>(null);

  const sessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
  });

  const markAttended = useMutation(
    orpc.markSessionAttended.mutationOptions({
      onSuccess: async () => {
        await sessionsQuery.refetch();
        toast.success("Session confirmed as attended");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to confirm session"
        );
      },
    })
  );

  const cancelSession = useMutation(
    orpc.cancelSession.mutationOptions({
      onSuccess: async () => {
        await sessionsQuery.refetch();
        toast.success("Session cancelled, patient refunded");
        setCancelTarget(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to cancel session"
        );
        setCancelTarget(null);
      },
    })
  );

  const sessions = sessionsQuery.data?.sessions ?? [];

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Sessions
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your booked sessions. Join video calls, confirm attendance, or
          cancel if needed.
        </p>
      </div>

      {(() => {
        if (sessionsQuery.isPending) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          );
        }

        if (sessions.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-sm">
                  No sessions yet. Patients will appear here when they book your
                  available slots.
                </p>
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="space-y-3">
            {sessions.map((session) => {
              const start = new Date(session.startAt);
              const end = new Date(session.endAt);
              const formattedDate = format(start, "MMM d, yyyy");
              const formattedTime = `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;

              return (
                <Card key={session.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {formattedDate}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          {formattedTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SessionStatusBadge status={session.status} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Patient:{" "}
                          </span>
                          <span className="font-medium">
                            {session.patientId.slice(0, 12)}...
                          </span>
                        </p>
                        {session.payoutAmount ? (
                          <p>
                            <span className="text-muted-foreground">
                              Amount:{" "}
                            </span>
                            <span className="font-medium">
                              ${(session.payoutAmount / 100).toFixed(2)}
                            </span>
                          </p>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        {session.status === "scheduled" ? (
                          <>
                          <SessionJoinButton
                            endAt={session.endAt}
                            onJoin={() =>
                              setVideoSession({
                                sessionId: session.id,
                                startAt: session.startAt,
                                endAt: session.endAt,
                              })
                            }
                            role={userRole}
                            startAt={session.startAt}
                          />
                            <Button
                              disabled={markAttended.isPending}
                              onClick={() =>
                                markAttended.mutate({
                                  sessionId: session.id,
                                })
                              }
                              size="sm"
                              variant="default"
                            >
                              {markAttended.isPending ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircleIcon className="mr-1 h-3 w-3" />
                              )}
                              Confirm Attendance
                            </Button>
                            <Button
                              disabled={cancelSession.isPending}
                              onClick={() => setCancelTarget(session.id)}
                              size="sm"
                              variant="outline"
                            >
                              <BanIcon className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })()}

      <AlertDialog
        onOpenChange={(open) => !open && setCancelTarget(null)}
        open={!!cancelTarget}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
            <AlertDialogDescription>
              The patient will receive a full refund. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelTarget(null)}>
              Keep Session
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTarget) {
                  cancelSession.mutate({ sessionId: cancelTarget });
                }
              }}
            >
              Cancel Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {videoSession && (
        <VideoRoomWeb
          endAt={videoSession.endAt}
          onClose={() => setVideoSession(null)}
          open={!!videoSession}
          role={userRole}
          sessionId={videoSession.sessionId}
          startAt={videoSession.startAt}
        />
      )}
    </div>
  );
}
