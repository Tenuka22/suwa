import {
  Button,
  Chip,
  Label,
  ListBox,
  Select,
  Separator,
  Switch,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDaysIcon, CheckIcon, ClockIcon, Loader2, Trash2, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  DoctorAvailabilityChart,
  DoctorAvailabilityStats,
  EmptyState,
} from "@/components/doctors";
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

  const handleTenantChange = (id: string | number) => {
    const value = String(id);
    if (hasChanges) {
      const discard = window.confirm(
        "You have unsaved changes. Switch anyway?"
      );
      if (!discard) {
        return;
      }
    }
    setSelectedTenantId(value);
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

  const chartData =
    stats?.hoursByDay.map((d: { day: number; hours: number }) => ({
      day: DAYS[d.day]?.slice(0, 3) ?? "",
      hours: d.hours,
    })) ?? [];

  const hasChartData = chartData.some((d: { hours: number }) => d.hours > 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <PageTitle>
            {isTenantMode
              ? `Availability at ${currentAffiliation?.tenantName ?? "Hospital"}`
              : "Weekly availability"}
          </PageTitle>
          <Chip color="accent" variant="soft">
            <CalendarDaysIcon className="size-3" />
            {isTenantMode
              ? (currentAffiliation?.tenantName ?? "Hospital")
              : "Schedule overview"}
          </Chip>
        </div>

        <BodyText className="max-w-2xl">
          {isTenantMode
            ? `Set your working hours for ${currentAffiliation?.tenantName ?? "this hospital"} so the facility knows when you're available.`
            : "Set your weekly working hours so patients can book sessions that fit your schedule. Days and slots can be individually toggled."}
        </BodyText>

        {affiliations.length > 0 && (
          <Select
            className="mt-3"
            onSelectionChange={(id) => handleTenantChange(id ?? "")}
            selectedKey={selectedTenantId}
          >
            <Select.Trigger className="w-[260px]">
              <Select.Value />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="">My general availability</ListBox.Item>
                {affiliations.map((aff) => (
                  <ListBox.Item id={aff.tenantId} key={aff.id}>
                    {aff.tenantName}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}
      </div>

      <Separator />

      <section className="flex flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <DoctorAvailabilityStats
          activeDays={availableDays.size}
          pendingSessions={0}
          slots={slots.filter((s) => s.isAvailable).length}
          totalHours={totalHours}
        />
      </section>

      {hasChartData && (
        <>
          <Separator />

          <section className="flex flex-col gap-3">
            <div>
              <PageTitle>Weekly distribution</PageTitle>
              <p className="font-light text-foreground/60 text-sm">
                Available hours per day of the week
              </p>
            </div>
            <DoctorAvailabilityChart data={chartData} />
          </section>
        </>
      )}

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageTitle>Schedule editor</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Configure time windows for each day of the week
            </p>
          </div>
          <Button
            className="text-xs"
            isDisabled={
              isSaving ||
              slots.filter((slot) => slot.isAvailable).length === 0 ||
              !hasChanges
            }
            onPress={handleSave}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : null}
            {isTenantMode ? "Save Tenant Availability" : "Save Changes"}
          </Button>
        </div>

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
              <div
                className="rounded-xl border border-border px-4 py-3"
                key={dayName}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-light text-sm">{dayName}</p>
                      <Chip
                        className="text-[10px]"
                        color={isDayAvailable ? "success" : "default"}
                        variant={isDayAvailable ? "soft" : "tertiary"}
                      >
                        {isDayAvailable ? "Available" : "Off"}
                      </Chip>
                    </div>
                    <p className="font-light text-foreground/60 text-xs">
                      {daySlots.length === 0
                        ? "No hours set"
                        : `${daySlots.length} slot${daySlots.length === 1 ? "" : "s"} · ${dayHours.toFixed(1)}h`}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      aria-label={`${dayName} availability`}
                      isSelected={isDayAvailable}
                      onChange={(checked) => toggleDay(dayOfWeek, checked)}
                      size="md"
                    >
                      {({ isSelected }) => (
                        <Switch.Content>
                          <Switch.Control>
                            <Switch.Thumb>
                              <Switch.Icon>
                                {isSelected ? (
                                  <CheckIcon className="size-2.5 text-inherit opacity-100" />
                                ) : (
                                  <XIcon className="size-2.5 text-inherit opacity-60" />
                                )}
                              </Switch.Icon>
                            </Switch.Thumb>
                          </Switch.Control>
                          {isSelected ? "Working" : "Day off"}
                        </Switch.Content>
                      )}
                    </Switch>
                    <Button
                      className="text-xs"
                      onPress={() => addSlotForDay(dayOfWeek)}
                      size="sm"
                      variant="outline"
                    >
                      Add Slot
                    </Button>
                  </div>
                </div>

                <div className="my-3 h-px bg-border" />

                <div className="flex flex-col gap-3">
                  {daySlots.length === 0 ? (
                    <EmptyState
                      description={`Tap "Add Slot" to set your available hours for ${dayName}.`}
                      title="No slots yet"
                    />
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
                            className="rounded-lg border border-border bg-foreground/5 px-3 py-3"
                            key={
                              slot.id ??
                              `${dayName}-${slot.startTime}-${slot.endTime}-${slotOffset}`
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-sm">
                                <ClockIcon className="size-3.5 text-foreground/60" />
                                <span className="font-light text-xs">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                              <Button
                                aria-label="Remove slot"
                                className="h-8 w-8"
                                isIconOnly
                                onPress={() => removeSlot(slotIndex)}
                                variant="ghost"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-foreground/60 text-xs">
                                  Start
                                </Label>
                                <Select
                                  onSelectionChange={(value) =>
                                    updateSlot(
                                      slotIndex,
                                      "startTime",
                                      String(value ?? "")
                                    )
                                  }
                                  selectedKey={slot.startTime}
                                >
                                  <Select.Trigger className="h-9 w-full">
                                    <Select.Value />
                                  </Select.Trigger>
                                  <Select.Popover>
                                    <ListBox>
                                      {TIME_OPTIONS.map((time) => (
                                        <ListBox.Item id={time} key={time}>
                                          {time}
                                        </ListBox.Item>
                                      ))}
                                    </ListBox>
                                  </Select.Popover>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <Label className="text-foreground/60 text-xs">
                                  End
                                </Label>
                                <Select
                                  isDisabled={!slot.startTime}
                                  onSelectionChange={(value) =>
                                    updateSlot(
                                      slotIndex,
                                      "endTime",
                                      String(value ?? "")
                                    )
                                  }
                                  selectedKey={slot.endTime}
                                >
                                  <Select.Trigger className="h-9 w-full">
                                    <Select.Value />
                                  </Select.Trigger>
                                  <Select.Popover>
                                    <ListBox>
                                      {validEndOptions.map((time) => (
                                        <ListBox.Item id={time} key={time}>
                                          {time}
                                        </ListBox.Item>
                                      ))}
                                    </ListBox>
                                  </Select.Popover>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <Label className="text-foreground/60 text-xs">
                                  Status
                                </Label>
                                <div className="flex h-9 items-center rounded-md border border-border bg-background px-3">
                                  <Switch
                                    aria-label={`Slot ${slot.startTime}-${slot.endTime} status`}
                                    className="h-4 w-7"
                                    isSelected={slot.isAvailable}
                                    onChange={(checked) =>
                                      updateSlot(
                                        slotIndex,
                                        "isAvailable",
                                        checked
                                      )
                                    }
                                  />
                                  <span className="ml-2 text-foreground/60 text-sm">
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
                    tenantWindowsByDay.filter((w) => w.dayOfWeek === dayOfWeek)
                      .length > 0 && (
                      <div className="flex flex-col gap-2 border-border border-t pt-2">
                        <p className="font-light text-foreground/60 text-xs">
                          Tenant reservations
                        </p>
                        {tenantWindowsByDay
                          .filter((w) => w.dayOfWeek === dayOfWeek)
                          .map((w, i) => (
                            <div
                              className="flex items-center gap-2 rounded-lg border border-border bg-primary/5 px-3 py-2"
                              key={i}
                            >
                              <Chip
                                className="text-[10px]"
                                color="default"
                                variant="soft"
                              >
                                {w.tenantName}
                              </Chip>
                              <span className="font-mono text-foreground/60 text-xs">
                                {w.startTime}&ndash;{w.endTime}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
