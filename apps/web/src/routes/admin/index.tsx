import { Avatar, Button, Chip, Separator } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  InboxIcon,
  ListChecksIcon,
  ShieldIcon,
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

import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-foreground/50" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-foreground/60 text-sm">{label}</span>
    </div>
  );
}

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

  const pendingDoctors = stats?.pendingDoctors ?? 0;
  const approvedDoctors = stats?.approvedDoctors ?? 0;
  const totalSessions = stats?.totalSessions ?? 0;
  const totalPatients = stats?.totalPatients ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-16" size="lg">
            <Avatar.Fallback className="font-light text-lg">
              <ShieldIcon className="size-6" />
            </Avatar.Fallback>
          </Avatar>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                Admin console
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <ShieldIcon className="size-3" />
                </div>
                Dashboard
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Monitor platform activity, manage doctor registrations, and
              oversee all sessions from one unified dashboard.
            </BodyText>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Button
              onPress={() =>
                navigate({
                  to: "/admin/doc-requests",
                  search: { page: 1, query: "" },
                })
              }
              size="sm"
              variant="outline"
            >
              <InboxIcon className="size-4" />
              Requests
            </Button>
            <Button
              onPress={() =>
                navigate({ to: "/admin/sessions", search: { page: 1 } })
              }
              size="sm"
            >
              <ListChecksIcon className="size-4" />
              All sessions
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={InboxIcon}
            label="pending doctors"
            value={pendingDoctors.toString()}
          />
          <StatItem
            icon={CheckCircle2Icon}
            label="approved doctors"
            value={approvedDoctors.toString()}
          />
          <StatItem
            icon={CalendarDaysIcon}
            label="total sessions"
            value={totalSessions.toString()}
          />
          <StatItem
            icon={UserRoundIcon}
            label="total patients"
            value={totalPatients.toString()}
          />
          {pendingDoctors > 0 && (
            <Chip color="warning" variant="soft">
              <div className="flex items-center justify-center">
                <InboxIcon className="size-3" />
              </div>
              {pendingDoctors} awaiting review
            </Chip>
          )}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Platform activity</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Daily session volume over the last seven days
          </p>
        </div>

        {sessionsByDay.length > 0 ? (
          <div className="h-[340px] w-full">
            <AreaChart
              accessibilityLayer
              data={sessionsByDay}
              height={340}
              margin={{ left: 8, right: 8 }}
              width="100%"
            >
              <CartesianGrid vertical={false} />

              <XAxis
                axisLine={false}
                dataKey="day"
                tickFormatter={(value: string) => {
                  const date = new Date(value);
                  if (Number.isNaN(date.getTime())) return value;
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
                    <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
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
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="font-light text-sm">No activity data yet</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Session activity will appear once patients start booking.
            </p>
          </div>
        )}
      </section>

      <Separator />
    </div>
  );
}
