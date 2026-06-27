import { Button } from "@suwa/ui/components/button";
import { Calendar } from "@suwa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
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
import { toast } from "sonner";

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
      toast.error("Please select a doctor");
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
      toast.error("Failed to mark attendance");
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Mark Attendance</CardTitle>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          className="justify-start text-left font-normal"
                          size="sm"
                          variant="outline"
                        />
                      }
                    >
                      <CalendarIcon className="mr-1 size-3" />
                      {attendanceDate
                        ? format(new Date(attendanceDate), "PPP")
                        : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        onSelect={(date) => {
                          if (date) {
                            setAttendanceDate(format(date, "yyyy-MM-dd"));
                          }
                        }}
                        selected={
                          attendanceDate ? new Date(attendanceDate) : undefined
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Doctor</Label>
                  <Select
                    onValueChange={(v) => setAttendanceDoctorId(v ?? "")}
                    value={attendanceDoctorId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.length === 0 && (
                        <p className="px-2 py-4 text-center text-muted-foreground text-xs">
                          No active doctors found.
                        </p>
                      )}
                      {doctors.map((d) => (
                        <SelectItem key={d.doctorId} value={d.doctorId}>
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-3" />
                            {d.doctorName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Arrived at</Label>
                    <Select
                      onValueChange={(v) => setArrivedAt(v ?? "")}
                      value={arrivedAt}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="--:--" />
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
                  <div className="flex flex-col gap-2">
                    <Label>Scheduled leave</Label>
                    <Select
                      onValueChange={(v) => setLeftAt(v ?? "")}
                      value={leftAt}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="--:--" />
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
                </div>

                <Button
                  disabled={markAttendance.isPending || !attendanceDoctorId}
                  onClick={handleMarkAttendance}
                >
                  {markAttendance.isPending ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Records for{" "}
              {attendanceDate
                ? format(new Date(attendanceDate), "MMM d, yyyy")
                : "selected date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
