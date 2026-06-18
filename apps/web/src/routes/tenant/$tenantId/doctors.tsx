import { Button, Card, Chip, Skeleton } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserPlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";

import { useListTenantAffiliations } from "@/hooks/queries/tenant";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Route = createFileRoute("/tenant/$tenantId/doctors")({
  component: TenantDoctorsPage,
});

function TenantDoctorsPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
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
        <Button
          onPress={() =>
            navigate({ to: "/tenant/$tenantId/invite", params: { tenantId } })
          }
          size="sm"
        >
          <UserPlusIcon className="size-4" />
          Invite Doctor
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <Card.Content>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </Card.Content>
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
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center">
          <Card.Title>No doctors yet</Card.Title>
          <Card.Description>
            Invite doctors to join this hospital.
          </Card.Description>
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
        </Card>
      )}
    </div>
  );
}
