import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Calendar } from "@suwa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@suwa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@suwa/ui/components/dialog";
import { Label } from "@suwa/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@suwa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Skeleton } from "@suwa/ui/components/skeleton";
import { Textarea } from "@suwa/ui/components/textarea";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarCheckIcon,
  CalendarIcon,
  ClockIcon,
  LogInIcon,
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useDeleteAttendanceEvent,
  useGetAttendance,
  useGetDoctorHospitalBlocks,
  useListTenantAffiliations,
  useLogAttendanceEvent,
  useUpdateAttendanceEvent,
} from "@/hooks/queries/tenant";
import { buildHeadFromKey } from "../../__root";

const EVENT_TYPES = [
  "CHECKED_IN",
  "CHECKED_OUT",
  "RETURNED",
  "SCHEDULED_DEPARTURE",
] as const;

const EVENT_ICONS: Record<string, typeof LogInIcon> = {
  CHECKED_IN: LogInIcon,
  CHECKED_OUT: LogOutIcon,
  RETURNED: RotateCcwIcon,
  SCHEDULED_DEPARTURE: CalendarCheckIcon,
};

const EVENT_COLORS: Record<string, string> = {
  CHECKED_IN: "text-green-500",
  CHECKED_OUT: "text-red-500",
  RETURNED: "text-blue-500",
  SCHEDULED_DEPARTURE: "text-amber-500",
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

export const Route = createFileRoute("/tenant/$tenantId/attendance")({
  head: () => buildHeadFromKey("web:tenant:attendance"),
  component: TenantAttendancePage,
});

function TenantAttendancePage() {
  const { tenantId } = Route.useParams();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    id: string;
    eventType: string;
    timestamp: string;
    note: string | null;
  } | null>(null);

  const [eventType, setEventType] =
    useState<(typeof EVENT_TYPES)[number]>("CHECKED_IN");
  const [eventHour, setEventHour] = useState("09");
  const [eventMinute, setEventMinute] = useState("00");
  const [eventNote, setEventNote] = useState("");

  const { data: affiliationsData } = useListTenantAffiliations(tenantId);
  const {
    data: attendanceData,
    isLoading,
    refetch,
  } = useGetAttendance(tenantId, {
    doctorId: selectedDoctorId || undefined,
    date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
  });

  const fromDate = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [selectedDate]);
  const toDate = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [selectedDate]);

  const { data: hospitalBlocks } = useGetDoctorHospitalBlocks(
    selectedDoctorId || "__skip__",
    fromDate,
    toDate
  );

  const logEvent = useLogAttendanceEvent();
  const updateEvent = useUpdateAttendanceEvent();
  const deleteEvent = useDeleteAttendanceEvent();

  const doctors = affiliationsData?.affiliations ?? [];
  const events = attendanceData?.events ?? [];

  const selectedDoctorWindows = useMemo(() => {
    if (!hospitalBlocks?.recurringWindows) {
      return [];
    }
    const dayOfWeek = selectedDate.getDay();
    return hospitalBlocks.recurringWindows
      .filter((w) => w.dayOfWeek === dayOfWeek)
      .map((w) => `${w.startTime}–${w.endTime}`);
  }, [hospitalBlocks, selectedDate]);

  const isWithinWindow = (timestamp: string): boolean => {
    if (
      !hospitalBlocks?.recurringWindows ||
      selectedDoctorWindows.length === 0
    ) {
      return true;
    }

    const date = new Date(timestamp);
    const dayOfWeek = date.getDay();
    const timeMinutes = date.getHours() * 60 + date.getMinutes();

    for (const w of hospitalBlocks.recurringWindows) {
      if (w.dayOfWeek !== dayOfWeek) {
        continue;
      }
      const startParts = w.startTime.split(":").map(Number);
      const endParts = w.endTime.split(":").map(Number);
      const startMin = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0);
      const endMin = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0);
      if (timeMinutes >= startMin && timeMinutes < endMin) {
        return true;
      }
    }
    return false;
  };

  const buildTimestamp = () => {
    const d = new Date(selectedDate);
    d.setHours(Number(eventHour), Number(eventMinute), 0, 0);
    return d.toISOString();
  };

  const handleLogEvent = async () => {
    const doctorId = selectedDoctorId;
    if (!doctorId) {
      toast.error("Please select a doctor");
      return;
    }

    const timestamp = buildTimestamp();

    if (selectedDoctorWindows.length > 0 && !isWithinWindow(timestamp)) {
      toast.error(
        `Time must be within reserved windows: ${selectedDoctorWindows.join(", ")}`
      );
      return;
    }

    try {
      await logEvent.mutateAsync({
        doctorId,
        tenantId,
        timestamp,
        eventType,
        note: eventNote || undefined,
      });
      toast.success("Attendance event logged");
      resetForm();
      refetch();
    } catch {
      toast.error("Failed to log event");
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) {
      return;
    }

    const timestamp = buildTimestamp();

    if (selectedDoctorWindows.length > 0 && !isWithinWindow(timestamp)) {
      toast.error(
        `Time must be within reserved windows: ${selectedDoctorWindows.join(", ")}`
      );
      return;
    }

    try {
      await updateEvent.mutateAsync({
        eventId: editingEvent.id,
        timestamp,
        eventType,
        note: eventNote || null,
      });
      toast.success("Event updated");
      resetForm();
      refetch();
    } catch {
      toast.error("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync({ eventId });
      toast.success("Event deleted");
      refetch();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const handleEditEvent = (event: {
    id: string;
    eventType: string;
    timestamp: string;
    note: string | null;
  }) => {
    setEditingEvent(event);
    setEventType(event.eventType as (typeof EVENT_TYPES)[number]);
    const d = new Date(event.timestamp);
    setEventHour(String(d.getHours()).padStart(2, "0"));
    setEventMinute(String(d.getMinutes()).padStart(2, "0"));
    setEventNote(event.note ?? "");
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setEventType("CHECKED_IN");
    setEventHour("09");
    setEventMinute("00");
    setEventNote("");
  };

  const isSaving = logEvent.isPending || updateEvent.isPending;

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:flex-row sm:items-center sm:p-6">
          <div className="flex flex-col gap-3">
            <Badge className="h-7 w-fit rounded-full bg-primary px-3 text-primary-foreground">
              Attendance tracking
            </Badge>
            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
                Attendance
              </h1>
              <p className="max-w-[58ch] text-base text-muted-foreground leading-7">
                Track doctor attendance at this hospital.
              </p>
            </div>
          </div>

          <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <DialogTrigger
              render={
                <Button
                  className="h-12 rounded-full bg-primary px-5 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90"
                  onClick={() => {
                    setEditingEvent(null);
                    setEventType("CHECKED_IN");
                    setEventHour("09");
                    setEventMinute("00");
                    setEventNote("");
                  }}
                >
                  <PlusIcon className="size-4" />
                  Log Event
                </Button>
              }
            />
            <DialogContent className="rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_12%,transparent)] backdrop-blur-md sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="tracking-tight">
                  {editingEvent
                    ? "Edit Attendance Event"
                    : "Log Attendance Event"}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent
                    ? "Update the attendance event details."
                    : "Record a check-in, check-out, or other event for a doctor."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Doctor</Label>
                  <Select
                    disabled={!!editingEvent}
                    onValueChange={(v) => {
                      setSelectedDoctorId(v ?? "");
                      setEventHour("09");
                      setEventMinute("00");
                    }}
                    value={selectedDoctorId}
                  >
                    <SelectTrigger className="w-full rounded-full h-12">
                      <SelectValue placeholder="Select doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors
                        .filter((d) => d.status === "ACTIVE")
                        .map((d) => (
                          <SelectItem key={d.doctorId} value={d.doctorId}>
                            {d.doctorName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDoctorId && selectedDoctorWindows.length > 0 && (
                  <div className="rounded-[1.2rem] border border-border/90 bg-background/72 p-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <ClockIcon className="size-3" />
                      Reserved time slots
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedDoctorWindows.map((w) => (
                        <Badge
                          className="h-6 rounded-full px-3 text-[10px]"
                          key={w}
                          variant="secondary"
                        >
                          {w}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Timestamp must fall within a reserved window
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label>Event Type</Label>
                  <Select
                    onValueChange={(v) => {
                      if (v) {
                        setEventType(v as (typeof EVENT_TYPES)[number]);
                      }
                    }}
                    value={eventType}
                  >
                    <SelectTrigger className="w-full rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Timestamp</Label>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full border border-border/90 bg-background/72 px-4 py-2 text-sm">
                      {format(selectedDate, "MMM d, yyyy")}
                    </div>
                    <Select
                      onValueChange={(v) => setEventHour(v ?? "09")}
                      value={eventHour}
                    >
                      <SelectTrigger className="w-20 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">:</span>
                    <Select
                      onValueChange={(v) => setEventMinute(v ?? "00")}
                      value={eventMinute}
                    >
                      <SelectTrigger className="w-20 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MINUTES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Note (optional)</Label>
                  <Textarea
                    className="rounded-[1.2rem]"
                    onChange={(e) => setEventNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    value={eventNote}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="h-12 rounded-full border-border bg-card px-5 text-foreground hover:bg-muted"
                  onClick={resetForm}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="h-12 rounded-full bg-primary px-5 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90"
                  disabled={isSaving}
                  onClick={editingEvent ? handleUpdateEvent : handleLogEvent}
                >
                  {isSaving
                    ? "Saving..."
                    : editingEvent
                      ? "Update Event"
                      : "Log Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Date
            </Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    className="h-10 w-[240px] justify-start gap-2 rounded-full border-border bg-card px-4 text-left font-normal text-foreground hover:bg-muted"
                    variant="outline"
                  />
                }
              >
                <CalendarIcon className="size-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto rounded-[1.5rem] border-border/95 bg-card/90 p-2 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md"
              >
                <Calendar
                  mode="single"
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  selected={selectedDate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Doctor
            </Label>
            <Select
              onValueChange={(v) => setSelectedDoctorId(v ?? "")}
              value={selectedDoctorId}
            >
              <SelectTrigger className="h-12 w-full rounded-full border-border bg-card px-4 text-foreground">
                <SelectValue placeholder="All doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All doctors</SelectItem>
                {doctors
                  .filter((d) => d.status === "ACTIVE")
                  .map((d) => (
                    <SelectItem key={d.doctorId} value={d.doctorId}>
                      {d.doctorName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Timeline */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton className="h-16 w-full rounded-[1.2rem]" key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border-border/95 bg-card/82 p-8 text-center shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
              <CalendarCheckIcon className="size-8" />
            </div>
            <CardTitle className="text-2xl tracking-tight">
              No events for this date
            </CardTitle>
            <CardDescription className="max-w-md text-center text-muted-foreground leading-7">
              Log an attendance event to start tracking.
            </CardDescription>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const Icon = EVENT_ICONS[event.eventType] ?? CalendarCheckIcon;
              const colorClass =
                EVENT_COLORS[event.eventType] ?? "text-muted-foreground";
              const doctor = doctors.find((d) => d.doctorId === event.doctorId);

              return (
                <Card
                  className="overflow-hidden rounded-[1.5rem] border-border/95 bg-card/82 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_12%,transparent)]"
                  key={event.id}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex size-10 items-center justify-center rounded-full border border-border bg-background ${colorClass}`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {doctor?.doctorName ?? event.doctorId}
                          </p>
                          <Badge
                            className="h-6 rounded-full px-3 text-[10px]"
                            variant="outline"
                          >
                            {event.eventType.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {new Date(event.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Colombo",
                            }
                          )}
                          {event.note && ` — ${event.note}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        className="rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => handleEditEvent(event)}
                        size="icon"
                        variant="ghost"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        className="rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
