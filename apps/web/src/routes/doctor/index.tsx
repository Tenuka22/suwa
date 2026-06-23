import {
  Avatar,
  Button,
  Chip,
  Input,
  Separator,
  Skeleton,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  CalendarClockIcon,
  ListChecksIcon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";

import {
  DoctorDashboardStats,
  DoctorEarningsChart,
  EmptyState,
} from "@/components/doctors";
import { SessionStatusBadge } from "@/components/session-status-badge";
import { DoctorHospitalAffiliations } from "@/components/tenant/doctor-hospital-affiliations";
import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

interface SessionItem {
  doctorEarnedCents?: number | null;
  endAt: string;
  id: string;
  patientId: string;
  startAt: string;
  status: string;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-52 rounded-3xl" />
      <Separator />
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton className="h-5 w-40" key={i.toString()} />
        ))}
      </div>
      <Separator />
      <Skeleton className="h-[400px] rounded-3xl" />
      <Separator />
    </div>
  );
}

type FilterTab = "all" | "pending" | "completed" | "upcoming";

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

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const name = session?.name ?? session?.email ?? "Doctor";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pendingSessions = sessions.filter(
    (s) => s.status === "requested" || s.status === "rescheduled"
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

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.patientId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const statusCounts = {
    requested: sessions.filter((s) => s.status === "requested").length,
    rescheduled: sessions.filter((s) => s.status === "rescheduled").length,
    confirmed: sessions.filter((s) => s.status === "confirmed").length,
    completed: sessions.filter((s) => s.status === "completed").length,
    cancelled: sessions.filter((s) => s.status === "cancelled").length,
  };

  if (!stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5">
        <Avatar className="size-16" size="lg">
          <Avatar.Fallback className="font-light text-lg">
            {initials}
          </Avatar.Fallback>
        </Avatar>

        <div className="flex-1 pb-2">
          <div className="flex items-center gap-3">
            <PageTitle>Welcome back, {name}</PageTitle>
            <Chip color="accent" variant="soft">
              Doctor dashboard
            </Chip>
          </div>

          <BodyText className="max-w-2xl">
            Monitor patient requests, manage upcoming appointments, track
            earnings, and stay on top of your schedule.
          </BodyText>
        </div>

        <div className="flex items-center gap-2 pb-2">
          <Button
            onPress={() => navigate({ to: "/doctor/availability" })}
            size="sm"
            variant="outline"
          >
            <CalendarClockIcon className="size-4" />
            Availability
          </Button>
          <Button
            onPress={() => navigate({ to: "/doctor/sessions" })}
            size="sm"
          >
            <ListChecksIcon className="size-4" />
            All sessions
          </Button>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <DoctorDashboardStats
          earned={totalEarned}
          pendingSessions={pendingSessions.length}
          totalSessions={totalSessions}
          upcomingSessions={upcomingSessions}
        />
        {pendingSessions.length > 0 && (
          <Chip className="self-start" color="warning" variant="soft">
            {pendingSessions.length} awaiting review
          </Chip>
        )}
      </section>

      <Separator />

      <Tabs
        onSelectionChange={(v) => setActiveTab(v as FilterTab)}
        selectedKey={activeTab}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Dashboard views">
            <Tabs.Tab id="all">
              Overview
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="pending">
              Pending
              {statusCounts.requested + statusCounts.rescheduled > 0 && (
                <Chip className="ml-1.5" color="warning" variant="soft">
                  {statusCounts.requested + statusCounts.rescheduled}
                </Chip>
              )}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="upcoming">
              Upcoming
              {statusCounts.confirmed > 0 && (
                <Chip className="ml-1.5" color="accent" variant="soft">
                  {statusCounts.confirmed}
                </Chip>
              )}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="completed">
              Completed
              {statusCounts.completed > 0 && (
                <Chip className="ml-1.5" color="success" variant="soft">
                  {statusCounts.completed}
                </Chip>
              )}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="flex flex-col gap-6 pt-6" id="all">
          <section className="flex flex-col gap-3">
            <div>
              <PageTitle>Earnings</PageTitle>
              <p className="font-light text-foreground/60 text-sm">
                Monthly income over the last six months
              </p>
            </div>
            {earningsTrend.length > 0 ? (
              <DoctorEarningsChart data={earningsTrend} />
            ) : (
              <EmptyState
                description="Earnings analytics will appear once sessions are completed."
                title="No earnings data yet"
              />
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <PageTitle>Pending requests</PageTitle>
                <p className="font-light text-foreground/60 text-sm">
                  Patients currently waiting for your response
                </p>
              </div>
              <Button
                onPress={() => navigate({ to: "/doctor/availability" })}
                size="sm"
                variant="secondary"
              >
                Manage
                <ArrowRightIcon />
              </Button>
            </div>
            {pendingSessions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pendingSessions.map((s) => {
                  const start = new Date(s.startAt);
                  const end = new Date(s.endAt);
                  return (
                    <div
                      className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3"
                      key={s.id}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-light text-sm">
                          {s.patientId.slice(0, 12)}...
                        </p>
                        <p className="text-foreground/60 text-sm">
                          {format(start, "EEE, MMM d")}
                        </p>
                        <p className="text-foreground/60 text-xs">
                          {format(start, "h:mm a")} - {format(end, "h:mm a")}
                        </p>
                      </div>
                      <SessionStatusBadge status={s.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                description="New patient requests will appear here."
                title="No pending requests"
              />
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <PageTitle>Recent activity</PageTitle>
                <p className="font-light text-foreground/60 text-sm">
                  Latest appointment updates and completed sessions
                </p>
              </div>
              <Button
                onPress={() => navigate({ to: "/doctor/sessions" })}
                size="sm"
                variant="secondary"
              >
                View all
                <ArrowRightIcon />
              </Button>
            </div>
            {recentSessions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recentSessions.map((s) => {
                  const start = new Date(s.startAt);
                  const end = new Date(s.endAt);
                  const sessionValue =
                    s.doctorEarnedCents == null
                      ? "--"
                      : `$${(s.doctorEarnedCents / 100).toFixed(2)}`;
                  return (
                    <div
                      className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3"
                      key={s.id}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-light text-sm">
                          {s.patientId.slice(0, 12)}...
                        </p>
                        <p className="text-foreground/60 text-sm">
                          {format(start, "EEE, MMM d h:mm a")}
                        </p>
                        <p className="text-foreground/60 text-xs">
                          Ends at {format(end, "h:mm a")}
                        </p>
                      </div>
                      <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                        <SessionStatusBadge status={s.status} />
                        <span className="font-medium text-sm tabular-nums">
                          {sessionValue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                description="Your recent sessions and earnings will appear here."
                title="No recent activity"
              />
            )}
          </section>
        </Tabs.Panel>

        <Tabs.Panel className="flex flex-col gap-4 pt-6" id="pending">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/60" />
              <Input
                className="h-10 rounded-full border-none bg-foreground/5 pl-10 focus-visible:ring-1 focus-visible:ring-primary/50"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient ID..."
                value={searchQuery}
              />
            </div>
            <ToggleButtonGroup
              isDetached
              onSelectionChange={(keys) => {
                const key = [...keys][0] as string | undefined;
                if (key) {
                  setStatusFilter(key);
                }
              }}
              selectedKeys={[statusFilter]}
              selectionMode="single"
            >
              <ToggleButton id="all">All</ToggleButton>
              <ToggleButton id="requested">Requested</ToggleButton>
              <ToggleButton id="rescheduled">Rescheduled</ToggleButton>
            </ToggleButtonGroup>
          </div>
          {filteredSessions.filter(
            (s) => s.status === "requested" || s.status === "rescheduled"
          ).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredSessions
                .filter(
                  (s) => s.status === "requested" || s.status === "rescheduled"
                )
                .map((s) => {
                  const start = new Date(s.startAt);
                  const end = new Date(s.endAt);
                  return (
                    <div
                      className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3"
                      key={s.id}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-light text-sm">
                          {s.patientId.slice(0, 12)}...
                        </p>
                        <p className="text-foreground/60 text-sm">
                          {format(start, "EEE, MMM d")}
                        </p>
                        <p className="text-foreground/60 text-xs">
                          {format(start, "h:mm a")} - {format(end, "h:mm a")}
                        </p>
                      </div>
                      <SessionStatusBadge status={s.status} />
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState
              description={
                searchQuery
                  ? "Try a different search term or clear your filters."
                  : "All patient requests have been reviewed. New pending requests will appear here."
              }
              title={searchQuery ? "No results found" : "All caught up"}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel className="flex flex-col gap-4 pt-6" id="upcoming">
          {sessions.filter((s) => s.status === "confirmed").length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions
                .filter((s) => s.status === "confirmed")
                .map((s) => {
                  const start = new Date(s.startAt);
                  const end = new Date(s.endAt);
                  return (
                    <div
                      className="rounded-xl border border-border px-4 py-3"
                      key={s.id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="font-light text-sm">
                            {s.patientId.slice(0, 12)}...
                          </p>
                          <p className="text-foreground/60 text-sm">
                            {format(start, "EEE, MMM d")}
                          </p>
                          <p className="text-foreground/60 text-xs">
                            {format(start, "h:mm a")} -{format(end, "h:mm a")}
                          </p>
                        </div>
                        <SessionStatusBadge status={s.status} />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState
              description="Confirmed appointments will appear here once patients book sessions with you."
              title="No upcoming sessions"
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel className="flex flex-col gap-4 pt-6" id="completed">
          {sessions.filter((s) => s.status === "completed").length > 0 ? (
            <div className="flex flex-col gap-2">
              {sessions
                .filter((s) => s.status === "completed")
                .map((s) => {
                  const start = new Date(s.startAt);
                  const end = new Date(s.endAt);
                  const sessionValue =
                    s.doctorEarnedCents == null
                      ? "--"
                      : `$${(s.doctorEarnedCents / 100).toFixed(2)}`;
                  return (
                    <div
                      className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3"
                      key={s.id}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-light text-sm">
                          {s.patientId.slice(0, 12)}...
                        </p>
                        <p className="text-foreground/60 text-sm">
                          {format(start, "EEE, MMM d h:mm a")}
                        </p>
                        <p className="text-foreground/60 text-xs">
                          Ends at {format(end, "h:mm a")}
                        </p>
                      </div>
                      <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                        <SessionStatusBadge status={s.status} />
                        <span className="font-medium text-sm tabular-nums">
                          {sessionValue}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState
              description="Completed sessions will appear here with their earnings breakdown."
              title="No completed sessions"
            />
          )}
        </Tabs.Panel>
      </Tabs>

      <DoctorHospitalAffiliations />
    </div>
  );
}
