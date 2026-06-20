import { Button, Chip, Separator, Skeleton } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StethoscopeIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { BodyText, PageTitle } from "@/components/typography";

import { useListTenantAffiliations } from "@/hooks/queries/tenant";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Route = createFileRoute("/tenant/$tenantId/doctors")({
  component: TenantDoctorsPage,
});

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-foreground/50" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-foreground/60 text-sm">{label}</span>
    </div>
  );
}

function TenantDoctorsPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useListTenantAffiliations(tenantId);

  const affiliations = data?.affiliations ?? [];

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
              <h1 className="font-light text-2xl tracking-tight">
                Doctor Roster
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <UsersIcon className="size-3" />
                </div>
                Hospital staff
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              All doctors affiliated with this hospital.
            </BodyText>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Button
              onPress={() =>
                navigate({
                  to: "/tenant/$tenantId/invite",
                  params: { tenantId },
                })
              }
              size="sm"
            >
              <UserPlusIcon className="size-4" />
              Invite Doctor
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={UsersIcon}
            label="affiliated doctors"
            value={affiliations.length.toString()}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>Affiliated doctors</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Manage doctors and their hospital affiliations.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : affiliations.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Availability Windows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliations.map((aff) => (
                  <TableRow key={aff.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{aff.doctorName}</p>
                        <p className="text-muted-foreground text-xs">
                          {aff.doctorId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          aff.status === "ACTIVE"
                            ? "accent"
                            : aff.status === "INACTIVE"
                              ? "default"
                              : "default"
                        }
                        variant={
                          aff.status === "ACTIVE"
                            ? "soft"
                            : aff.status === "INACTIVE"
                              ? "soft"
                              : "secondary"
                        }
                      >
                        {aff.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {aff.doctorSpecialties?.map((s) => (
                          <Chip
                            className="text-[10px]"
                            key={s}
                            variant="secondary"
                          >
                            {s}
                          </Chip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {aff.availabilityWindows?.map((w, i) => (
                          <span className="text-xs" key={i}>
                            {DAYS[w.dayOfWeek]} {w.startTime}–{w.endTime}
                          </span>
                        ))}
                        {(!aff.availabilityWindows ||
                          aff.availabilityWindows.length === 0) && (
                          <span className="text-muted-foreground text-xs">
                            No windows set
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <StethoscopeIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No doctors yet</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Invite doctors to join this hospital.
            </p>
            <Button
              onPress={() =>
                navigate({
                  to: "/tenant/$tenantId/invite",
                  params: { tenantId },
                })
              }
              size="sm"
            >
              <UserPlusIcon className="size-4" />
              Invite Doctor
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
