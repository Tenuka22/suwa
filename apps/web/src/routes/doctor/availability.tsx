import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Label } from "@zen-doc/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Separator } from "@zen-doc/ui/components/separator";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { Switch } from "@zen-doc/ui/components/switch";
import {
  CalendarDaysIcon,
  Clock3Icon,
  ClockIcon,
  InboxIcon,
  Loader2,
  StethoscopeIcon,
  Trash2,
  TrendingUpIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

interface AvailabilitySlot {
  dayOfWeek: number;
  endTime: string;
  id?: string;
  isAvailable: boolean;
  startTime: string;
}

const timeToMinutes = (time: string) => {
  const parts = time.split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
};

const getHoursForSlot = (slot: AvailabilitySlot) =>
  (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)) / 60;

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index.toString()} />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-3xl" />
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

export const Route = createFileRoute("/doctor/availability")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: orpc.availabilityStats.queryKey(),
        queryFn: () => orpc.availabilityStats.call(),
      });
    } catch {
      // noop
    }
  },
  component: DoctorAvailabilityRoute,
});

function DoctorAvailabilityRoute() {
  const user = useUser();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const statsQuery = useQuery({
    queryKey: orpc.availabilityStats.queryKey(),
    queryFn: () => orpc.availabilityStats.call(),
  });

  const availabilityQuery = useQuery({
    queryKey: orpc.getWeeklyAvailability.queryKey(),
    queryFn: () => orpc.getWeeklyAvailability.call(),
  });

  const sessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
  });

  useEffect(() => {
    if (availabilityQuery.data?.slots) {
      if (availabilityQuery.data.slots.length > 0) {
        setSlots(availabilityQuery.data.slots as AvailabilitySlot[]);
        setHasChanges(false);
        return;
      }

      setSlots([
        {
          dayOfWeek: 1,
          endTime: "17:00",
          isAvailable: true,
          startTime: "09:00",
        },
      ]);
    }
  }, [availabilityQuery.data]);

  const saveMutation = useMutation(
    orpc.saveWeeklyAvailability.mutationOptions({
      onError: (error: Error) => {
        toast.error(error instanceof Error ? error.message : "Failed to save");
      },
      onSuccess: () => {
        toast.success("Availability saved");
        setHasChanges(false);
      },
    })
  );

  const addSlotForDay = (dayOfWeek: number) => {
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const lastSlot = daySlots[daySlots.length - 1];

    let newStart = "09:00";
    let newEnd = "10:00";

    if (lastSlot) {
      const lastEndMinutes = timeToMinutes(lastSlot.endTime);
      if (lastEndMinutes >= 1410) {
        toast.error("No more space for slots today");
        return;
      }
      const nextStartMin = lastEndMinutes;
      const nextEndMin = Math.min(nextStartMin + 60, 1440);

      const format = (m: number) => {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      };

      newStart = format(nextStartMin);
      newEnd = format(nextEndMin);
    }

    setSlots((currentSlots) => [
      ...currentSlots,
      {
        dayOfWeek,
        endTime: newEnd,
        id: crypto.randomUUID(),
        isAvailable: true,
        startTime: newStart,
      },
    ]);
    setHasChanges(true);
  };

  const removeSlot = (index: number) => {
    setSlots((currentSlots) => currentSlots.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateSlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: string | boolean | null
  ) => {
    setSlots((currentSlots) => {
      const next = [...currentSlots];
      const existing = next[index] as AvailabilitySlot | undefined;
      if (!existing) {
        return currentSlots;
      }
      const slot: AvailabilitySlot = { ...existing };

      if (field === "startTime") {
        slot.startTime = value as string;
        if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
          const startMin = timeToMinutes(slot.startTime);
          const endMin = Math.min(startMin + 30, 1440);
          const h = Math.floor(endMin / 60);
          const m = endMin % 60;
          slot.endTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      } else if (field === "endTime") {
        slot.endTime = value as string;
      } else if (field === "isAvailable") {
        slot.isAvailable = value as boolean;
      }

      const otherDaySlots = next.filter(
        (s, i) => s.dayOfWeek === slot.dayOfWeek && i !== index
      );
      const s1 = timeToMinutes(slot.startTime);
      const e1 = timeToMinutes(slot.endTime);

      const hasOverlap = otherDaySlots.some((s) => {
        const s2 = timeToMinutes(s.startTime);
        const e2 = timeToMinutes(s.endTime);
        return s1 < e2 && e1 > s2;
      });

      if (hasOverlap) {
        toast.error("Slots cannot overlap");
        return currentSlots;
      }

      next[index] = slot;
      return next;
    });
    setHasChanges(true);
  };

  const toggleDay = (dayOfWeek: number, isAvailable: boolean) => {
    setSlots((currentSlots) => {
      const daySlots = currentSlots.filter((s) => s.dayOfWeek === dayOfWeek);
      if (daySlots.length === 0 && isAvailable) {
        return [
          ...currentSlots,
          {
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
            id: crypto.randomUUID(),
          },
        ];
      }
      return currentSlots.map((slot) =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, isAvailable } : slot
      );
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate({ slots: slots.filter((slot) => slot.isAvailable) });
  };

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
                Manage your availability after signing in.
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

  const availableDays = new Set(
    slots.filter((slot) => slot.isAvailable).map((slot) => slot.dayOfWeek)
  );
  const totalHours = slots
    .filter((slot) => slot.isAvailable)
    .reduce((acc, slot) => acc + getHoursForSlot(slot), 0);

  const pendingSessions = (sessionsQuery.data?.sessions ?? []).filter(
    (session: { status: string }) =>
      session.status === "requested" || session.status === "rescheduled"
  );

  const stats = statsQuery.data;
  const chartData =
    stats?.hoursByDay.map((d: { day: number; hours: number }) => ({
      day: DAYS[d.day]?.slice(0, 3) ?? "",
      hours: d.hours,
    })) ?? [];

  const dayHoursMap = new Map<number, number>();
  for (const slot of slots.filter((s) => s.isAvailable)) {
    dayHoursMap.set(
      slot.dayOfWeek,
      (dayHoursMap.get(slot.dayOfWeek) ?? 0) + getHoursForSlot(slot)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Availability dashboard</Badge>
              <Badge variant="secondary">Schedule overview</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Weekly availability
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                Set your weekly working hours so patients can book sessions that
                fit your schedule. Days and slots can be individually toggled.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Days you're accepting sessions"
          icon={<CalendarDaysIcon className="size-5" />}
          title="Active days"
          trend="of 7"
          value={availableDays.size.toString()}
        />

        <MetricCard
          description="Total availability per week"
          icon={<Clock3Icon className="size-5" />}
          title="Weekly hours"
          value={totalHours.toFixed(1)}
        />

        <MetricCard
          description="Time slots configured"
          icon={<ClockIcon className="size-5" />}
          title="Total slots"
          value={slots.filter((s) => s.isAvailable).length.toString()}
        />

        <MetricCard
          description="Awaiting your response"
          icon={<InboxIcon className="size-5" />}
          title="Pending"
          value={pendingSessions.length.toString()}
        />
      </section>

      {chartData.some((d: { hours: number }) => d.hours > 0) ? (
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <TrendingUpIcon className="size-3" />
                  Hours breakdown
                </Badge>
              }
              description="Available hours per day of the week"
              title="Weekly distribution"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            <ChartContainer
              className="h-[300px] w-full"
              config={{
                hours: {
                  label: "Hours",
                  color: "var(--primary)",
                },
              }}
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 8, right: 8, top: 20 }}
              >
                <CartesianGrid vertical={false} />

                <XAxis
                  axisLine={false}
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                />

                <YAxis
                  axisLine={false}
                  tickFormatter={(value: number) => `${value}h`}
                  tickLine={false}
                  tickMargin={10}
                />

                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: unknown) =>
                        `${Number(value).toFixed(1)} hours`
                      }
                      indicator="dot"
                    />
                  }
                  cursor={false}
                />

                <Bar
                  dataKey="hours"
                  fill="var(--primary)"
                  fillOpacity={0.2}
                  radius={[6, 6, 0, 0]}
                  stroke="var(--primary)"
                  strokeWidth={2}
                >
                  <LabelList
                    dataKey="hours"
                    fill="var(--primary)"
                    fontSize={11}
                    offset={4}
                    position="top"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <SectionHeader
            action={
              <Button
                className="text-xs"
                disabled={
                  saveMutation.isPending ||
                  slots.filter((slot) => slot.isAvailable).length === 0 ||
                  !hasChanges
                }
                onClick={handleSave}
                size="sm"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            }
            description="Configure time windows for each day of the week"
            title="Schedule editor"
          />
        </CardHeader>

        <Separator />

        <CardContent>
          {availabilityQuery.isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {DAYS.map((dayName, dayOfWeek) => {
                const daySlots = slots.filter(
                  (slot) => slot.dayOfWeek === dayOfWeek
                );
                const isDayAvailable = daySlots.some(
                  (slot) => slot.isAvailable
                );
                const dayHours = daySlots.reduce(
                  (acc, slot) => acc + getHoursForSlot(slot),
                  0
                );

                return (
                  <Card
                    className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm"
                    key={dayName}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {dayName}
                            </CardTitle>
                            <Badge
                              className={
                                isDayAvailable
                                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }
                              variant="outline"
                            >
                              {isDayAvailable ? "Available" : "Off"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {daySlots.length === 0
                              ? "No hours set"
                              : `${daySlots.length} slot${daySlots.length === 1 ? "" : "s"} · ${dayHours.toFixed(1)}h`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5">
                            <Switch
                              checked={isDayAvailable}
                              className="h-4 w-7"
                              onCheckedChange={(checked) =>
                                toggleDay(dayOfWeek, checked)
                              }
                            />
                            <Label className="text-muted-foreground text-xs">
                              {isDayAvailable ? "Working" : "Day off"}
                            </Label>
                          </div>
                          <Button
                            className="text-xs"
                            onClick={() => addSlotForDay(dayOfWeek)}
                            size="sm"
                            variant="outline"
                          >
                            Add Slot
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {daySlots.length === 0 ? (
                        <div className="rounded-lg border border-border/70 border-dashed bg-muted/20 px-4 py-6 text-center text-muted-foreground text-sm">
                          Add a slot for {dayName}.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {daySlots.map((slot, slotOffset) => {
                            const slotIndex = slots.indexOf(slot);
                            const validEndOptions = TIME_OPTIONS.filter(
                              (t) =>
                                timeToMinutes(t) > timeToMinutes(slot.startTime)
                            );

                            return (
                              <div
                                className="rounded-lg border border-border/50 bg-muted/30 p-3"
                                key={
                                  slot.id ??
                                  `${dayName}-${slot.startTime}-${slot.endTime}-${slotOffset}`
                                }
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <ClockIcon className="size-3.5 text-muted-foreground" />
                                    <span className="font-medium text-xs">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                  <Button
                                    className="h-8 w-8"
                                    onClick={() => removeSlot(slotIndex)}
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs">
                                      Start
                                    </Label>
                                    <Select
                                      onValueChange={(value) =>
                                        updateSlot(
                                          slotIndex,
                                          "startTime",
                                          value
                                        )
                                      }
                                      value={slot.startTime}
                                    >
                                      <SelectTrigger className="h-9 w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {TIME_OPTIONS.map((time) => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs">
                                      End
                                    </Label>
                                    <Select
                                      disabled={!slot.startTime}
                                      onValueChange={(value) =>
                                        updateSlot(slotIndex, "endTime", value)
                                      }
                                      value={slot.endTime}
                                    >
                                      <SelectTrigger className="h-9 w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {validEndOptions.map((time) => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs">
                                      Status
                                    </Label>
                                    <div className="flex h-9 items-center rounded-md border border-border/50 bg-background px-3">
                                      <Switch
                                        checked={slot.isAvailable}
                                        className="h-4 w-7"
                                        onCheckedChange={(checked) =>
                                          updateSlot(
                                            slotIndex,
                                            "isAvailable",
                                            checked
                                          )
                                        }
                                      />
                                      <span className="ml-2 text-muted-foreground text-sm">
                                        {slot.isAvailable ? "On" : "Off"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/95 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <Badge
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  variant="outline"
                >
                  Unsaved changes
                </Badge>
              ) : null}
            </div>
            <Button
              disabled={
                saveMutation.isPending ||
                slots.filter((slot) => slot.isAvailable).length === 0 ||
                !hasChanges
              }
              onClick={handleSave}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Availability
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
