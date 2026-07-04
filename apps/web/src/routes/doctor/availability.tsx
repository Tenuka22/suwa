import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";

import { Label } from "@suwa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Separator } from "@suwa/ui/components/separator";
import { Switch } from "@suwa/ui/components/switch";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDaysIcon,
  Clock3Icon,
  ClockIcon,
  InboxIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

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
  component: DoctorAvailabilityRoute,
});

function DoctorAvailabilityRoute() {
  const { data: availability } = useSuspenseQuery(
    orpc.getWeeklyAvailability.queryOptions()
  );
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
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
  }, [availability]);

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
    saveMutation.mutate({ slots });
  };

  const isSaving = saveMutation.isPending;

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

  const availableDays = new Set(
    slots.filter((slot) => slot.isAvailable).map((slot) => slot.dayOfWeek)
  );
  const totalHours = slots
    .filter((slot) => slot.isAvailable)
    .reduce((acc, slot) => acc + getHoursForSlot(slot), 0);

  const pendingSessions = (availability as any)?.pendingSessions ?? [];

  const canSave = !isSaving && hasChanges;

  return (
    <div className="flex min-h-svh flex-col">
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-semibold text-xl tracking-tight">
              Weekly availability
            </h1>
            <p className="text-muted-foreground text-sm">
              Set the hours patients can book you for
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges ? (
              <Badge
                className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                variant="outline"
              >
                Unsaved changes
              </Badge>
            ) : null}
            <Button disabled={!canSave} onClick={handleSave}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            description="Days you're accepting sessions"
            icon={<CalendarDaysIcon className="size-5" />}
            title="Active days"
            value={`${availableDays.size} / 7`}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule editor</CardTitle>
            <p className="text-muted-foreground text-sm">
              Configure time windows for each day of the week
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                  <Card className="bg-muted/20" key={dayName}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {dayName}
                            </CardTitle>
                            <Badge
                              className={
                                isDayAvailable
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
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
                              : `${daySlots.length} slot${daySlots.length === 1 ? "" : "s"} \u00b7 ${dayHours.toFixed(1)}h`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              aria-label={`${dayName} availability`}
                              checked={isDayAvailable}
                              onCheckedChange={(checked) =>
                                toggleDay(dayOfWeek, checked)
                              }
                            />
                            <Label className="text-muted-foreground text-xs">
                              {isDayAvailable ? "Working" : "Day off"}
                            </Label>
                          </div>
                          <Button
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
                        <div className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground text-xs">
                          No slots yet — tap "Add Slot" to set your available
                          hours for {dayName}.
                        </div>
                      ) : (
                        <div className="flex flex-col divide-y rounded-md border bg-background">
                          {daySlots.map((slot, slotOffset) => {
                            const slotIndex = slots.indexOf(slot);
                            const validEndOptions = TIME_OPTIONS.filter(
                              (t) =>
                                timeToMinutes(t) > timeToMinutes(slot.startTime)
                            );

                            return (
                              <div
                                className="flex flex-col gap-3 p-3"
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
                                    className="size-8"
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
                                      <SelectTrigger className="w-full">
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
                                      <SelectTrigger className="w-full">
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
                                    <div className="flex h-9 items-center gap-2 rounded-md border px-3">
                                      <Switch
                                        aria-label={`Slot ${slot.startTime}-${slot.endTime} status`}
                                        checked={slot.isAvailable}
                                        onCheckedChange={(checked) =>
                                          updateSlot(
                                            slotIndex,
                                            "isAvailable",
                                            checked
                                          )
                                        }
                                      />
                                      <span className="text-muted-foreground text-sm">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  description,
  icon,
  title,
  value,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-sm">{title}</p>
            <span className="font-semibold text-2xl">{value}</span>
          </div>
          <div className="rounded-full border bg-background p-2.5 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
