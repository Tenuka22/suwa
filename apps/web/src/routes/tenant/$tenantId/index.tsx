import { Badge } from "@suwa/ui/components/badge";
import { buttonVariants } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Skeleton } from "@suwa/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
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
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card className="flex flex-col items-center justify-center">
        <CardTitle>Hospital not found</CardTitle>
        <CardDescription>
          The hospital you're looking for doesn't exist.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-semibold text-lg tracking-tight">
            {tenant.name}
          </h1>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                tenant.type === "PRIVATE_HOSPITAL" ? "default" : "secondary"
              }
            >
              {tenant.type === "PRIVATE_HOSPITAL" ? "Private" : "Public"}
            </Badge>
            <Badge
              variant={
                tenant.status === "ACTIVE"
                  ? "default"
                  : tenant.status === "SUSPENDED"
                    ? "destructive"
                    : "outline"
              }
            >
              {tenant.status}
            </Badge>
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
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            params={{ tenantId }}
            to="/tenant/$tenantId/invite"
          >
            <UserPlusIcon className="size-4" />
            Invite Doctor
          </Link>
          <Link
            className={buttonVariants({ size: "sm" })}
            params={{ tenantId }}
            to="/tenant/$tenantId/settings"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Active Doctors</CardDescription>
            <CardTitle className="font-semibold text-2xl">
              {affLoading ? "..." : activeDoctors.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Affiliations</CardDescription>
            <CardTitle className="font-semibold text-2xl">
              {affLoading ? "..." : affiliations.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StethoscopeIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Services</CardDescription>
            <CardTitle className="font-semibold text-2xl">
              {tenant.services?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarCheckIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Admins</CardDescription>
            <CardTitle className="font-semibold text-2xl">
              {tenantData?.admins?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      {tenant.services && tenant.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services Offered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tenant.services.map((service: string) => (
                <Badge key={service} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Nav */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link params={{ tenantId }} to="/tenant/$tenantId/doctors">
          <Card className="cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersIcon className="size-5 text-primary" />
                <CardTitle className="text-base">Doctor Roster</CardTitle>
              </div>
              <CardDescription>
                View affiliated doctors and their status
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link params={{ tenantId }} to="/tenant/$tenantId/attendance">
          <Card className="cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarCheckIcon className="size-5 text-primary" />
                <CardTitle className="text-base">Attendance</CardTitle>
              </div>
              <CardDescription>Manage doctor attendance logs</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {tenant.type === "PUBLIC_HOSPITAL" && (
          <Link params={{ tenantId }} to="/tenant/$tenantId/clinics">
            <Card className="cursor-pointer transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="size-5 text-primary" />
                  <CardTitle className="text-base">Clinics</CardTitle>
                </div>
                <CardDescription>
                  Manage clinics within this hospital
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
