import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { buttonVariants } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zen-doc/ui/components/table";
import { UserPlusIcon } from "lucide-react";

import { useListTenantAffiliations } from "@/hooks/queries/tenant";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Route = createFileRoute("/tenant/$tenantId/doctors")({
  component: TenantDoctorsPage,
});

function TenantDoctorsPage() {
  const { tenantId } = Route.useParams();
  const { data, isLoading } = useListTenantAffiliations(tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg tracking-tight">
            Doctor Roster
          </h1>
          <p className="text-muted-foreground">
            All doctors affiliated with this hospital.
          </p>
        </div>
        <Link
          className={buttonVariants({ size: "sm" })}
          params={{ tenantId }}
          to="/tenant/$tenantId/invite"
        >
          <UserPlusIcon className="size-4" />
          Invite Doctor
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ) : data?.affiliations?.length ? (
        <Card>
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
              {data.affiliations.map((aff) => (
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
                    <Badge
                      variant={
                        aff.status === "ACTIVE"
                          ? "default"
                          : aff.status === "INACTIVE"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {aff.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {aff.doctorSpecialties?.map((s) => (
                        <Badge
                          className="text-[10px]"
                          key={s}
                          variant="outline"
                        >
                          {s}
                        </Badge>
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
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center">
          <CardTitle>No doctors yet</CardTitle>
          <CardDescription>
            Invite doctors to join this hospital.
          </CardDescription>
          <Link
            className={buttonVariants({})}
            params={{ tenantId }}
            to="/tenant/$tenantId/invite"
          >
            <UserPlusIcon className="size-4" />
            Invite Doctor
          </Link>
        </Card>
      )}
    </div>
  );
}
