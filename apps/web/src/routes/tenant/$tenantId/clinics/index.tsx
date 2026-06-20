import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Skeleton,
  toast,
  useOverlayState,
} from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheckIcon,
  ClockIcon,
  PlusIcon,
  StethoscopeIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";

import { BodyText, PageTitle } from "@/components/typography";
import { useCreateClinic, useListClinics } from "@/hooks/queries/tenant";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

interface ScheduleSlot {
  dayOfWeek: number;
  endTime: string;
  startTime: string;
}

const timeToMinutes = (time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
};

function parseSchedule(schedule: string | null): string {
  if (!schedule) {
    return "";
  }
  try {
    const parsed = JSON.parse(schedule) as ScheduleSlot[];
    if (!Array.isArray(parsed)) {
      return schedule;
    }
    return parsed
      .map((s) => `${DAYS[s.dayOfWeek] ?? "?"} ${s.startTime}-${s.endTime}`)
      .join(", ");
  } catch {
    return schedule;
  }
}

export const Route = createFileRoute("/tenant/$tenantId/clinics/")({
  component: TenantClinicsPage,
});

function TenantClinicsPage() {
  const { tenantId } = Route.useParams();

  const { data, isLoading } = useListClinics(tenantId);
  const createClinic = useCreateClinic();

  const state = useOverlayState();
  const [clinicName, setClinicName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");

  const addSlot = () => {
    const day = Number(newDay);
    const startMin = timeToMinutes(newStart);
    const endMin = timeToMinutes(newEnd);
    if (endMin <= startMin) {
      toast.danger("End time must be after start time");
      return;
    }

    const hasOverlap = scheduleSlots.some(
      (s) =>
        s.dayOfWeek === day &&
        timeToMinutes(s.startTime) < endMin &&
        timeToMinutes(s.endTime) > startMin
    );
    if (hasOverlap) {
      toast.danger("Slots cannot overlap on the same day");
      return;
    }

    setScheduleSlots((prev) => [
      ...prev,
      { dayOfWeek: day, startTime: newStart, endTime: newEnd },
    ]);
    setNewStart(newEnd);
    setNewEnd(
      TIME_OPTIONS.find((t) => timeToMinutes(t) > timeToMinutes(newEnd) + 30) ??
        "17:00"
    );
  };

  const removeSlot = (index: number) => {
    setScheduleSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const validEndOptions = TIME_OPTIONS.filter(
    (t) => timeToMinutes(t) > timeToMinutes(newStart)
  );

  const handleCreate = async () => {
    if (!clinicName) {
      toast.danger("Clinic name is required");
      return;
    }

    try {
      await createClinic.mutateAsync({
        tenantId,
        name: clinicName,
        specialization: specialization || undefined,
        schedule:
          scheduleSlots.length > 0 ? JSON.stringify(scheduleSlots) : undefined,
      });
      toast.success("Clinic created successfully");
      state.close();
      setClinicName("");
      setSpecialization("");
      setScheduleSlots([]);
    } catch {
      toast.danger("Failed to create clinic");
    }
  };

  const clinics = data?.clinics ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent/10">
            <StethoscopeIcon className="size-6 text-accent" />
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">Clinics</h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <StethoscopeIcon className="size-3" />
                </div>
                Public hospital
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Manage clinics within this public hospital.
            </BodyText>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Button onPress={state.open}>
              <PlusIcon className="size-4" />
              Create Clinic
            </Button>

            <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-lg">
                  <Modal.Header>
                    <Modal.Heading>Create New Clinic</Modal.Heading>
                  </Modal.Header>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Clinic Name *</Label>
                      <Input
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="e.g., Cardiology OPD"
                        value={clinicName}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Specialization</Label>
                      <Input
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g., Cardiology"
                        value={specialization}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Schedule</Label>
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        {scheduleSlots.length > 0 && (
                          <div className="mb-3 flex flex-col gap-1.5">
                            {scheduleSlots.map((slot, i) => (
                              <div
                                className="flex items-center justify-between rounded-md border border-border/40 bg-background px-3 py-1.5"
                                key={i}
                              >
                                <div className="flex items-center gap-2">
                                  <Chip
                                    className="text-[10px]"
                                    variant="secondary"
                                  >
                                    {DAYS[slot.dayOfWeek]}
                                  </Chip>
                                  <span className="font-mono text-muted-foreground text-xs">
                                    {slot.startTime}-{slot.endTime}
                                  </span>
                                </div>
                                <Button
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  isIconOnly
                                  onPress={() => removeSlot(i)}
                                  variant="ghost"
                                >
                                  <TrashIcon className="size-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex flex-col gap-1">
                            <Label className="text-[10px]">Day</Label>
                            <Select
                              onSelectionChange={(id) =>
                                setNewDay(String(id) ?? "1")
                              }
                              selectedKey={newDay}
                            >
                              <Select.Trigger className="w-20">
                                <Select.Value />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {DAYS.map((day, i) => (
                                    <ListBox.Item id={String(i)} key={i}>
                                      {day}
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-[10px]">Start</Label>
                            <Select
                              onSelectionChange={(id) =>
                                setNewStart(String(id) ?? "09:00")
                              }
                              selectedKey={newStart}
                            >
                              <Select.Trigger className="w-20">
                                <Select.Value />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {TIME_OPTIONS.map((t) => (
                                    <ListBox.Item id={t} key={t}>
                                      {t}
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-[10px]">End</Label>
                            <Select
                              onSelectionChange={(id) =>
                                setNewEnd(String(id) ?? "10:00")
                              }
                              selectedKey={newEnd}
                            >
                              <Select.Trigger className="w-20">
                                <Select.Value />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {validEndOptions.map((t) => (
                                    <ListBox.Item id={t} key={t}>
                                      {t}
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          </div>
                          <Button
                            className="h-8"
                            onPress={addSlot}
                            size="sm"
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Modal.Footer>
                    <Button onPress={() => state.close()} variant="outline">
                      Cancel
                    </Button>
                    <Button
                      isDisabled={createClinic.isPending}
                      onPress={handleCreate}
                    >
                      {createClinic.isPending ? "Creating..." : "Create Clinic"}
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>All clinics</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            {clinics.length} clinic{clinics.length === 1 ? "" : "s"} configured
            for this hospital.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Card.Header>
                  <Skeleton className="h-5 w-40" />
                </Card.Header>
                <Card.Content>
                  <Skeleton className="h-4 w-full" />
                </Card.Content>
              </Card>
            ))}
          </div>
        ) : clinics.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clinics.map((clinic) => (
              <Card className="flex flex-col" key={clinic.id}>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <StethoscopeIcon className="size-4 text-primary" />
                    <Card.Title className="text-base">{clinic.name}</Card.Title>
                  </div>
                  {clinic.specialization && (
                    <Card.Description>{clinic.specialization}</Card.Description>
                  )}
                </Card.Header>
                <Card.Content className="flex flex-1 flex-col gap-2">
                  {clinic.schedule && (
                    <div className="flex items-start gap-1.5">
                      <ClockIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        {parseSchedule(clinic.schedule)}
                      </p>
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Created {new Date(clinic.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-auto pt-3">
                    <Link
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 font-medium text-foreground text-xs hover:bg-muted"
                      params={{ tenantId, clinicId: clinic.id }}
                      to="/tenant/$tenantId/clinics/$clinicId/attendance"
                    >
                      <CalendarCheckIcon className="size-3" />
                      Attendance
                    </Link>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <StethoscopeIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No clinics yet</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Create clinics to organize doctor attendance within this hospital.
            </p>
            <Button onPress={state.open}>
              <PlusIcon className="size-4" />
              Create Clinic
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
