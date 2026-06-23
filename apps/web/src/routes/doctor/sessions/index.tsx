import { Button, Chip, Separator } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { addMinutes, format, isWithinInterval, subMinutes } from "date-fns";
import { InboxIcon } from "lucide-react";

import {
  DoctorSessionCard,
  DoctorSessionChart,
  DoctorSessionStats,
  EmptyState,
  EmptyStateSkeleton,
} from "@/components/doctors";
import { SessionStatusBadge } from "@/components/session-status-badge";
import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

interface SessionItem {
  createdAt?: string;
  doctorEarnedCents?: number | null;
  endAt: string;
  id: string;
  patientId: string;
  startAt: string;
  status: string;
}

function PendingRequests({ sessions }: { sessions: SessionItem[] }) {
  const queryClient = useQueryClient();
  const { mutate: respondSession, isPending: isResponding } = useMutation(
    orpc.respondSession.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.listDoctorSessions.queryKey(),
        });
      },
    })
  );

  const pendingSessions = sessions.filter(
    (session) => session.status === "requested"
  );

  if (!sessions) {
    return <EmptyStateSkeleton />;
  }

  if (pendingSessions.length === 0) {
    return (
      <EmptyState
        description="All caught up! No sessions are waiting for your response."
        title="No pending requests"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {pendingSessions.slice(0, 5).map((session) => {
        const start = new Date(session.startAt);
        const end = new Date(session.endAt);

        return (
          <div
            className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3"
            key={session.id}
          >
            <div className="flex flex-col gap-1">
              <p className="font-light text-sm">
                {session.patientId.slice(0, 12)}...
              </p>
              <p className="text-foreground/60 text-sm">
                {format(start, "EEE, MMM d")}
              </p>
              <p className="text-foreground/60 text-xs">
                {format(start, "h:mm a")} - {format(end, "h:mm a")}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <SessionStatusBadge status={session.status} />
              <div className="flex gap-2">
                <Button
                  isDisabled={isResponding}
                  onPress={() =>
                    respondSession({
                      sessionId: session.id,
                      action: "reject",
                    })
                  }
                  size="sm"
                  variant="danger"
                >
                  Reject
                </Button>
                <Button
                  isDisabled={isResponding}
                  onPress={() =>
                    respondSession({
                      sessionId: session.id,
                      action: "approve",
                    })
                  }
                  size="sm"
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UpcomingSessionsList({ sessions }: { sessions: SessionItem[] }) {
  const upcoming = sessions.filter((session) => {
    const start = new Date(session.startAt);
    const end = new Date(session.endAt);
    const isValidStart = !Number.isNaN(start.getTime());
    const isValidEnd = !Number.isNaN(end.getTime());

    return (
      session.status === "approved" &&
      isValidStart &&
      isValidEnd &&
      isWithinInterval(new Date(), {
        start: subMinutes(start, 30),
        end: addMinutes(end, 30),
      })
    );
  });

  if (upcoming.length === 0) {
    return (
      <EmptyState
        description="Approved sessions that are ready to join will appear here."
        title="No upcoming sessions"
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {upcoming.map((session) => (
        <DoctorSessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}

function RecentActivityList({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        description="Your recent sessions and earnings will appear here."
        title="No recent activity"
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sessions.map((session) => (
        <DoctorSessionCard key={session.id} session={session} showEarnings />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/doctor/sessions/")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    const [stats, sessionsData] = await Promise.all([
      context.queryClient.ensureQueryData(orpc.sessionStats.queryOptions()),
      context.queryClient.ensureQueryData(
        orpc.listDoctorSessions.queryOptions()
      ),
    ]);
    return { stats, sessionsData };
  },
  component: DoctorSessionsRoute,
});

function DoctorSessionsRoute() {
  const { stats, sessionsData } = Route.useLoaderData();
  const sessions = (sessionsData?.sessions as SessionItem[]) ?? [];
  const monthlySessions = stats?.monthlySessions ?? [];
  const recentSessions = (stats?.recentSessions ?? []) as SessionItem[];
  const sessionsByStatus = stats?.sessionsByStatus ?? {};
  const pendingCount =
    (sessionsByStatus.requested ?? 0) + (sessionsByStatus.rescheduled ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <PageTitle>Sessions overview</PageTitle>
          <Chip color="accent" variant="soft">
            <InboxIcon className="size-3" />
            Live overview
          </Chip>
        </div>
        <BodyText className="max-w-2xl">
          Track all your patient sessions at a glance. Monitor requests, review
          completed appointments, and analyze session trends over time.
        </BodyText>
      </div>

      <Separator />

      <section className="flex flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <DoctorSessionStats stats={stats} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Session analytics</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Monthly session volume over the last six months
          </p>
        </div>
        {monthlySessions.length > 0 ? (
          <DoctorSessionChart data={monthlySessions} />
        ) : (
          <EmptyState
            description="Session trends will appear once you start seeing patients."
            title="No session data yet"
          />
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageTitle>Pending requests</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Sessions awaiting your response
            </p>
          </div>
          {pendingCount > 0 && (
            <Chip color="default" variant="soft">
              <InboxIcon className="size-3" />
              Needs attention
            </Chip>
          )}
        </div>
        <PendingRequests sessions={sessions} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Upcoming sessions</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Approved sessions ready for you to join
          </p>
        </div>
        <UpcomingSessionsList sessions={sessions} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Recent activity</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Latest appointment updates and completed sessions
          </p>
        </div>
        <RecentActivityList sessions={recentSessions} />
      </section>
    </div>
  );
}