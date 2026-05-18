import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zen-doc/ui/components/alert-dialog";
import { Button } from "@zen-doc/ui/components/button";
import { Calendar } from "@zen-doc/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zen-doc/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@zen-doc/ui/components/tooltip";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";
import { CalendarHeader, CalendarMonthView } from "./components/-index";
import { scheduleNotes, schedulePageSchema, timeOptions } from "./utils/-types";

function parseScheduleEntry(entry: unknown): ScheduleEntry {
  return entry as ScheduleEntry;
}

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function subMonths(date: Date, amount: number): Date {
  return addMonths(date, -amount);
}

function formatLabel(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function toLocalDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function getDayLabel(date: Date | null): string {
  return date ? format(date, "PP") : "Pick a date";
}

function getEventTone(kind: "open" | "block" | "session"): string {
  if (kind === "open") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (kind === "block") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isBeforeToday(date: Date): boolean {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

function overlaps(
  a: { startAt: string; endAt: string },
  b: { startAt: string; endAt: string }
): boolean {
  return (
    new Date(a.startAt).getTime() <= new Date(b.endAt).getTime() &&
    new Date(a.endAt).getTime() >= new Date(b.startAt).getTime()
  );
}

export const Route = createFileRoute("/doctor/")({
  validateSearch: schedulePageSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }) => {
    const now = new Date();
    const fromDate = startOfMonth(subMonths(now, 1));
    const toDate = endOfMonth(addMonths(now, 1));
    try {
      const initialData = await context.queryClient.fetchQuery({
        queryKey: orpc.listScheduleEntries.queryKey({
          input: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            page: deps.page,
            pageSize: 150,
          },
        }),
        queryFn: () =>
          orpc.listScheduleEntries.call({
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            page: deps.page,
            pageSize: 150,
          }),
      });

      return { initialData, month: now.toISOString() };
    } catch {
      return { initialData: { items: [] }, month: now.toISOString() };
    }
  },
  component: DoctorScheduleRoute,
});

interface ScheduleEntry {
  endAt: string;
  id: string;
  kind: "open" | "block" | "session";
  noteKind: "home" | "work" | "pharmacy" | "after_gym" | "other" | null;
  session: {
    id: string;
    patientId: string;
    startAt: string;
    endAt: string;
    status: string;
  } | null;
  sessionId: string | null;
  startAt: string;
}

interface SessionItem {
  endAt: string;
  id: string;
  patientId: string;
  payoutStatus: string;
  payoutTransferId?: string | null;
  startAt: string;
  status: string;
}

function getPayoutColor(status: string): string {
  if (status === "paid") {
    return "text-emerald-500";
  }
  if (status === "failed") {
    return "text-rose-500";
  }
  return "text-muted-foreground";
}

interface StripeConnectCardProps {
  isPendingLink: boolean;
  isPendingSync: boolean;
  onConnect: () => void;
  onSync: () => void;
  stripeAccountEnabled: boolean;
  stripeAccountId: string | null;
}

function StripeConnectCard({
  stripeAccountId,
  stripeAccountEnabled,
  isPendingLink,
  isPendingSync,
  onConnect,
  onSync,
}: StripeConnectCardProps) {
  return (
    <Card className="relative overflow-hidden border border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-md">
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">
            Stripe Connected Payouts
          </span>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 text-xs dark:text-emerald-400">
            {stripeAccountEnabled ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Connected & Ready
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Action Required
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col justify-between gap-6 py-4">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Configure your Stripe Connected Account to receive automatic
            non-refundable patient booking payouts directly to your bank account
            upon successful session attendance.
          </p>
          <div className="mt-4 flex flex-col gap-1 text-xs">
            <div className="flex justify-between border-border/30 border-b pb-1.5">
              <span className="text-muted-foreground">Stripe Account ID:</span>
              <span className="font-medium font-mono">
                {stripeAccountId || "Not created"}
              </span>
            </div>
            <div className="flex justify-between pt-1.5">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold">
                {stripeAccountEnabled ? (
                  <span className="text-emerald-500">Fully Enabled</span>
                ) : (
                  <span className="text-amber-500">Pending Setup</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex size-full flex-col gap-2">
          {!stripeAccountEnabled && (
            <Button
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              disabled={isPendingLink}
              onClick={onConnect}
            >
              {isPendingLink ? "Connecting..." : "Set Up Stripe Payouts"}
            </Button>
          )}

          {stripeAccountId && (
            <Button
              className="w-full"
              disabled={isPendingSync}
              onClick={onSync}
              variant="outline"
            >
              {isPendingSync ? "Syncing..." : "Refresh Status"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BookedSessionsCardProps {
  isMarkingAttended: boolean;
  isPending: boolean;
  onMarkAttended: (sessionId: string) => void;
  sessions: SessionItem[];
}

function BookedSessionsCard({
  sessions,
  isPending,
  isMarkingAttended,
  onMarkAttended,
}: BookedSessionsCardProps) {
  return (
    <Card className="border border-border/80 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-md">
      <CardHeader className="pb-3">
        <span className="font-semibold text-lg tracking-tight">
          Active Booked Sessions
        </span>
      </CardHeader>
      <CardContent className="h-[250px] overflow-y-auto pr-1">
        {isPending && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Loading sessions...
          </div>
        )}

        {!isPending && sessions.length === 0 && (
          <div className="flex h-[200px] flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-muted-foreground text-sm">
              No booked sessions queue
            </span>
            <span className="text-muted-foreground/70 text-xs">
              When patients book your slots, they will appear here.
            </span>
          </div>
        )}

        {!isPending && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => {
              const start = new Date(session.startAt);
              const end = new Date(session.endAt);
              const formattedTime = `${format(
                start,
                "MMM d, h:mm a"
              )} - ${format(end, "h:mm a")}`;

              return (
                <div
                  className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/60 p-3 transition-colors hover:bg-card"
                  key={session.id}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        Patient ID: {session.patientId.slice(0, 12)}...
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formattedTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                          session.status === "attended"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                        }`}
                      >
                        {session.status}
                      </span>
                      <span
                        className={`font-medium text-[9px] ${getPayoutColor(
                          session.payoutStatus
                        )}`}
                      >
                        Payout: {session.payoutStatus}
                      </span>
                    </div>
                  </div>

                  {session.status === "scheduled" && (
                    <Button
                      className="mt-1 h-8 w-full bg-emerald-600 py-1 text-white text-xs hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                      disabled={isMarkingAttended}
                      onClick={() => onMarkAttended(session.id)}
                    >
                      Confirm Attendance & Payout ($50)
                    </Button>
                  )}

                  {session.status !== "scheduled" &&
                    session.payoutTransferId && (
                      <div className="mt-1 flex items-center justify-between rounded bg-muted/50 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                        <span>Transfer ID:</span>
                        <span className="max-w-[150px] truncate">
                          {session.payoutTransferId}
                        </span>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DoctorScheduleRoute() {
  const user = useUser();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const [month, setMonth] = useState(new Date(loaderData.month));
  const [selectedDate, setSelectedDate] = useState(new Date(loaderData.month));
  const [kind, setKind] = useState<"open" | "block">("open");
  const [noteKind, setNoteKind] = useState("home");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);

  const [minMonth, setMinMonth] = useState(() =>
    startOfMonth(subMonths(new Date(loaderData.month), 1))
  );
  const [maxMonth, setMaxMonth] = useState(() =>
    endOfMonth(addMonths(new Date(loaderData.month), 1))
  );

  const handleMonthChange = (nextMonth: Date) => {
    setMonth(nextMonth);
    const startOfPrev = startOfMonth(subMonths(nextMonth, 1));
    const endOfNext = endOfMonth(addMonths(nextMonth, 1));
    if (startOfPrev.getTime() < minMonth.getTime()) {
      setMinMonth(startOfPrev);
    }
    if (endOfNext.getTime() > maxMonth.getTime()) {
      setMaxMonth(endOfNext);
    }
  };

  const range = useMemo(
    () => ({ from: minMonth.toISOString(), to: maxMonth.toISOString() }),
    [minMonth, maxMonth]
  );

  const scheduleQuery = useQuery({
    queryKey: orpc.listScheduleEntries.queryKey({
      input: { ...range, page: search.page, pageSize: 150 },
    }),
    queryFn: () =>
      orpc.listScheduleEntries.call({
        ...range,
        page: search.page,
        pageSize: 150,
      }),
    initialData: loaderData.initialData,
    enabled: user.isLoaded && !!user.user,
  });

  const createEntry = useMutation(
    orpc.createScheduleEntry.mutationOptions({
      onSuccess: async () => {
        await scheduleQuery.refetch();
      },
    })
  );

  const deleteEntry = useMutation(
    orpc.deleteScheduleEntry.mutationOptions({
      onSuccess: async () => {
        await scheduleQuery.refetch();
      },
    })
  );

  const connectStatusQuery = useQuery({
    queryKey: orpc.getConnectAccountStatus.queryKey(),
    queryFn: () => orpc.getConnectAccountStatus.call(),
    enabled: user.isLoaded && !!user.user,
  });

  const doctorSessionsQuery = useQuery({
    queryKey: orpc.listDoctorSessions.queryKey(),
    queryFn: () => orpc.listDoctorSessions.call(),
    enabled: user.isLoaded && !!user.user,
  });

  const createConnectLink = useMutation(
    orpc.createConnectAccountLink.mutationOptions()
  );

  const syncConnectStatus = useMutation(
    orpc.syncConnectAccountStatus.mutationOptions({
      onSuccess: async () => {
        await connectStatusQuery.refetch();
      },
    })
  );

  const markAttended = useMutation(
    orpc.markSessionAttended.mutationOptions({
      onSuccess: async () => {
        await doctorSessionsQuery.refetch();
        await scheduleQuery.refetch();
      },
    })
  );

  const entries: ScheduleEntry[] = (scheduleQuery.data?.items ?? []).map(
    (entry) => parseScheduleEntry(entry)
  );
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const allDayEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const start = new Date(entry.startAt);
        const end = new Date(entry.endAt);
        const startKey = format(start, "yyyy-MM-dd");
        const endKey = format(end, "yyyy-MM-dd");
        return selectedDateKey >= startKey && selectedDateKey <= endKey;
      }),
    [entries, selectedDateKey]
  );

  const canCreate =
    !!startDate &&
    !!endDate &&
    !isBeforeToday(startDate) &&
    !isBeforeToday(endDate) &&
    startOfDay(startDate).getTime() <= startOfDay(endDate).getTime();

  const invalidReason = useMemo(() => {
    if (!(startDate && endDate)) {
      return "Pick start and end dates.";
    }
    if (isBeforeToday(startDate) || isBeforeToday(endDate)) {
      return "Past dates are disabled.";
    }
    if (startOfDay(startDate).getTime() > startOfDay(endDate).getTime()) {
      return "End date must be on or after start date.";
    }
    return null;
  }, [endDate, startDate]);

  const handleMarkAttended = async (sessionId: string) => {
    try {
      const res = await markAttended.mutateAsync({ sessionId });
      if (res.payoutStatus === "paid") {
        toast.success("Session completed and payout successfully transferred!");
      } else if (res.payoutStatus === "failed") {
        toast.warning(`Session completed but payout suspended: ${res.error}`);
      } else {
        toast.success("Session completed successfully!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error confirming attendance: ${msg}`);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const res = await createConnectLink.mutateAsync({
        returnUrl: window.location.href,
        refreshUrl: window.location.href,
      });
      if (res?.url) {
        toast.info("Redirecting you to Stripe Connect onboarding...");
        window.location.href = res.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to initiate Stripe onboarding: ${msg}`);
    }
  };

  const handleSyncConnectStatus = async () => {
    try {
      const res = await syncConnectStatus.mutateAsync(undefined);
      if (res.enabled) {
        toast.success("Stripe account status synced successfully!");
      } else {
        toast.warning(
          "Stripe account is still pending completion. Please complete onboarding."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to sync: ${msg}`);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      {/* Stripe Connect & Bookings Dashboard Bento Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StripeConnectCard
          isPendingLink={createConnectLink.isPending}
          isPendingSync={syncConnectStatus.isPending}
          onConnect={handleConnectStripe}
          onSync={handleSyncConnectStatus}
          stripeAccountEnabled={!!connectStatusQuery.data?.stripeAccountEnabled}
          stripeAccountId={connectStatusQuery.data?.stripeAccountId ?? null}
        />

        <BookedSessionsCard
          isMarkingAttended={markAttended.isPending}
          isPending={doctorSessionsQuery.isPending}
          onMarkAttended={handleMarkAttended}
          sessions={(doctorSessionsQuery.data?.sessions as SessionItem[]) ?? []}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleMonthChange(subMonths(month, 1))}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-36 text-center font-medium">
              {formatLabel(month)}
            </div>
            <Button
              onClick={() => handleMonthChange(addMonths(month, 1))}
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-kind"
            >
              Type
            </label>
            <Select
              onValueChange={(value) => setKind(value as typeof kind)}
              value={kind}
            >
              <SelectTrigger className="h-9 w-full" id="schedule-kind">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open time</SelectItem>
                <SelectItem value="block">Block time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-note"
            >
              Note
            </label>
            <Select
              disabled={kind !== "open"}
              onValueChange={(value) => setNoteKind(value ?? "home")}
              value={noteKind}
            >
              <SelectTrigger className="h-9 w-full" id="schedule-note">
                <SelectValue placeholder="Select note" />
              </SelectTrigger>
              <SelectContent>
                {scheduleNotes.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-start-picker"
            >
              Start
            </label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger>
                  <Button
                    className="w-full justify-start"
                    id="schedule-start-picker"
                    variant="outline"
                  >
                    {getDayLabel(startDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date: Date) => isBeforeToday(date)}
                    mode="single"
                    onSelect={(date: Date | undefined) =>
                      setStartDate(date ?? null)
                    }
                    selected={startDate ?? undefined}
                  />
                </PopoverContent>
              </Popover>
              <Select
                onValueChange={(value) => setStartTime(value ?? "08:00")}
                value={startTime}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1">
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="schedule-end-picker"
            >
              End
            </label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger>
                  <Button
                    className="w-full justify-start"
                    id="schedule-end-picker"
                    variant="outline"
                  >
                    {getDayLabel(endDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date: Date) => isBeforeToday(date)}
                    mode="single"
                    onSelect={(date: Date | undefined) =>
                      setEndDate(date ?? null)
                    }
                    selected={endDate ?? undefined}
                  />
                </PopoverContent>
              </Popover>
              <Select
                onValueChange={(value) => setEndTime(value ?? "09:00")}
                value={endTime}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    disabled={createEntry.isPending || !canCreate}
                    onClick={() => {
                      if (!(startDate && endDate)) {
                        return;
                      }

                      createEntry.mutate({
                        kind,
                        noteKind:
                          kind === "open"
                            ? (noteKind as
                                | "home"
                                | "work"
                                | "pharmacy"
                                | "after_gym"
                                | "other")
                            : undefined,
                        startAt: toLocalDateTime(
                          startDate,
                          startTime
                        ).toISOString(),
                        endAt: toLocalDateTime(endDate, endTime).toISOString(),
                      });
                    }}
                    variant="default"
                  >
                    <Plus className="mr-2 h-4 w-4" />{" "}
                    {kind === "open" ? "Open" : "Block"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {invalidReason ?? "Create the selected schedule range."}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Calendar</CardTitle>
            <CalendarHeader
              currentMonth={month}
              onMonthChange={handleMonthChange}
            />
          </CardHeader>
          <CardContent>
            <CalendarMonthView
              currentMonth={month}
              entries={entries}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allDayEntries.length > 0 ? (
              allDayEntries.map((entry) => {
                const disabledByBlock =
                  entry.kind === "open" &&
                  entries.some(
                    (other) =>
                      other.id !== entry.id &&
                      (other.kind === "block" || other.kind === "session") &&
                      overlaps(entry, other)
                  );

                return (
                  <div
                    className={`rounded-lg border p-3 ${getEventTone(entry.kind)}`}
                    key={entry.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {entry.kind.toUpperCase()}
                        </div>
                        <div className="text-xs opacity-80">
                          {format(new Date(entry.startAt), "p")} -{" "}
                          {format(new Date(entry.endAt), "p")}
                        </div>
                      </div>
                      {entry.kind === "session" ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Button
                          onClick={() => setDeleteTarget(entry)}
                          size="sm"
                          variant="outline"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 text-xs opacity-80">
                      {entry.noteKind ? `Note: ${entry.noteKind}` : null}
                      {entry.session
                        ? `Session: ${entry.session.status}`
                        : null}
                      {disabledByBlock ? "Disabled by block or session" : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm">
                No entries on this day.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cut off{" "}
              {deleteTarget
                ? format(new Date(deleteTarget.startAt), "PPpp")
                : ""}{" "}
              to{" "}
              {deleteTarget ? format(new Date(deleteTarget.endAt), "PPpp") : ""}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteEntry.mutate({ id: deleteTarget.id });
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
