import { buildHeadFromKey } from "../../__root";
import { Avatar, AvatarFallback } from "@suwa/ui/components/avatar";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@suwa/ui/components/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@suwa/ui/components/table";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addMinutes, format, isWithinInterval, subMinutes } from "date-fns";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  Clock3Icon,
  InboxIcon,
  TrendingUpIcon,
  VideoIcon,
  XCircleIcon,
} from "lucide-react";
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
        <Clock3Icon className="size-3" />
        {status === "requested" ? "Requested" : "Rescheduled"}
      </Badge>
    );
  }

  if (status === "approved" || status === "attended") {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle2Icon className="size-3" />
        {status === "approved" ? "Approved" : "Attended"}
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="destructive">
      <XCircleIcon className="size-3" />
      Failed
    </Badge>
  );
}

function PatientCell({ patientId }: { patientId: string }) {
  const initials = patientId.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-sm">{patientId.slice(0, 12)}...</span>
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

  if (pendingSessions.length === 0) {
    return (
      <Empty>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingSessions.map((session) => {
          const start = new Date(session.startAt);
          const end = new Date(session.endAt);

          return (
            <TableRow key={session.id}>
              <TableCell>
                <PatientCell patientId={session.patientId} />
              </TableCell>
              <TableCell>{format(start, "MMM d, yyyy")}</TableCell>
              <TableCell>
                {format(start, "h:mm a")} - {format(end, "h:mm a")}
              </TableCell>
              <TableCell>
                <SessionStatusBadge status={session.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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

  const pendingSessions = sessions.filter(
    (s) => s.status === "requested" || s.status === "rescheduled"
  );

  const upcomingSessions = sessions.filter((session) => {
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

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:p-6">
          <Badge className="h-7 w-fit rounded-full bg-primary px-3 text-primary-foreground">
            Sessions dashboard
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
              Sessions overview
            </h1>
            <p className="max-w-[58ch] text-base text-muted-foreground leading-7">
              Track all your patient sessions at a glance. Monitor requests,
              review completed appointments, and analyze session trends over time.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Total sessions</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">{totalSessions}</CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <CalendarDaysIcon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">All sessions across all statuses</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Today</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">{todaySessions}</CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <CalendarCheckIcon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">Sessions scheduled for today</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Pending</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">{pendingCount}</CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <InboxIcon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">Awaiting your review or response</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Completed</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">{attendedCount}</CardTitle>
                <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                  <CheckCircle2Icon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">Successfully completed consultations</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="h-auto gap-1 border-none bg-transparent p-0">
            <TabsTrigger
              className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
              value="pending"
            >
              <InboxIcon className="size-3.5" />
              Pending ({pendingSessions.length})
            </TabsTrigger>
            <TabsTrigger
              className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
              value="upcoming"
            >
              <VideoIcon className="size-3.5" />
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger
              className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
              value="recent"
            >
              <CalendarClockIcon className="size-3.5" />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger
              className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
              value="analytics"
            >
              <TrendingUpIcon className="size-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Pending requests</CardTitle>
                <CardDescription>Sessions awaiting your response</CardDescription>
              </CardHeader>
              <CardContent>
                <PendingRequests
                  refetch={() => {
                    window.location.reload();
                  }}
                  sessions={sessions}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Upcoming sessions</CardTitle>
                <CardDescription>Approved sessions ready for you to join</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <VideoIcon />
                      </EmptyMedia>
                      <EmptyTitle>No upcoming sessions</EmptyTitle>
                      <EmptyDescription>
                        Approved sessions that are ready to join will appear here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingSessions.map((session) => {
                        const start = new Date(session.startAt);
                        const end = new Date(session.endAt);

                        return (
                          <TableRow key={session.id}>
                            <TableCell>
                              <PatientCell patientId={session.patientId} />
                            </TableCell>
                            <TableCell>{format(start, "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              {format(start, "h:mm a")} - {format(end, "h:mm a")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                className="h-10 gap-1.5 rounded-full bg-primary px-4 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90"
                                onClick={() => {
                                  navigate({
                                    to: `/doctor/sessions/${session.id}`,
                                  });
                                }}
                                size="sm"
                              >
                                <VideoIcon className="size-3.5" />
                                Join
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest appointment updates and completed sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CheckCircle2Icon />
                      </EmptyMedia>
                      <EmptyTitle>No recent activity</EmptyTitle>
                      <EmptyDescription>
                        Your recent sessions and earnings will appear here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSessions.map((session) => {
                        const start = new Date(session.startAt);
                        const end = new Date(session.endAt);
                        const isValidStart = !Number.isNaN(start.getTime());
                        const isValidEnd = !Number.isNaN(end.getTime());

                        const sessionValue =
                          session.doctorEarnedCents == null
                            ? "--"
                            : `$${(session.doctorEarnedCents / 100).toFixed(2)}`;

                        return (
                          <TableRow key={session.id}>
                            <TableCell>
                              <PatientCell patientId={session.patientId} />
                            </TableCell>
                            <TableCell>
                              {isValidStart ? format(start, "MMM d, yyyy") : "--"}
                            </TableCell>
                            <TableCell>
                              {isValidStart && isValidEnd
                                ? `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
                                : "--"}
                            </TableCell>
                            <TableCell>
                              <SessionStatusBadge status={session.status} />
                            </TableCell>
                            <TableCell className="font-medium">{sessionValue}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Session analytics</CardTitle>
                    <CardDescription>Monthly session volume over the last six months</CardDescription>
                  </div>
                  <Badge className="gap-1" variant="secondary">
                    <TrendingUpIcon className="size-3" />
                    Sessions trend
                  </Badge>
                </div>
              </CardHeader>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
