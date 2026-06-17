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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track doctor attendance at this hospital.
          </p>
        </div>

        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
          <DialogTrigger
            render={
              <Button
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
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
                  <SelectTrigger className="w-full">
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
                <div className="rounded-lg border border-border/50 bg-primary/5 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <ClockIcon className="size-3" />
                    Reserved time slots
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedDoctorWindows.map((w, i) => (
                      <Badge
                        className="text-[10px]"
                        key={i}
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
                  <SelectTrigger className="w-full">
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
                  <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {format(selectedDate, "MMM d, yyyy")}
                  </div>
                  <Select
                    onValueChange={(v) => setEventHour(v ?? "09")}
                    value={eventHour}
                  >
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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
                  onChange={(e) => setEventNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  value={eventNote}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
              <Button
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
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Date</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className="w-[240px] justify-start text-left font-normal"
                  variant="outline"
                />
              }
            >
              <CalendarIcon className="mr-2 size-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
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
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Doctor</Label>
          <Select
            onValueChange={(v) => setSelectedDoctorId(v ?? "")}
            value={selectedDoctorId}
          >
            <SelectTrigger className="w-full">
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
            <Skeleton className="h-16 w-full" key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CalendarCheckIcon className="size-8 text-muted-foreground/40" />
          <CardTitle className="mt-3 text-base">
            No events for this date
          </CardTitle>
          <CardDescription>
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
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full border p-2 ${colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {doctor?.doctorName ?? event.doctorId}
                        </p>
                        <Badge className="text-[10px]" variant="outline">
                          {event.eventType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {new Date(event.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Colombo",
                        })}
                        {event.note && ` — ${event.note}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleEditEvent(event)}
                      size="icon"
                      variant="ghost"
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      className="text-muted-foreground hover:text-destructive"
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
  );
}
