import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zen-doc/ui/components/dialog";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
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
import { SessionJoinButton } from "@/components/livekit/video-room";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/sessions")({
  component: DoctorSessionsRoute,
});

function SessionStatusBadge({ status }: { status: string }) {
  if (status === "requested") {
    return (
      <Badge
        className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
        variant="outline"
      >
        <ClockIcon className="mr-1 h-3 w-3" />
        Requested
      </Badge>
    );
  }

  if (status === "rescheduled") {
    return (
      <Badge
        className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
        variant="outline"
      >
        <ClockIcon className="mr-1 h-3 w-3" />
        Rescheduled
      </Badge>
    );
  }

  if (status === "approved") {
    return (
      <Badge
        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        variant="outline"
      >
        <CheckCircleIcon className="mr-1 h-3 w-3" />
        Approved
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
        Attended
      </Badge>
    );
  }

  if (status === "timing_balance_failure") {
    return (
      <Badge
        className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
        variant="outline"
      >
        <XCircleIcon className="mr-1 h-3 w-3" />
        Failed to Agree
      </Badge>
    );
  }

  return (
    <Badge
      className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
      variant="outline"
    >
      <XCircleIcon className="mr-1 h-3 w-3" />
      Failed to Agree
    </Badge>
  );
}

function canCancelSession(session: {
  startAt: string;
  createdAt: string;
}): boolean {
  const nowMs = Date.now();
  const startAtMs = new Date(session.startAt).getTime();
  const createdAtMs = new Date(session.createdAt).getTime();
  const totalWindow = startAtMs - createdAtMs;
  const remaining = startAtMs - nowMs;
  return remaining >= totalWindow / 6;
}

function DoctorSessionsRoute() {
  const { user } = useUser();
  const metadataRole = getMetadataRole(user?.publicMetadata);
  const userRole: "patient" | "doctor" | "admin" =
    metadataRole === "admin"
      ? "admin"
      : metadataRole === "doctor"
        ? "doctor"
        : "patient";
  const navigate = useNavigate();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [proposeTarget, setProposeTarget] = useState<string | null>(null);
  const [proposedStart, setProposedStart] = useState("");
  const [proposedEnd, setProposedEnd] = useState("");

  const sessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
  });

  const respondSession = useMutation(
    orpc.respondSession.mutationOptions({
      onSuccess: async () => {
        await sessionsQuery.refetch();
        toast.success("Response sent");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to respond"
        );
      },
    })
  );

  const cancelSession = useMutation(
    orpc.cancelSession.mutationOptions({
      onSuccess: async () => {
        await sessionsQuery.refetch();
        toast.success("Session cancelled, credits refunded");
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

  function openProposeDialog(session: {
    id: string;
    startAt: string;
    endAt: string;
  }) {
    setProposeTarget(session.id);
    setProposedStart(session.startAt);
    setProposedEnd(session.endAt);
  }

  function handleProposeSubmit() {
    if (!(proposeTarget && proposedStart && proposedEnd)) {
      toast.error("Please fill in both start and end times");
      return;
    }
    respondSession.mutate({
      sessionId: proposeTarget,
      action: "propose",
      proposedStartAt: new Date(proposedStart).toISOString(),
      proposedEndAt: new Date(proposedEnd).toISOString(),
    });
    setProposeTarget(null);
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Sessions
        </h1>
        <p className="text-muted-foreground text-sm">
          Review patient requests, approve or propose a different time.
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
                  No sessions yet.
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
                            Patient ID:{" "}
                          </span>
                          <span className="font-medium">
                            {session.patientId.slice(0, 12)}...
                          </span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {session.status === "approved" && (
                          <SessionJoinButton
                            endAt={session.endAt}
                            onJoin={(id) =>
                              navigate({
                                to: "/doctor/sessions/$sessionId",
                                params: { sessionId: id },
                              })
                            }
                            role={userRole}
                            sessionId={session.id}
                            startAt={session.startAt}
                          />
                        )}

                        {session.status === "requested" && (
                          <>
                            <Button
                              disabled={respondSession.isPending}
                              onClick={() =>
                                respondSession.mutate({
                                  sessionId: session.id,
                                  action: "approve",
                                })
                              }
                              size="sm"
                              variant="default"
                            >
                              <CheckCircleIcon className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              disabled={respondSession.isPending}
                              onClick={() => openProposeDialog(session)}
                              size="sm"
                              variant="outline"
                            >
                              <ClockIcon className="mr-1 h-3 w-3" />
                              Propose Time
                            </Button>
                            <Button
                              disabled={respondSession.isPending}
                              onClick={() =>
                                respondSession.mutate({
                                  sessionId: session.id,
                                  action: "reject",
                                })
                              }
                              size="sm"
                              variant="outline"
                            >
                              <BanIcon className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </>
                        )}

                        {(session.status === "approved" ||
                          session.status === "requested") &&
                          canCancelSession(session) && (
                            <Button
                              disabled={cancelSession.isPending}
                              onClick={() => setCancelTarget(session.id)}
                              size="sm"
                              variant="outline"
                            >
                              <BanIcon className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          )}
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
            <AlertDialogTitle>Cancel Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the session and refund the patient's credits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelTarget(null)}>
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTarget) {
                  cancelSession.mutate({ sessionId: cancelTarget });
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setProposeTarget(null);
          }
        }}
        open={!!proposeTarget}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose New Time</DialogTitle>
            <DialogDescription>
              Suggest a different time for this session. The patient can accept
              or counter-propose.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="propose-start">Start Time</Label>
              <Input
                id="propose-start"
                onChange={(e) => setProposedStart(e.target.value)}
                type="datetime-local"
                value={proposedStart}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="propose-end">End Time</Label>
              <Input
                id="propose-end"
                onChange={(e) => setProposedEnd(e.target.value)}
                type="datetime-local"
                value={proposedEnd}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setProposeTarget(null)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={respondSession.isPending}
              onClick={handleProposeSubmit}
            >
              {respondSession.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
