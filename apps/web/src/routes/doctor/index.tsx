import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@zen-doc/ui/components/avatar";
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
import { format } from "date-fns";
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  Clock3Icon,
  DollarSignIcon,
  InboxIcon,
  SparklesIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { orpc } from "@/utils/orpc";

interface SessionItem {
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
      <Skeleton className="h-52 rounded-3xl" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index.toString()} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Skeleton className="h-[420px] rounded-3xl" />
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Skeleton className="h-[360px] rounded-3xl" />
        <Skeleton className="h-[360px] rounded-3xl" />
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
}: {
  isPending: boolean;
  sessions: SessionItem[];
}) {
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
            New patient requests will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pendingSessions.map((session) => {
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

              <SessionStatusBadge status={session.status} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export const Route = createFileRoute("/doctor/")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: orpc.doctorStats.queryKey(),
        queryFn: () => orpc.doctorStats.call(),
      });

      await context.queryClient.prefetchQuery({
        queryKey: orpc.listDoctorSessions.queryKey(),
        queryFn: () => orpc.listDoctorSessions.call(),
      });
    } catch {
    }
  },
  component: DoctorDashboardRoute,
});

function DoctorDashboardRoute() {
  const user = useUser();

  const statsQuery = useQuery({
    queryKey: orpc.doctorStats.queryKey(),
    queryFn: () => orpc.doctorStats.call(),
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
                Access your doctor dashboard after signing in.
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

  const name = user.user.fullName ?? user.user.username ?? "Doctor";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = statsQuery.data;

  const sessions = (doctorSessionsQuery.data?.sessions as SessionItem[]) ?? [];

  const pendingSessions = sessions.filter(
    (session) =>
      session.status === "requested" || session.status === "rescheduled"
  );

  const totalEarned = Number(stats?.totalEarnedCents ?? 0) / 100;
  const totalSessions = stats?.totalSessions ?? 0;
  const upcomingSessions = stats?.upcomingSessions ?? 0;
  const recentSessions = (stats?.recentSessions ?? []) as SessionItem[];

  const earningsTrend =
    stats?.monthlyEarnings.map(
      (point: { month: string; earnings: number }) => ({
        ...point,
        earnings: point.earnings / 100,
      })
    ) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border shadow-sm">
                <AvatarFallback className="font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Doctor dashboard</Badge>
                  <Badge variant="secondary">Live overview</Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="font-semibold text-4xl tracking-tight">
                    Welcome back, {name}
                  </h1>

                  <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                    Monitor patient requests, manage upcoming appointments,
                    track earnings, and stay on top of your schedule from one
                    unified dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Completed and scheduled consultations"
          icon={<CalendarDaysIcon className="size-5" />}
          title="Total sessions"
          trend="Healthy"
          value={totalSessions.toString()}
        />

        <MetricCard
          description="Revenue generated from completed work"
          icon={<DollarSignIcon className="size-5" />}
          title="Total earned"
          trend="Growing"
          value={`$${totalEarned.toFixed(2)}`}
        />

        <MetricCard
          description="Confirmed future appointments"
          icon={<Clock3Icon className="size-5" />}
          title="Upcoming"
          value={upcomingSessions.toString()}
        />

        <MetricCard
          description="Awaiting review or response"
          icon={<InboxIcon className="size-5" />}
          title="Pending"
          value={pendingSessions.length.toString()}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <TrendingUpIcon className="size-3" />
                  Earnings overview
                </Badge>
              }
              description="Monthly income over the last six months"
              title="Earnings analytics"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            {earningsTrend.length > 0 ? (
              <ChartContainer
                className="h-[360px] w-full"
                config={{
                  earnings: {
                    label: "Earnings",
                    color: "var(--primary)",
                  },
                }}
              >
                <AreaChart
                  accessibilityLayer
                  data={earningsTrend}
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
                    tickFormatter={(value: number) => `$${value.toFixed(0)}`}
                    tickLine={false}
                    tickMargin={10}
                  />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: unknown) =>
                          `$${Number(value).toFixed(2)}`
                        }
                        indicator="line"
                      />
                    }
                    cursor={false}
                  />

                  <Area
                    dataKey="earnings"
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
                  <EmptyTitle>No earnings data yet</EmptyTitle>
                  <EmptyDescription>
                    Earnings analytics will appear once sessions are completed.
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
                <Button
                  render={
                    <Link to="/doctor/availability">
                      Manage
                      <ArrowRightIcon />
                    </Link>
                  }
                  size="sm"
                  variant="secondary"
                />
              }
              description="Patients currently waiting for your response"
              title="Pending requests"
            />
          </CardHeader>

          <Separator />

          <CardContent className="size-full">
            <PendingRequests
              isPending={doctorSessionsQuery.isPending}
              sessions={sessions}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Button
                  render={
                    <Link to="/doctor/sessions">
                      View
                      <ArrowRightIcon />
                    </Link>
                  }
                  size="sm"
                  variant="secondary"
                />
              }
              description="Latest appointment updates and completed sessions"
              title="Recent activity"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentSessions.map((session) => {
                  const start = new Date(session.startAt);
                  const end = new Date(session.endAt);

                  const sessionValue =
                    session.doctorEarnedCents == null
                      ? "--"
                      : `$${(session.doctorEarnedCents / 100).toFixed(2)}`;

                  return (
                    <Card
                      className="rounded-2xl border-border/60 transition-colors hover:bg-muted/30"
                      key={session.id}
                    >
                      <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                            <Clock3Icon className="size-4" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {session.patientId.slice(0, 12)}...
                              </p>
                            </div>

                            <p className="text-muted-foreground text-sm">
                              {format(start, "EEE, MMM d • h:mm a")}
                            </p>

                            <p className="text-muted-foreground text-xs">
                              Ends at {format(end, "h:mm a")}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                          <SessionStatusBadge status={session.status} />

                          <div className="font-semibold text-sm">
                            {sessionValue}
                          </div>
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
