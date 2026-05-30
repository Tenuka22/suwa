import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
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
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { addMinutes, format, isWithinInterval, subMinutes } from "date-fns";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  Clock3Icon,
  InboxIcon,
  SparklesIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  VideoIcon,
  XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

function SessionStatusBadge({ status }: { status: string }) {
  if (status === "requested" || status === "rescheduled") {
    return (
      <Badge className="gap-1" variant="secondary">
        <Clock3Icon className="size-3.5" />
        {status === "requested" ? "Requested" : "Rescheduled"}
      </Badge>
    );
  }

  if (status === "approved" || status === "attended") {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle2Icon className="size-3.5" />
        {status === "approved" ? "Approved" : "Attended"}
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="destructive">
      <XCircleIcon className="size-3.5" />
      Failed
    </Badge>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 rounded-3xl" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index.toString()} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Skeleton className="h-[400px] rounded-3xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    </div>
  );
}

function MetricCard({
  description,
  icon,
  title,
  trend,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  trend?: string;
  value: string;
}) {
  return (
    <Card className="rounded-3xl border-border/60">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-4xl tracking-tight">{value}</CardTitle>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="mt-auto flex items-center justify-between text-muted-foreground text-sm">
        <span>{description}</span>

        {trend ? (
          <Badge className="gap-1" variant="secondary">
            <TrendingUpIcon className="size-3" />
            {trend}
          </Badge>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {action}
    </div>
  );
}

function PendingRequests({
  isPending,
  sessions,
  refetch,
}: {
  isPending: boolean;
  sessions: SessionItem[];
  refetch: () => void;
}) {
  const { mutate: respondSession, isPending: isResponding } =
    orpc.respondSession.useMutation({
      onSuccess: () => refetch(),
    });

  const pendingSessions = sessions.filter(
    (session) =>
      session.status === "requested" || session.status === "rescheduled"
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-24 rounded-2xl" key={index.toString()} />
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
          <Card className="rounded-2xl border-border/60" key={session.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border bg-muted/40 p-2 text-muted-foreground">
                  <CalendarClockIcon className="size-4" />
                </div>

                <div className="space-y-1">
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

export const Route = createFileRoute("/doctor/sessions")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: orpc.sessionStats.queryKey(),
        queryFn: () => orpc.sessionStats.call(),
      });

      await context.queryClient.prefetchQuery({
        queryKey: orpc.listDoctorSessions.queryKey(),
        queryFn: () => orpc.listDoctorSessions.call(),
      });
    } catch {
      // noop
    }
  },
  component: DoctorSessionsRoute,
});

function DoctorSessionsRoute() {
  const user = useUser();
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: orpc.sessionStats.queryKey(),
    queryFn: () => orpc.sessionStats.call(),
  });

  const doctorSessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
  });

  if (!user.isLoaded) {
    return <DashboardSkeleton />;
  }

  if (!user.user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <StethoscopeIcon className="size-6" />
            </div>

            <div className="space-y-2">
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                Access your sessions dashboard after signing in.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex justify-center">
            <ClerkSignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;

  const sessions = (doctorSessionsQuery.data?.sessions as SessionItem[]) ?? [];

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

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Sessions overview
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
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
              isPending={doctorSessionsQuery.isPending}
              refetch={() => {
                doctorSessionsQuery.refetch();
                statsQuery.refetch();
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

                  return (
                    <Card
                      className="rounded-2xl border-border/60 transition-all hover:shadow-md"
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

                          {/* Join conference button for approved sessions within time window */}
                          {session.status === "approved" &&
                            isValidStart &&
                            isValidEnd &&
                            isWithinInterval(new Date(), {
                              start: subMinutes(start, 30),
                              end: addMinutes(end, 30),
                            }) && (
                              <div className="col-span-2">
                                <Button
                                  className="mt-2 w-full gap-2"
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
