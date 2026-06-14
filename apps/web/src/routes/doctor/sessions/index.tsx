import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent, CardHeader } from "@zen-doc/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@zen-doc/ui/components/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@zen-doc/ui/components/empty";
import { Separator } from "@zen-doc/ui/components/separator";
import { addMinutes, format, isWithinInterval, subMinutes } from "date-fns";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  InboxIcon,
  SparklesIcon,
  TrendingUpIcon,
  VideoIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { SessionStatusBadge } from "@/components/session-status-badge";
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
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="h-24 animate-pulse rounded-2xl bg-muted"
            key={index.toString()}
          />
        ))}
      </div>
    );
  }

  if (pendingSessions.length === 0) {
    return (
      <Empty className="size-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No pending requests</EmptyTitle>
          <EmptyDescription>
            All caught up! No sessions are waiting for your response.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pendingSessions.slice(0, 5).map((session) => {
        const start = new Date(session.startAt);
        const end = new Date(session.endAt);

        return (
          <Card
            className="rounded-2xl border-border/60 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary"
            key={session.id}
          >
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border bg-muted/40 p-2 text-muted-foreground">
                  <CalendarClockIcon className="size-4" />
                </div>

                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">
                    {session.patientId.slice(0, 12)}...
                  </p>

                  <p className="text-muted-foreground text-sm">
                    {format(start, "EEE, MMM d")}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {format(start, "h:mm a")} - {format(end, "h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <SessionStatusBadge status={session.status} />
                <div className="flex gap-2">
                  <Button
                    disabled={isResponding}
                    onClick={() =>
                      respondSession({
                        sessionId: session.id,
                        action: "reject",
                      })
                    }
                    size="sm"
                    variant="destructive"
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={isResponding}
                    onClick={() =>
                      respondSession({
                        sessionId: session.id,
                        action: "approve",
                      })
                    }
                    size="sm"
                    variant="default"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Sessions dashboard</Badge>
              <Badge variant="secondary">Live overview</Badge>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-lg tracking-tight">
                Sessions overview
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm">
                Track all your patient sessions at a glance. Monitor requests,
                review completed appointments, and analyze session trends over
                time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="All sessions across all statuses"
          icon={<CalendarDaysIcon className="size-5" />}
          title="Total sessions"
          trend="All time"
          value={totalSessions.toString()}
        />

        <MetricCard
          description="Sessions scheduled for today"
          icon={<CalendarCheckIcon className="size-5" />}
          title="Today"
          value={todaySessions.toString()}
        />

        <MetricCard
          description="Awaiting your review or response"
          icon={<InboxIcon className="size-5" />}
          title="Pending"
          value={pendingCount.toString()}
        />

        <MetricCard
          description="Successfully completed consultations"
          icon={<CheckCircle2Icon className="size-5" />}
          title="Completed"
          value={attendedCount.toString()}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <TrendingUpIcon className="size-3" />
                  Sessions trend
                </Badge>
              }
              description="Monthly session volume over the last six months"
              title="Session analytics"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            {monthlySessions.length > 0 ? (
              <ChartContainer
                className="h-[360px] w-full"
                config={{
                  total: {
                    label: "Sessions",
                    color: "var(--primary)",
                  },
                }}
              >
                <AreaChart
                  accessibilityLayer
                  data={monthlySessions}
                  margin={{ left: 8, right: 8 }}
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

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: unknown) =>
                          `${Number(value)} session${Number(value) === 1 ? "" : "s"}`
                        }
                        indicator="line"
                      />
                    }
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
              </ChartContainer>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TrendingUpIcon />
                  </EmptyMedia>
                  <EmptyTitle>No session data yet</EmptyTitle>
                  <EmptyDescription>
                    Session trends will appear once you start seeing patients.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <InboxIcon className="size-3" />
                  Needs attention
                </Badge>
              }
              description="Sessions awaiting your response"
              title="Pending requests"
            />
          </CardHeader>

          <Separator />

          <CardContent className="size-full">
            <PendingRequests
              refetch={() => {
                window.location.reload();
              }}
              sessions={sessions}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              description="Approved sessions ready for you to join"
              title="Upcoming sessions"
            />
          </CardHeader>

          <Separator />

          <CardContent>
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
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <VideoIcon />
                      </EmptyMedia>
                      <EmptyTitle>No upcoming sessions</EmptyTitle>
                      <EmptyDescription>
                        Approved sessions that are ready to join will appear
                        here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                );
              }

              return (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {upcoming.map((session) => {
                    const start = new Date(session.startAt);
                    const end = new Date(session.endAt);

                    return (
                      <Card
                        className="rounded-2xl border-border/60 transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary"
                        key={session.id}
                      >
                        <CardContent className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="rounded-xl border bg-muted/40 p-2 text-muted-foreground">
                                <VideoIcon className="size-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm leading-tight">
                                  {session.patientId.slice(0, 12)}...
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  ID: {session.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                            <SessionStatusBadge status={session.status} />
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                Date
                              </span>
                              <p className="font-medium">
                                {format(start, "MMM d, yyyy")}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Time
                              </span>
                              <p className="font-medium">
                                {format(start, "h:mm a")} -{" "}
                                {format(end, "h:mm a")}
                              </p>
                            </div>
                          </div>

                          <Button
                            className="w-full gap-2"
                            onClick={() => {
                              navigate({
                                to: `/doctor/sessions/${session.id}`,
                              });
                            }}
                            size="sm"
                            variant="default"
                          >
                            <VideoIcon className="size-4" />
                            Join Conference
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              description="Latest appointment updates and completed sessions"
              title="Recent activity"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
                    <Card
                      className="rounded-2xl border-border/60 transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary"
                      key={session.id}
                    >
                      <CardContent className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="rounded-xl border bg-muted/40 p-2 text-muted-foreground">
                              <CalendarClockIcon className="size-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm leading-tight">
                                {session.patientId.slice(0, 12)}...
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                ID: {session.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <SessionStatusBadge status={session.status} />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Date</span>
                            <p className="font-medium">
                              {isValidStart
                                ? format(start, "MMM d, yyyy")
                                : "--"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time</span>
                            <p className="font-medium">
                              {isValidStart && isValidEnd
                                ? `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
                                : "--"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Duration
                            </span>
                            <p className="font-medium">
                              {durationMinutes == null
                                ? "--"
                                : `${durationMinutes} min`}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Earnings
                            </span>
                            <p className="font-medium">{sessionValue}</p>
                          </div>
                          {created && !Number.isNaN(created.getTime()) ? (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Booked
                              </span>
                              <p className="font-medium">
                                {format(created, "MMM d, h:mm a")}
                              </p>
                            </div>
                          ) : null}

                          {canJoin && (
                            <div className="col-span-2">
                              <Button
                                className="w-full gap-2"
                                onClick={() => {
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SparklesIcon />
                  </EmptyMedia>
                  <EmptyTitle>No recent activity</EmptyTitle>
                  <EmptyDescription>
                    Your recent sessions and earnings will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
