import { Badge } from "@doca/ui/components/badge";
import { Button } from "@doca/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@doca/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@doca/ui/components/chart";
import { Label } from "@doca/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@doca/ui/components/select";
import { Separator } from "@doca/ui/components/separator";
import { Switch } from "@doca/ui/components/switch";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BuildingIcon,
  CalendarDaysIcon,
  Clock3Icon,
  ClockIcon,
  InboxIcon,
  Loader2,
  Trash2,
  TrendingUpIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { BodyText, PageTitle } from "@/components/typography";
import {
  useListDoctorAffiliations,
  useUpdateAffiliationWindows,
} from "@/hooks/queries/tenant";
import { notify } from "@/lib/notify";
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

export const Route = createFileRoute("/doctor/availability")({
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    const [stats, availability] = await Promise.all([
      context.queryClient.ensureQueryData(
        orpc.availabilityStats.queryOptions()
      ),
      context.queryClient.ensureQueryData(
        orpc.getWeeklyAvailability.queryOptions()
      ),
    ]);
    return { stats, availability };
  },
  component: DoctorAvailabilityRoute,
});

function DoctorAvailabilityRoute() {
  const { stats, availability } = Route.useLoaderData();
  const { data: affiliationsData } = useListDoctorAffiliations();
  const updateAffiliationWindows = useUpdateAffiliationWindows();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const affiliations = affiliationsData?.affiliations ?? [];

  const currentAffiliation = useMemo(() => {
    if (!selectedTenantId) {
      return null;
    }
    return affiliations.find((a) => a.tenantId === selectedTenantId) ?? null;
  }, [selectedTenantId, affiliations]);

  const isTenantMode = !!selectedTenantId;

  useEffect(() => {
    if (isTenantMode && currentAffiliation) {
      const windows = currentAffiliation.availabilityWindows ?? [];
      if (windows.length > 0) {
        setSlots(
          windows.map((w) => ({
            dayOfWeek: w.dayOfWeek,
            endTime: w.endTime,
            isAvailable: true,
            startTime: w.startTime,
          }))
        );
        setHasChanges(false);
        return;
      }
    }

    if (availability?.slots && availability.slots.length > 0) {
      setSlots(availability.slots as AvailabilitySlot[]);
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
  }, [availability, isTenantMode, currentAffiliation]);

  const saveMutation = useMutation(
    orpc.saveWeeklyAvailability.mutationOptions({
      onError: (error: Error) => {
        notify.error(error instanceof Error ? error.message : "Failed to save");
      },
      onSuccess: () => {
        notify.success("Availability saved");
        setHasChanges(false);
      },
    })
  );

  const handleSave = () => {
    if (isTenantMode && currentAffiliation) {
      updateAffiliationWindows.mutate(
        {
          affiliationId: currentAffiliation.id,
          availabilityWindows: slots
            .filter((slot) => slot.isAvailable)
            .map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
        },
        {
          onSuccess: () => {
            notify.success("Tenant availability saved");
            setHasChanges(false);
          },
          onError: (error: Error) => {
            notify.error(error.message ?? "Failed to save tenant availability");
          },
        }
      );
      return;
    }
    saveMutation.mutate({ slots: slots.filter((slot) => slot.isAvailable) });
  };

  const isSaving = isTenantMode
    ? updateAffiliationWindows.isPending
    : saveMutation.isPending;

  const handleTenantChange = (value: string | null) => {
    if (hasChanges) {
      const discard = window.confirm(
        "You have unsaved changes. Switch anyway?"
      );
      if (!discard) {
        return;
      }
    }
    setSelectedTenantId(value ?? "");
    setHasChanges(false);
  };

  const addSlotForDay = (dayOfWeek: number) => {
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const lastSlot = daySlots[daySlots.length - 1];

    let newStart = "09:00";
    let newEnd = "10:00";

    if (lastSlot) {
      const lastEndMinutes = timeToMinutes(lastSlot.endTime);
      if (lastEndMinutes >= 1410) {
        notify.error("No more space for slots today");
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
        notify.error("Slots cannot overlap");
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

  const tenantWindowsByDay = useMemo(() => {
    if (isTenantMode || !affiliations.length) {
      return [];
    }
    const result: Array<{
      dayOfWeek: number;
      tenantName: string;
      startTime: string;
      endTime: string;
    }> = [];
    for (const aff of affiliations) {
      for (const w of aff.availabilityWindows ?? []) {
        result.push({
          dayOfWeek: w.dayOfWeek,
          tenantName: aff.tenantName,
          startTime: w.startTime,
          endTime: w.endTime,
        });
      }
    }
    return result;
  }, [affiliations, isTenantMode]);

  const availableDays = new Set(
    slots.filter((slot) => slot.isAvailable).map((slot) => slot.dayOfWeek)
  );
  const totalHours = slots
    .filter((slot) => slot.isAvailable)
    .reduce((acc, slot) => acc + getHoursForSlot(slot), 0);

  const pendingSessions = (availability as any)?.pendingSessions ?? [];

  const chartData =
    stats?.hoursByDay.map((d: { day: number; hours: number }) => ({
      day: DAYS[d.day]?.slice(0, 3) ?? "",
      hours: d.hours,
    })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Availability dashboard</Badge>
              {isTenantMode ? (
                <Badge variant="secondary">
                  {currentAffiliation?.tenantName ?? "Hospital"}
                </Badge>
              ) : (
                <Badge variant="secondary">Schedule overview</Badge>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <PageTitle>
                {isTenantMode
                  ? `Availability at ${currentAffiliation?.tenantName ?? "Hospital"}`
                  : "Weekly availability"}
              </PageTitle>

              <BodyText className="max-w-2xl">
                {isTenantMode
                  ? `Set your working hours for ${currentAffiliation?.tenantName ?? "this hospital"} so the facility knows when you're available.`
                  : "Set your weekly working hours so patients can book sessions that fit your schedule. Days and slots can be individually toggled."}
              </BodyText>
            </div>

            {affiliations.length > 0 && (
              <div className="flex items-center gap-2">
                <BuildingIcon className="size-4 text-muted-foreground" />
                <Select
                  onValueChange={handleTenantChange}
                  value={selectedTenantId}
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="My general availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">My general availability</SelectItem>
                    {affiliations.map((aff) => (
                      <SelectItem key={aff.id} value={aff.tenantId}>
                        {aff.tenantName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                  isSaving ||
                  slots.filter((slot) => slot.isAvailable).length === 0 ||
                  !hasChanges
                }
                onClick={handleSave}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {isTenantMode ? "Save Tenant Availability" : "Save Changes"}
              </Button>
            }
            description="Configure time windows for each day of the week"
            title="Schedule editor"
          />
        </CardHeader>

        <Separator />

        <CardContent>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {DAYS.map((dayName, dayOfWeek) => {
              const daySlots = slots.filter(
                (slot) => slot.dayOfWeek === dayOfWeek
              );
              const isDayAvailable = daySlots.some((slot) => slot.isAvailable);
              const dayHours = daySlots.reduce(
                (acc, slot) => acc + getHoursForSlot(slot),
                0
              );

              return (
                <Card
                  className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  key={dayName}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{dayName}</CardTitle>
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
                            aria-label={`${dayName} availability`}
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

                  <CardContent className="flex flex-col gap-3">
                    {daySlots.length === 0 ? (
                      <div className="rounded-lg border border-border/70 border-dashed bg-muted/20 px-4 py-6 text-center text-muted-foreground text-xs">
                        No slots yet — tap "Add Slot" to set your available
                        hours for {dayName}.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
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
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <ClockIcon className="size-3.5 text-muted-foreground" />
                                  <span className="font-medium text-xs">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>
                                <Button
                                  aria-label="Remove slot"
                                  className="h-8 w-8"
                                  onClick={() => removeSlot(slotIndex)}
                                  size="icon"
                                  variant="ghost"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="flex flex-col gap-1.5">
                                  <Label className="text-muted-foreground text-xs">
                                    Start
                                  </Label>
                                  <Select
                                    onValueChange={(value) =>
                                      updateSlot(slotIndex, "startTime", value)
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

                                <div className="flex flex-col gap-1.5">
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

                                <div className="flex flex-col gap-1.5">
                                  <Label className="text-muted-foreground text-xs">
                                    Status
                                  </Label>
                                  <div className="flex h-9 items-center rounded-md border border-border/50 bg-background px-3">
                                    <Switch
                                      aria-label={`Slot ${slot.startTime}-${slot.endTime} status`}
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
                    {!isTenantMode &&
                      tenantWindowsByDay.filter(
                        (w) => w.dayOfWeek === dayOfWeek
                      ).length > 0 && (
                        <div className="flex flex-col gap-2 border-border/40 border-t pt-2">
                          <p className="font-medium text-muted-foreground text-xs">
                            Tenant reservations
                          </p>
                          {tenantWindowsByDay
                            .filter((w) => w.dayOfWeek === dayOfWeek)
                            .map((w, i) => (
                              <div
                                className="flex items-center gap-2 rounded-lg border border-border/50 bg-primary/5 px-3 py-2"
                                key={i}
                              >
                                <Badge
                                  className="text-[10px]"
                                  variant="secondary"
                                >
                                  {w.tenantName}
                                </Badge>
                                <span className="font-mono text-muted-foreground text-xs">
                                  {w.startTime}–{w.endTime}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

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
                isSaving ||
                slots.filter((slot) => slot.isAvailable).length === 0 ||
                !hasChanges
              }
              onClick={handleSave}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isTenantMode ? "Save Tenant Availability" : "Save Availability"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
