import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zen-doc/ui/components/dialog";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { Textarea } from "@zen-doc/ui/components/textarea";
import {
  CalendarCheckIcon,
  LogInIcon,
  LogOutIcon,
  PlusIcon,
  RotateCcwIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useDeleteAttendanceEvent,
  useGetAttendance,
  useListTenantAffiliations,
  useLogAttendanceEvent,
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

export const Route = createFileRoute("/tenant/$tenantId/attendance")({
  component: TenantAttendancePage,
});

function TenantAttendancePage() {
  const { tenantId } = Route.useParams();
  const today = new Date().toISOString().split("T")[0]!;

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New event form state
  const [eventType, setEventType] =
    useState<(typeof EVENT_TYPES)[number]>("CHECKED_IN");
  const [eventTimestamp, setEventTimestamp] = useState("");
  const [eventNote, setEventNote] = useState("");

  const { data: affiliationsData } = useListTenantAffiliations(tenantId);
  const {
    data: attendanceData,
    isLoading,
    refetch,
  } = useGetAttendance(tenantId, {
    doctorId: selectedDoctorId || undefined,
    date: selectedDate,
  });

  const logEvent = useLogAttendanceEvent();
  const deleteEvent = useDeleteAttendanceEvent();

  const doctors = affiliationsData?.affiliations ?? [];
  const events = attendanceData?.events ?? [];

  const handleLogEvent = async () => {
    const doctorId = selectedDoctorId;
    if (!doctorId) {
      toast.error("Please select a doctor");
      return;
    }

    try {
      await logEvent.mutateAsync({
        doctorId,
        tenantId,
        timestamp: eventTimestamp
          ? new Date(eventTimestamp).toISOString()
          : new Date().toISOString(),
        eventType,
        note: eventNote || undefined,
      });
      toast.success("Attendance event logged");
      setDialogOpen(false);
      setEventNote("");
      setEventTimestamp("");
      refetch();
    } catch {
      toast.error("Failed to log event");
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
              <Button>
                <PlusIcon className="size-4" />
                Log Event
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Attendance Event</DialogTitle>
              <DialogDescription>
                Record a check-in, check-out, or other event for a doctor.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Doctor</Label>
                <Select
                  onValueChange={(v) => setSelectedDoctorId(v ?? "")}
                  value={selectedDoctorId}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                <Input
                  onChange={(e) => setEventTimestamp(e.target.value)}
                  type="datetime-local"
                  value={eventTimestamp}
                />
                <p className="text-muted-foreground text-xs">
                  Leave empty to use current time
                </p>
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
              <Button onClick={() => setDialogOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button disabled={logEvent.isPending} onClick={handleLogEvent}>
                {logEvent.isPending ? "Logging..." : "Log Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Date</Label>
          <Input
            onChange={(e) => setSelectedDate(e.target.value)}
            type="date"
            value={selectedDate}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Doctor</Label>
          <Select
            onValueChange={(v) => setSelectedDoctorId(v ?? "")}
            value={selectedDoctorId}
          >
            <SelectTrigger className="w-[200px]">
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
        <Card className="flex flex-col items-center justify-center">
          <CalendarCheckIcon className="size-8 text-muted-foreground/40" />
          <CardTitle className="text-base">No events for this date</CardTitle>
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
                  <Button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteEvent(event.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
