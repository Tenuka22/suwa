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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@suwa/ui/components/dialog";
import { Input } from "@suwa/ui/components/input";
import { Label } from "@suwa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Skeleton } from "@suwa/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheckIcon,
  ClockIcon,
  PlusIcon,
  StethoscopeIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateClinic, useListClinics } from "@/hooks/queries/tenant";
import { buildHeadFromKey } from "../../../__root";

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
    const parsed = JSON.parse(schedule) as
      | Record<string, string>
      | ScheduleSlot[];

    if (Array.isArray(parsed)) {
      return parsed
        .map((s) => `${DAYS[s.dayOfWeek] ?? "?"} ${s.startTime}-${s.endTime}`)
        .join(", ");
    }

    const labelMap: Record<string, string> = {
      weekdays: "Weekdays",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };

    return Object.entries(parsed)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `${labelMap[key] ?? key}: ${value}`)
      .join(" • ");
  } catch {
    return schedule;
  }
}

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const Route = createFileRoute("/tenant/$tenantId/clinics/")({
  head: () => buildHeadFromKey("web:tenant:clinics:index"),
  component: TenantClinicsPage,
});

function TenantClinicsPage() {
  const { tenantId } = Route.useParams();

  const { data, isLoading } = useListClinics(tenantId);
  const createClinic = useCreateClinic();

  const [dialogOpen, setDialogOpen] = useState(false);
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
      toast.error("End time must be after start time");
      return;
    }

    const hasOverlap = scheduleSlots.some(
      (s) =>
        s.dayOfWeek === day &&
        timeToMinutes(s.startTime) < endMin &&
        timeToMinutes(s.endTime) > startMin
    );
    if (hasOverlap) {
      toast.error("Slots cannot overlap on the same day");
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
      toast.error("Clinic name is required");
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
      setDialogOpen(false);
      setClinicName("");
      setSpecialization("");
      setScheduleSlots([]);
    } catch {
      toast.error("Failed to create clinic");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-border/50 bg-card/60 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg tracking-tight">Clinics</h1>
            <p className="text-muted-foreground">
              Manage clinics within this public hospital.
            </p>
          </div>

          <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <DialogTrigger
              render={
                <Button className="rounded-full">
                  <PlusIcon className="size-4" />
                  Create Clinic
                </Button>
              }
            />
          <DialogContent className="sm:max-w-lg rounded-[2rem]">
            <DialogHeader>
              <DialogTitle>Create New Clinic</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Clinic Name *</Label>
                <Input
                  className="rounded-full"
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g., Cardiology OPD"
                  value={clinicName}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Specialization</Label>
                <Input
                  className="rounded-full"
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
                            <Badge className="text-[10px]" variant="secondary">
                              {DAYS[slot.dayOfWeek]}
                            </Badge>
                            <span className="font-mono text-muted-foreground text-xs">
                              {slot.startTime}-{slot.endTime}
                            </span>
                          </div>
                    <Button
                      className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => removeSlot(i)}
                      size="icon"
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
                        onValueChange={(v) => setNewDay(v ?? "1")}
                        value={newDay}
                      >
                        <SelectTrigger className="w-20 rounded-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px]">Start</Label>
                      <Select
                        onValueChange={(v) => setNewStart(v ?? "09:00")}
                        value={newStart}
                      >
                        <SelectTrigger className="w-20 rounded-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px]">End</Label>
                      <Select
                        onValueChange={(v) => setNewEnd(v ?? "10:00")}
                        value={newEnd}
                      >
                        <SelectTrigger className="w-20 rounded-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {validEndOptions.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="h-8 rounded-full"
                      onClick={addSlot}
                      size="sm"
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button className="rounded-full" onClick={() => setDialogOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button className="rounded-full" disabled={createClinic.isPending} onClick={handleCreate}>
                {createClinic.isPending ? "Creating..." : "Create Clinic"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card className="rounded-[2rem] border-border/50 bg-card/60 backdrop-blur-sm" key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.clinics?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.clinics.map((clinic) => (
            <Card className="flex flex-col rounded-[2rem] border-border/50 bg-card/60 backdrop-blur-sm" key={clinic.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="size-4 text-primary" />
                  <CardTitle className="text-base">{clinic.name}</CardTitle>
                </div>
                {clinic.specialization && (
                  <CardDescription>{clinic.specialization}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full" variant="outline">
                    <ClockIcon className="size-3" />
                    Schedule
                  </Badge>
                  <Badge className="rounded-full" variant="secondary">Created {formatCreatedAt(clinic.createdAt)}</Badge>
                </div>

                {clinic.schedule ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                      <ClockIcon className="size-3.5" />
                      Hours
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {parseSchedule(clinic.schedule)}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No schedule set yet.
                  </p>
                )}

                <div className="mt-auto pt-3">
                  <Link
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground text-xs shadow-sm transition-colors hover:bg-primary/90"
                    params={{ tenantId, clinicId: clinic.id }}
                    to="/tenant/$tenantId/clinics/$clinicId/attendance"
                  >
                    <CalendarCheckIcon className="size-3" />
                    Attendance
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center rounded-[2rem] border-border/50 bg-card/60 backdrop-blur-sm">
          <StethoscopeIcon className="size-12 text-muted-foreground/40" />
          <CardTitle>No clinics yet</CardTitle>
          <CardDescription className="text-center">
            Create clinics to organize doctor attendance within this hospital.
          </CardDescription>
          <Button className="rounded-full" onClick={() => setDialogOpen(true)}>
            <PlusIcon className="size-4" />
            Create Clinic
          </Button>
        </Card>
      )}
    </div>
  );
}
