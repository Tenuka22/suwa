import {
  Button,
  Calendar,
  Card,
  Chip,
  Label,
  ListBox,
  Modal,
  Popover,
  Select,
  Skeleton,
  TextArea,
  toast,
  useOverlayState,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
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
  const state = useOverlayState();
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
      toast.danger("Please select a doctor");
      return;
    }

    const timestamp = buildTimestamp();

    if (selectedDoctorWindows.length > 0 && !isWithinWindow(timestamp)) {
      toast.danger(
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
      toast.danger("Failed to log event");
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) {
      return;
    }

    const timestamp = buildTimestamp();

    if (selectedDoctorWindows.length > 0 && !isWithinWindow(timestamp)) {
      toast.danger(
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
      toast.danger("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync({ eventId });
      toast.success("Event deleted");
      refetch();
    } catch {
      toast.danger("Failed to delete event");
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
    state.open();
  };

  const resetForm = () => {
    state.close();
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

        <Button
          onPress={() => {
            setEditingEvent(null);
            setEventType("CHECKED_IN");
            setEventHour("09");
            setEventMinute("00");
            setEventNote("");
            state.open();
          }}
        >
          <PlusIcon className="size-4" />
          Log Event
        </Button>

        <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.Header>
                <Modal.Heading>
                  {editingEvent
                    ? "Edit Attendance Event"
                    : "Log Attendance Event"}
                </Modal.Heading>
              </Modal.Header>
              <p>
                {editingEvent
                  ? "Update the attendance event details."
                  : "Record a check-in, check-out, or other event for a doctor."}
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Doctor</Label>
                  <Select
                    isDisabled={!!editingEvent}
                    onSelectionChange={(id) => {
                      setSelectedDoctorId(String(id) ?? "");
                      setEventHour("09");
                      setEventMinute("00");
                    }}
                    placeholder="Select doctor..."
                    selectedKey={selectedDoctorId}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {doctors
                          .filter((d) => d.status === "ACTIVE")
                          .map((d) => (
                            <ListBox.Item id={d.doctorId} key={d.doctorId}>
                              {d.doctorName}
                            </ListBox.Item>
                          ))}
                      </ListBox>
                    </Select.Popover>
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
                        <Chip
                          className="text-[10px]"
                          key={i}
                          variant="secondary"
                        >
                          {w}
                        </Chip>
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
                    onSelectionChange={(id) => {
                      setEventType(String(id) as (typeof EVENT_TYPES)[number]);
                    }}
                    selectedKey={eventType}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {EVENT_TYPES.map((type) => (
                          <ListBox.Item id={type} key={type}>
                            {type.replace(/_/g, " ")}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Timestamp</Label>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                      {format(selectedDate, "MMM d, yyyy")}
                    </div>
                    <Select
                      onSelectionChange={(id) =>
                        setEventHour(String(id) ?? "09")
                      }
                      selectedKey={eventHour}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {HOURS.map((h) => (
                            <ListBox.Item id={h} key={h}>
                              {h}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <span className="text-muted-foreground">:</span>
                    <Select
                      onSelectionChange={(id) =>
                        setEventMinute(String(id) ?? "00")
                      }
                      selectedKey={eventMinute}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {MINUTES.map((m) => (
                            <ListBox.Item id={m} key={m}>
                              {m}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Note (optional)</Label>
                  <TextArea
                    onChange={(e) => setEventNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    value={eventNote}
                  />
                </div>
              </div>
              <Modal.Footer>
                <Button onPress={resetForm} variant="outline">
                  Cancel
                </Button>
                <Button
                  isDisabled={isSaving}
                  onPress={editingEvent ? handleUpdateEvent : handleLogEvent}
                >
                  {isSaving
                    ? "Saving..."
                    : editingEvent
                      ? "Update Event"
                      : "Log Event"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Date</Label>
          <Popover>
            <Button
              className="w-[240px] justify-start text-left font-normal"
              variant="outline"
            >
              <CalendarIcon className="mr-2 size-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
            <Popover.Content className="w-auto p-0">
              <Calendar
                aria-label="Select date"
                onChange={(date) => {
                  if (date) {
                    setSelectedDate(new Date(date.toString()));
                  }
                }}
                value={
                  selectedDate
                    ? parseDate(format(selectedDate, "yyyy-MM-dd"))
                    : undefined
                }
              >
                <Calendar.Header>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => <Calendar.Cell date={date} />}
                  </Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
            </Popover.Content>
          </Popover>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Doctor</Label>
          <Select
            onSelectionChange={(id) => setSelectedDoctorId(String(id) ?? "")}
            placeholder="All doctors"
            selectedKey={selectedDoctorId}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="__all__">All doctors</ListBox.Item>
                {doctors
                  .filter((d) => d.status === "ACTIVE")
                  .map((d) => (
                    <ListBox.Item id={d.doctorId} key={d.doctorId}>
                      {d.doctorName}
                    </ListBox.Item>
                  ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-16 w-full" key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CalendarCheckIcon className="size-8 text-muted-foreground/40" />
          <Card.Title className="mt-3 text-base">
            No events for this date
          </Card.Title>
          <Card.Description>
            Log an attendance event to start tracking.
          </Card.Description>
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
                <Card.Content className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full border p-2 ${colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {doctor?.doctorName ?? event.doctorId}
                        </p>
                        <Chip className="text-[10px]" variant="secondary">
                          {event.eventType.replace(/_/g, " ")}
                        </Chip>
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
                      isIconOnly
                      onPress={() => handleEditEvent(event)}
                      variant="ghost"
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      className="text-muted-foreground hover:text-destructive"
                      isIconOnly
                      onPress={() => handleDeleteEvent(event.id)}
                      variant="ghost"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
