import { createFileRoute } from "@tanstack/react-router";
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
import { Link } from "@tanstack/react-router";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Doctor Roster</h1>
          <p className="text-muted-foreground">
            All doctors affiliated with this hospital.
          </p>
        </div>
        <Link
          params={{ tenantId }}
          to="/tenant/$tenantId/invite"
          className={buttonVariants({ size: "sm" })}
        >
          <UserPlusIcon className="mr-2 size-4" />
          Invite Doctor
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mt-2 h-8 w-full" />
            <Skeleton className="mt-2 h-8 w-full" />
          </CardContent>
        </Card>
      ) : !data?.affiliations?.length ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardTitle className="mb-1">No doctors yet</CardTitle>
          <CardDescription className="mb-4">
            Invite doctors to join this hospital.
          </CardDescription>
          <Link
            params={{ tenantId }}
            to="/tenant/$tenantId/invite"
            className={buttonVariants({})}
          >
            <UserPlusIcon className="mr-2 size-4" />
            Invite Doctor
          </Link>
        </Card>
      ) : (
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
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {aff.availabilityWindows?.map((w, i) => (
                        <span key={i} className="text-xs">
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
      )}
    </div>
  );
}
