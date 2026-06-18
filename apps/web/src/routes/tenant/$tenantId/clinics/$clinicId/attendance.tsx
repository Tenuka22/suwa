import {
  Button,
  Calendar,
  Card,
  Label,
  ListBox,
  Popover,
  Select,
  toast,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  LogInIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";

import {
  useGetClinicAttendance,
  useListTenantAffiliations,
  useMarkClinicAttendance,
} from "@/hooks/queries/tenant";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export const Route = createFileRoute(
  "/tenant/$tenantId/clinics/$clinicId/attendance"
)({
  component: ClinicAttendancePage,
});

function ClinicAttendancePage() {
  const { tenantId, clinicId } = Route.useParams();
  const today = new Date().toISOString().split("T")[0]!;

  const [attendanceDate, setAttendanceDate] = useState(today);
  const [attendanceDoctorId, setAttendanceDoctorId] = useState("");
  const [arrivedAt, setArrivedAt] = useState("");
  const [leftAt, setLeftAt] = useState("");

  const { data: attendanceData, refetch: refetchAttendance } =
    useGetClinicAttendance(clinicId, attendanceDate);

  const { data: affiliationsData } = useListTenantAffiliations(tenantId);
  const markAttendance = useMarkClinicAttendance();

  const doctors = (affiliationsData?.affiliations ?? []).filter(
    (d) => d.status === "ACTIVE"
  );

  const clinic = attendanceData?.clinic;
  const attendanceRecords = attendanceData?.records ?? [];

  const handleMarkAttendance = async () => {
    if (!attendanceDoctorId) {
      toast.danger("Please select a doctor");
      return;
    }

    try {
      await markAttendance.mutateAsync({
        clinicId,
        doctorId: attendanceDoctorId,
        date: attendanceDate,
        arrivedAt: arrivedAt
          ? new Date(`${attendanceDate}T${arrivedAt}`).toISOString()
          : undefined,
        leftAt: leftAt
          ? new Date(`${attendanceDate}T${leftAt}`).toISOString()
          : undefined,
      });
      toast.success("Attendance marked");
      refetchAttendance();
      setAttendanceDoctorId("");
      setArrivedAt("");
      setLeftAt("");
    } catch {
      toast.danger("Failed to mark attendance");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
            params={{ tenantId }}
            to="/tenant/$tenantId/clinics"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Clinics
          </Link>
        </div>
      </div>

      <div>
        <h1 className="font-semibold text-lg tracking-tight">
          {clinic?.name ? `Attendance - ${clinic.name}` : "Attendance"}
        </h1>
        <p className="text-muted-foreground">
          Mark and view doctor attendance for this clinic.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <Card.Header className="pb-3">
              <div className="flex items-center justify-between">
                <Card.Title className="text-sm">Mark Attendance</Card.Title>
                <div className="flex items-center gap-2">
                  <Popover>
                    <Button
                      className="justify-start text-left font-normal"
                      size="sm"
                      variant="outline"
                    >
                      <CalendarIcon className="mr-1 size-3" />
                      {attendanceDate
                        ? format(new Date(attendanceDate), "PPP")
                        : "Pick a date"}
                    </Button>
                    <Popover.Content className="w-auto p-0">
                      <Calendar
                        aria-label="Select date"
                        onChange={(date) => {
                          if (date) {
                            setAttendanceDate(date.toString());
                          }
                        }}
                        value={
                          attendanceDate
                            ? parseDate(attendanceDate.split("T")[0]!)
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
                            {(day) => (
                              <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                            )}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>
                            {(date) => <Calendar.Cell date={date} />}
                          </Calendar.GridBody>
                        </Calendar.Grid>
                      </Calendar>
                    </Popover.Content>
                  </Popover>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Doctor</Label>
                  <Select
                    onSelectionChange={(id) =>
                      setAttendanceDoctorId(String(id) ?? "")
                    }
                    placeholder="Select doctor..."
                    selectedKey={attendanceDoctorId}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {doctors.length === 0 && (
                          <p className="px-2 py-4 text-center text-muted-foreground text-xs">
                            No active doctors found.
                          </p>
                        )}
                        {doctors.map((d) => (
                          <ListBox.Item id={d.doctorId} key={d.doctorId}>
                            <div className="flex items-center gap-2">
                              <UserIcon className="size-3" />
                              {d.doctorName}
                            </div>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Arrived at</Label>
                    <Select
                      onSelectionChange={(id) => setArrivedAt(String(id) ?? "")}
                      placeholder="--:--"
                      selectedKey={arrivedAt}
                    >
                      <Select.Trigger className="w-full">
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
                  <div className="flex flex-col gap-2">
                    <Label>Scheduled leave</Label>
                    <Select
                      onSelectionChange={(id) => setLeftAt(String(id) ?? "")}
                      placeholder="--:--"
                      selectedKey={leftAt}
                    >
                      <Select.Trigger className="w-full">
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
                </div>

                <Button
                  isDisabled={markAttendance.isPending || !attendanceDoctorId}
                  onPress={handleMarkAttendance}
                >
                  {markAttendance.isPending ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>

        <Card>
          <Card.Header className="pb-3">
            <Card.Title className="text-sm">
              Records for{" "}
              {attendanceDate
                ? format(new Date(attendanceDate), "MMM d, yyyy")
                : "selected date"}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {attendanceRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <ClockIcon className="size-8 text-muted-foreground/30" />
                <p className="text-muted-foreground text-xs">
                  No attendance records for this date.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {attendanceRecords.map((r) => {
                  const doctor = doctors.find((d) => d.doctorId === r.doctorId);
                  return (
                    <div
                      className="flex items-center gap-2 rounded-md border border-border/40 px-3 py-2"
                      key={r.id}
                    >
                      <UserIcon className="size-3 shrink-0 text-muted-foreground" />
                      <span className="flex-1 font-medium text-xs">
                        {doctor?.doctorName ?? r.doctorId}
                      </span>
                      {r.arrivedAt && (
                        <span className="flex items-center gap-1 text-[10px] text-green-600">
                          <LogInIcon className="size-3" />
                          {new Date(r.arrivedAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      )}
                      {r.leftAt && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600">
                          <LogOutIcon className="size-3" />
                          {new Date(r.leftAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
