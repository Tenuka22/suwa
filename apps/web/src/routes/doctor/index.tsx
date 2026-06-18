import { Avatar, Button, Card, Chip, Separator } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
      <div className="flex size-full flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="rounded-xl border bg-muted/40 p-3 text-muted-foreground">
          <InboxIcon className="size-5" />
        </div>
        <p className="font-medium text-sm">No pending requests</p>
        <p className="max-w-xs text-muted-foreground text-sm">
          New patient requests will appear here.
        </p>
      </div>
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
            <Card.Content className="flex items-start justify-between gap-4">
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
            </Card.Content>
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
  const navigate = useNavigate();
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
        <Card.Content>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border shadow-sm">
                <Avatar.Fallback className="font-semibold text-lg">
                  {initials}
                </Avatar.Fallback>
              </Avatar>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Chip>Doctor dashboard</Chip>
                  <Chip color="default" variant="soft">
                    Live overview
                  </Chip>
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
        </Card.Content>
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
          <Card.Header>
            <SectionHeader
              action={
                <Chip className="gap-1" color="default" variant="soft">
                  <TrendingUpIcon className="size-3" />
                  Earnings overview
                </Chip>
              }
              description="Monthly income over the last six months"
              title="Earnings analytics"
            />
          </Card.Header>

          <Separator />

          <Card.Content>
            {earningsTrend.length > 0 ? (
              <div className="h-[360px] w-full">
                <AreaChart
                  accessibilityLayer
                  data={earningsTrend}
                  height={360}
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
                    tickFormatter={(value: number) => `$${value.toFixed(0)}`}
                    tickLine={false}
                    tickMargin={10}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!(active && payload?.length)) {
                        return null;
                      }
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                          <p className="text-sm">{`$${Number(payload[0]?.value).toFixed(2)}`}</p>
                        </div>
                      );
                    }}
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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="rounded-xl border bg-muted/40 p-3 text-muted-foreground">
                  <TrendingUpIcon className="size-5" />
                </div>
                <p className="font-medium text-sm">No earnings data yet</p>
                <p className="max-w-xs text-muted-foreground text-sm">
                  Earnings analytics will appear once sessions are completed.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <Card.Header>
            <SectionHeader
              action={
                <Button
                  onPress={() => navigate({ to: "/doctor/availability" })}
                  size="sm"
                  variant="secondary"
                >
                  Manage
                  <ArrowRightIcon />
                </Button>
              }
              description="Patients currently waiting for your response"
              title="Pending requests"
            />
          </Card.Header>

          <Separator />

          <Card.Content className="size-full">
            <PendingRequests sessions={sessions} />
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Card className="rounded-3xl border-border/60">
          <Card.Header>
            <SectionHeader
              action={
                <Button
                  onPress={() => navigate({ to: "/doctor/sessions" })}
                  size="sm"
                  variant="secondary"
                >
                  View
                  <ArrowRightIcon />
                </Button>
              }
              description="Latest appointment updates and completed sessions"
              title="Recent activity"
            />
          </Card.Header>

          <Separator />

          <Card.Content>
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
                      <Card.Content className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                      </Card.Content>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="rounded-xl border bg-muted/40 p-3 text-muted-foreground">
                  <SparklesIcon className="size-5" />
                </div>
                <p className="font-medium text-sm">No recent activity</p>
                <p className="max-w-xs text-muted-foreground text-sm">
                  Your recent sessions and earnings will appear here.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Hospital Affiliations Section */}
      <DoctorHospitalAffiliations />
    </div>
  );
}
