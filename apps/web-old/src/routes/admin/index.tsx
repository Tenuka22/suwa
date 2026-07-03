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
import { createFileRoute } from "@tanstack/react-router";
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { buildHeadFromKey } from "../__root";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/")({
  head: () => buildHeadFromKey("web:admin:index"),
  loaderDeps: () => ({}),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData(orpc.stats.queryOptions()),
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const stats = Route.useLoaderData();
  const sessionsByDay = stats?.sessionsByDay ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
              <ShieldIcon className="size-8" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Admin console</Badge>
                <Badge variant="secondary">Live overview</Badge>
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
        </CardContent>
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
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <TrendingUpIcon className="size-3" />
                  Session trend
                </Badge>
              }
              description="Daily session volume over the last seven days"
              title="Platform activity"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            {sessionsByDay.length > 0 ? (
              <ChartContainer
                className="h-[360px] w-full"
                config={{
                  sessions: {
                    label: "Sessions",
                    color: "var(--primary)",
                  },
                }}
              >
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
                    dataKey="count"
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
                  <EmptyTitle>No activity data yet</EmptyTitle>
                  <EmptyDescription>
                    Session activity will appear once patients start booking.
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
                  <StethoscopeIcon className="size-3" />
                  Quick actions
                </Badge>
              }
              description="Manage platform operations"
              title="Admin tools"
            />
          </CardHeader>

          <Separator />

          <CardContent className="flex flex-col gap-3">
            <Button
              className="justify-between rounded-2xl border-border/60 px-5 py-6 text-sm transition-colors hover:bg-muted/30"
              render={
                <a href="/admin/doc-requests?page=1&query=">
                  Review doctor requests
                  <ArrowRightIcon className="size-4" />
                </a>
              }
              variant="outline"
            />

            <Button
              className="justify-between rounded-2xl border-border/60 px-5 py-6 text-sm transition-colors hover:bg-muted/30"
              render={
                <a href="/admin/doctors?page=1&query=">
                  Manage approved doctors
                  <ArrowRightIcon className="size-4" />
                </a>
              }
              variant="outline"
            />

            <Button
              className="justify-between rounded-2xl border-border/60 px-5 py-6 text-sm transition-colors hover:bg-muted/30"
              render={
                <a href="/admin/session">
                  Create test session
                  <ArrowRightIcon className="size-4" />
                </a>
              }
              variant="outline"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
