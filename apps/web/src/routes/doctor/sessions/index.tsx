import { Button, Chip, Separator, Skeleton } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addMinutes, format, isWithinInterval, subMinutes } from "date-fns";
import {
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  InboxIcon,
  VideoIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDaysIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-foreground/60" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-foreground/60 text-sm">{label}</span>
    </div>
  );
}

function PendingRequests({
  sessions,
  refetch,
}: {
  sessions: SessionItem[];
  refetch: () => void;
}) {
  const { mutate: respondSession, isPending: isResponding } = useMutation(
    orpc.respondSession.mutationOptions({
      onSuccess: () => refetch(),
    })
  );

  const pendingSessions = sessions.filter(
    (session) =>
      session.status === "requested" || session.status === "rescheduled"
  );

  if (!sessions) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-16 rounded-xl" key={index.toString()} />
        ))}
      </div>
    );
  }

  if (pendingSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="font-light text-sm">No pending requests</p>
        <p className="max-w-xs font-light text-foreground/60 text-sm">
          All caught up! No sessions are waiting for your response.
        </p>
      </div>
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
  const navigate = useNavigate();
  const { stats, sessionsData } = Route.useLoaderData();
  const sessions = (sessionsData?.sessions as SessionItem[]) ?? [];

  const totalSessions = stats?.totalSessions ?? 0;
  const todaySessions = stats?.todaySessions ?? 0;
  const sessionsByStatus = stats?.sessionsByStatus ?? {};
  const monthlySessions = stats?.monthlySessions ?? [];
  const recentSessions = (stats?.recentSessions ?? []) as SessionItem[];

  const pendingCount =
    (sessionsByStatus.requested ?? 0) + (sessionsByStatus.rescheduled ?? 0);
  const attendedCount = sessionsByStatus.attended ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-light text-2xl tracking-tight">
              Sessions overview
            </h1>
            <Chip color="accent" variant="soft">
              <CalendarDaysIcon className="size-3" />
              Live overview
            </Chip>
          </div>

          <BodyText className="max-w-2xl">
            Track all your patient sessions at a glance. Monitor requests,
            review completed appointments, and analyze session trends over time.
          </BodyText>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={CalendarDaysIcon}
            label="total sessions"
            value={totalSessions.toString()}
          />
          <StatItem
            icon={CalendarCheckIcon}
            label="today"
            value={todaySessions.toString()}
          />
          <StatItem
            icon={InboxIcon}
            label="pending"
            value={pendingCount.toString()}
          />
          <StatItem
            icon={CheckCircle2Icon}
            label="completed"
            value={attendedCount.toString()}
          />
        </div>
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
          <div className="h-[340px] w-full">
            <AreaChart
              accessibilityLayer
              data={monthlySessions}
              height={340}
              margin={{ left: 8, right: 8 }}
              width="100%"
            >
              <CartesianGrid vertical={false} />

              <XAxis
                axisLine={false}
                dataKey="month"
                tickFormatter={(value: string) => {
                  const [year, month] = value.split("-");
                  const date = new Date(Number(year), Number(month) - 1);
                  return format(date, "MMM");
                }}
                tickLine={false}
                tickMargin={10}
              />

              <YAxis
                axisLine={false}
                tickFormatter={(value: number) => value.toString()}
                tickLine={false}
                tickMargin={10}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!(active && payload?.length)) {
                    return null;
                  }
                  const val = Number(payload[0]?.value);
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                      <p className="text-sm">{`${val} session${val === 1 ? "" : "s"}`}</p>
                    </div>
                  );
                }}
                cursor={false}
              />

              <Area
                dataKey="total"
                fill="var(--primary)"
                fillOpacity={0.15}
                stroke="var(--primary)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="font-light text-sm">No session data yet</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Session trends will appear once you start seeing patients.
            </p>
          </div>
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

        <PendingRequests
          refetch={() => {
            window.location.reload();
          }}
          sessions={sessions}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Upcoming sessions</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Approved sessions ready for you to join
          </p>
        </div>

        {(() => {
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
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <p className="font-light text-sm">No upcoming sessions</p>
                <p className="max-w-xs font-light text-foreground/60 text-sm">
                  Approved sessions that are ready to join will appear here.
                </p>
              </div>
            );
          }

          return (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((session) => {
                const start = new Date(session.startAt);
                const end = new Date(session.endAt);

                return (
                  <div
                    className="rounded-xl border border-border px-4 py-3"
                    key={session.id}
                  >
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

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-foreground/60">Date</span>
                        <p className="font-medium">
                          {format(start, "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <span className="text-foreground/60">Time</span>
                        <p className="font-medium">
                          {format(start, "h:mm a")} - {format(end, "h:mm a")}
                        </p>
                      </div>
                    </div>

                    <Button
                      className="mt-3 w-full"
                      onPress={() => {
                        navigate({
                          to: `/doctor/sessions/${session.id}`,
                        });
                      }}
                      size="sm"
                    >
                      <VideoIcon className="size-4" />
                      Join Conference
                    </Button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Recent activity</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Latest appointment updates and completed sessions
          </p>
        </div>

        {recentSessions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentSessions.map((session) => {
              const start = new Date(session.startAt);
              const end = new Date(session.endAt);
              const created = session.createdAt
                ? new Date(session.createdAt)
                : null;

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
                <div
                  className="rounded-xl border border-border px-4 py-3"
                  key={session.id}
                >
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

                  <Separator className="my-3" />

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
                        {durationMinutes == null
                          ? "--"
                          : `${durationMinutes} min`}
                      </p>
                    </div>
                    <div>
                      <span className="text-foreground/60">Earnings</span>
                      <p className="font-medium">{sessionValue}</p>
                    </div>
                    {created && !Number.isNaN(created.getTime()) ? (
                      <div className="col-span-2">
                        <span className="text-foreground/60">Booked</span>
                        <p className="font-medium">
                          {format(created, "MMM d, h:mm a")}
                        </p>
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
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="font-light text-sm">No recent activity</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Your recent sessions and earnings will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
