import { Button, Card, Chip, Skeleton } from "@heroui/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarCheckIcon,
  MapPinIcon,
  PhoneIcon,
  StethoscopeIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import {
  useGetTenant,
  useListTenantAffiliations,
} from "@/hooks/queries/tenant";

export const Route = createFileRoute("/tenant/$tenantId/")({
  component: TenantDashboardPage,
});

function TenantDashboardPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { data: tenantData, isLoading: tenantLoading } = useGetTenant(tenantId);
  const { data: affiliationsData, isLoading: affLoading } =
    useListTenantAffiliations(tenantId);

  const tenant = tenantData?.tenant;
  const affiliations = affiliationsData?.affiliations ?? [];
  const activeDoctors = affiliations.filter((a) => a.status === "ACTIVE");

  if (tenantLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Card.Header>
                <Skeleton className="h-4 w-20" />
              </Card.Header>
              <Card.Content>
                <Skeleton className="h-8 w-12" />
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card className="flex flex-col items-center justify-center">
        <Card.Title>Hospital not found</Card.Title>
        <Card.Description>
          The hospital you're looking for doesn't exist.
        </Card.Description>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-semibold text-lg tracking-tight">
            {tenant.name}
          </h1>
          <div className="flex items-center gap-3">
            <Chip
              color={tenant.type === "PRIVATE_HOSPITAL" ? "accent" : "default"}
              variant="soft"
            >
              {tenant.type === "PRIVATE_HOSPITAL" ? "Private" : "Public"}
            </Chip>
            <Chip
              color={
                tenant.status === "ACTIVE"
                  ? "accent"
                  : tenant.status === "SUSPENDED"
                    ? "danger"
                    : "default"
              }
              variant={
                tenant.status === "ACTIVE"
                  ? "soft"
                  : tenant.status === "SUSPENDED"
                    ? "soft"
                    : "secondary"
              }
            >
              {tenant.status}
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" />
              {tenant.address}
            </div>
            {tenant.phone && (
              <div className="flex items-center gap-1.5">
                <PhoneIcon className="size-3.5" />
                {tenant.phone}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onPress={() =>
              navigate({ to: "/tenant/$tenantId/invite", params: { tenantId } })
            }
            size="sm"
            variant="outline"
          >
            <UserPlusIcon className="size-4" />
            Invite Doctor
          </Button>
          <Button
            onPress={() =>
              navigate({
                to: "/tenant/$tenantId/settings",
                params: { tenantId },
              })
            }
            size="sm"
          >
            Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Card.Header>
            <Card.Description>Active Doctors</Card.Description>
            <Card.Title className="font-semibold text-2xl">
              {affLoading ? "..." : activeDoctors.length}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <UsersIcon className="size-4 text-muted-foreground" />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Description>Total Affiliations</Card.Description>
            <Card.Title className="font-semibold text-2xl">
              {affLoading ? "..." : affiliations.length}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <StethoscopeIcon className="size-4 text-muted-foreground" />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Description>Services</Card.Description>
            <Card.Title className="font-semibold text-2xl">
              {tenant.services?.length ?? 0}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <CalendarCheckIcon className="size-4 text-muted-foreground" />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Description>Admins</Card.Description>
            <Card.Title className="font-semibold text-2xl">
              {tenantData?.admins?.length ?? 0}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <UsersIcon className="size-4 text-muted-foreground" />
          </Card.Content>
        </Card>
      </div>

      {tenant.services && tenant.services.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title className="text-base">Services Offered</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-2">
              {tenant.services.map((service: string) => (
                <Chip key={service} variant="secondary">
                  {service}
                </Chip>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link params={{ tenantId }} to="/tenant/$tenantId/doctors">
          <Card className="cursor-pointer transition-colors hover:border-primary/50">
            <Card.Header>
              <div className="flex items-center gap-2">
                <UsersIcon className="size-5 text-primary" />
                <Card.Title className="text-base">Doctor Roster</Card.Title>
              </div>
              <Card.Description>
                View affiliated doctors and their status
              </Card.Description>
            </Card.Header>
          </Card>
        </Link>

        <Link params={{ tenantId }} to="/tenant/$tenantId/attendance">
          <Card className="cursor-pointer transition-colors hover:border-primary/50">
            <Card.Header>
              <div className="flex items-center gap-2">
                <CalendarCheckIcon className="size-5 text-primary" />
                <Card.Title className="text-base">Attendance</Card.Title>
              </div>
              <Card.Description>Manage doctor attendance logs</Card.Description>
            </Card.Header>
          </Card>
        </Link>

        {tenant.type === "PUBLIC_HOSPITAL" && (
          <Link params={{ tenantId }} to="/tenant/$tenantId/clinics">
            <Card className="cursor-pointer transition-colors hover:border-primary/50">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="size-5 text-primary" />
                  <Card.Title className="text-base">Clinics</Card.Title>
                </div>
                <Card.Description>
                  Manage clinics within this hospital
                </Card.Description>
              </Card.Header>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
