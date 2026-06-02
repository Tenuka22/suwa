import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
  CalendarDaysIcon,
  CheckCircle2Icon,
  InboxIcon,
  ShieldIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UserRoundIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

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

export const Route = createFileRoute("/admin/")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: orpc.stats.queryKey(),
        queryFn: () => orpc.stats.call(),
      });
    } catch {
    }
  },
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const user = useUser();

  const statsQuery = useQuery({
    queryKey: orpc.stats.queryKey(),
    queryFn: () => orpc.stats.call(),
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
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                Access the admin panel after signing in.
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

  if (getMetadataRole(user.user?.publicMetadata) !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <CardTitle>Unauthorized</CardTitle>
              <CardDescription>You do not have admin access.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const name = user.user.fullName ?? user.user.username ?? "Admin";
  const stats = statsQuery.data;
  const sessionsByDay = stats?.sessionsByDay ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
                <ShieldIcon className="size-8" />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Admin console</Badge>
                  <Badge variant="secondary">Live overview</Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="font-semibold text-4xl tracking-tight">
                    Welcome back, {name}
                  </h1>
                  <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                    Monitor platform activity, manage doctor registrations, and
                    oversee all sessions from one unified dashboard.
                  </p>
                </div>
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
