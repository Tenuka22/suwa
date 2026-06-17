import { Avatar, AvatarFallback } from "@suwa/ui/components/avatar";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardHeader } from "@suwa/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@suwa/ui/components/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@suwa/ui/components/empty";
import { Separator } from "@suwa/ui/components/separator";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  Clock3Icon,
  DollarSignIcon,
  InboxIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { SessionStatusBadge } from "@/components/session-status-badge";
import { DoctorHospitalAffiliations } from "@/components/tenant/doctor-hospital-affiliations";
import { orpc } from "@/utils/orpc";

interface SessionItem {
  doctorEarnedCents?: number | null;
  endAt: string;
  id: string;
  patientId: string;
  startAt: string;
  status: string;
}

function PendingRequests({ sessions }: { sessions: SessionItem[] }) {
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
    const [stats, sessions] = await Promise.all([
      context.queryClient.ensureQueryData(orpc.doctorStats.queryOptions()),
      context.queryClient.ensureQueryData(
        orpc.listDoctorSessions.queryOptions()
      ),
    ]);
    return { stats, sessions };
  },
  component: DoctorDashboardRoute,
});

function DoctorDashboardRoute() {
  const { session } = Route.useRouteContext();
  const { stats, sessions: sessionsData } = Route.useLoaderData();
  const sessions = (sessionsData?.sessions as SessionItem[]) ?? [];

  const name = session?.name ?? session?.email ?? "Doctor";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Doctor dashboard</Badge>
                  <Badge variant="secondary">Live overview</Badge>
                </div>

                <div className="flex flex-col gap-2">
                  <h1 className="font-semibold text-lg tracking-tight">
                    Welcome back, {name}
                  </h1>

                  <p className="max-w-2xl text-muted-foreground text-sm">
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
            <PendingRequests sessions={sessions} />
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
                      className="rounded-2xl border-border/60 transition-colors duration-200 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary"
                      key={session.id}
                    >
                      <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                            <Clock3Icon className="size-4" />
                          </div>

                          <div className="flex flex-col gap-1">
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

      {/* Hospital Affiliations Section */}
      <DoctorHospitalAffiliations />
    </div>
  );
}
