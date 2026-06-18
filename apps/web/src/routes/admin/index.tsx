import { Button, Card, Chip, Separator } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  InboxIcon,
  ShieldIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UserRoundIcon,
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
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/")({
  loaderDeps: () => ({}),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData(orpc.stats.queryOptions()),
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const navigate = useNavigate();
  const stats = Route.useLoaderData();
  const sessionsByDay = stats?.sessionsByDay ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <Card.Content>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
              <ShieldIcon className="size-8" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Chip variant="secondary">Admin console</Chip>
                <Chip color="default" variant="soft">
                  Live overview
                </Chip>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="font-semibold text-lg tracking-tight">
                  Welcome back
                </h1>
                <p className="max-w-2xl text-muted-foreground text-sm">
                  Monitor platform activity, manage doctor registrations, and
                  oversee all sessions from one unified dashboard.
                </p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Awaiting review or approval"
          icon={<InboxIcon className="size-5" />}
          title="Pending doctors"
          trend="Review"
          value={String(stats?.pendingDoctors ?? 0)}
        />
        <MetricCard
          description="Successfully onboarded physicians"
          icon={<CheckCircle2Icon className="size-5" />}
          title="Approved doctors"
          trend="Active"
          value={String(stats?.approvedDoctors ?? 0)}
        />
        <MetricCard
          description="All consultations across the platform"
          icon={<CalendarDaysIcon className="size-5" />}
          title="Total sessions"
          trend="All time"
          value={String(stats?.totalSessions ?? 0)}
        />
        <MetricCard
          description="Registered patients on the platform"
          icon={<UserRoundIcon className="size-5" />}
          title="Total patients"
          value={String(stats?.totalPatients ?? 0)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-3xl border-border/60">
          <Card.Header>
            <SectionHeader
              action={
                <Chip className="gap-1" color="default" variant="soft">
                  <TrendingUpIcon className="size-3" />
                  Session trend
                </Chip>
              }
              description="Daily session volume over the last seven days"
              title="Platform activity"
            />
          </Card.Header>

          <Separator />

          <Card.Content>
            {sessionsByDay.length > 0 ? (
              <div className="h-[360px] w-full">
                <AreaChart
                  accessibilityLayer
                  data={sessionsByDay}
                  margin={{ left: 8, right: 8 }}
                >
                  <CartesianGrid vertical={false} />

                  <XAxis
                    axisLine={false}
                    dataKey="day"
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      return format(date, "MMM d");
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
                      const value = Number(payload[0].value);
                      return (
                        <div className="rounded-lg border bg-background px-3 py-1.5 shadow-sm">
                          <p className="text-sm">{`${value} session${value === 1 ? "" : "s"}`}</p>
                        </div>
                      );
                    }}
                    cursor={false}
                  />

                  <Area
                    dataKey="count"
                    fill="var(--primary)"
                    fillOpacity={0.15}
                    stroke="var(--primary)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
                  <TrendingUpIcon className="size-6" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="font-medium text-sm">No activity data yet</p>
                  <p className="max-w-sm text-muted-foreground text-xs">
                    Session activity will appear once patients start booking.
                  </p>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <Card.Header>
            <SectionHeader
              action={
                <Chip className="gap-1" color="default" variant="soft">
                  <StethoscopeIcon className="size-3" />
                  Quick actions
                </Chip>
              }
              description="Manage platform operations"
              title="Admin tools"
            />
          </Card.Header>

          <Separator />

          <Card.Content className="flex flex-col gap-3">
            <Button
              className="justify-between rounded-2xl border-border/60 px-5 py-6 text-sm transition-colors hover:bg-muted/30"
              onPress={() =>
                navigate({
                  to: "/admin/doc-requests",
                  search: { page: 1, query: "" },
                })
              }
              size="sm"
              variant="outline"
            >
              Review doctor requests
              <ArrowRightIcon className="size-4" />
            </Button>

            <Button
              className="justify-between rounded-2xl border-border/60 px-5 py-6 text-sm transition-colors hover:bg-muted/30"
              onPress={() =>
                navigate({
                  to: "/admin/doctors",
                  search: { page: 1, query: "" },
                })
              }
              size="sm"
              variant="outline"
            >
              Manage approved doctors
              <ArrowRightIcon className="size-4" />
            </Button>

            <Button
              className="justify-between rounded-2xl border-border/60 px-5 py-6 text-sm transition-colors hover:bg-muted/30"
              onPress={() => navigate({ to: "/admin/session" })}
              size="sm"
              variant="outline"
            >
              Create test session
              <ArrowRightIcon className="size-4" />
            </Button>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
