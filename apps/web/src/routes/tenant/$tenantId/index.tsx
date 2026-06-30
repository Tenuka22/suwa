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
import { buildHeadFromKey } from "../../__root";

function getTenantStatusVariant(
  status: string
): "default" | "destructive" | "outline" {
  if (status === "ACTIVE") {
    return "default";
  }

  if (status === "SUSPENDED") {
    return "destructive";
  }

  return "outline";
}

export const Route = createFileRoute("/tenant/$tenantId/")({
  head: () => buildHeadFromKey("web:tenant:detail"),
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
      <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-8 w-64 rounded-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card
                  className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md"
                  key={i}
                >
                  <CardHeader>
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12 rounded-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
        />
        <Card className="w-full max-w-md rounded-[2rem] border-border/95 bg-card/82 p-2 text-center shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_12%,transparent)] backdrop-blur-md">
          <CardHeader className="flex items-center justify-center gap-4 text-center">
            <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
              <StethoscopeIcon className="size-8" />
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl tracking-tight">
                Hospital not found
              </CardTitle>
              <CardDescription className="text-muted-foreground leading-7">
                The hospital you're looking for doesn't exist.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

    const typeVariant = tenant.type === "PRIVATE_HOSPITAL" ? "default" : "secondary";
  const typeLabel = tenant.type === "PRIVATE_HOSPITAL" ? "Private" : "Public";

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:flex-row sm:items-start sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
                {tenant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="h-6 rounded-full px-3 text-[10px]" variant={typeVariant}>
                  {typeLabel}
                </Badge>
                <Badge className="h-6 rounded-full px-3 text-[10px]" variant={getTenantStatusVariant(tenant.status)}>
                  {tenant.status}
                </Badge>
              </div>
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
              className={buttonVariants({
                className:
                  "h-10 rounded-full border-border bg-card px-4 text-foreground hover:bg-muted",
                size: "sm",
                variant: "outline",
              })}
              params={{ tenantId }}
              to="/tenant/$tenantId/invite"
            >
              <UserPlusIcon className="size-4" />
              Invite Doctor
            </Link>
            <Link
              className={buttonVariants({
                className:
                  "h-10 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90",
                size: "sm",
                variant: "default",
              })}
              params={{ tenantId }}
              to="/tenant/$tenantId/settings"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Active Doctors</CardDescription>
              <CardTitle className="font-semibold text-2xl">
                {affLoading ? "..." : activeDoctors.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-full border border-border bg-background p-2 text-muted-foreground w-fit">
                <UsersIcon className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Total Affiliations</CardDescription>
              <CardTitle className="font-semibold text-2xl">
                {affLoading ? "..." : affiliations.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-full border border-border bg-background p-2 text-muted-foreground w-fit">
                <StethoscopeIcon className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Services</CardDescription>
              <CardTitle className="font-semibold text-2xl">
                {tenant.services?.length ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-full border border-border bg-background p-2 text-muted-foreground w-fit">
                <CalendarCheckIcon className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardDescription>Admins</CardDescription>
              <CardTitle className="font-semibold text-2xl">
                {tenantData?.admins?.length ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-full border border-border bg-background p-2 text-muted-foreground w-fit">
                <UsersIcon className="size-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        {tenant.services && tenant.services.length > 0 && (
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="tracking-tight">Services Offered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tenant.services.map((service: string) => (
                  <Badge
                    className="h-7 rounded-full border-border bg-background/72 px-3 text-foreground"
                    key={service}
                    variant="outline"
                  >
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
            <Card className="h-full cursor-pointer overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-[0_28px_80px_color-mix(in_oklch,var(--foreground)_14%,transparent)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                    <UsersIcon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <CardTitle className="tracking-tight">Doctor Roster</CardTitle>
                    <CardDescription>
                      View affiliated doctors and their status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link params={{ tenantId }} to="/tenant/$tenantId/attendance">
            <Card className="h-full cursor-pointer overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-[0_28px_80px_color-mix(in_oklch,var(--foreground)_14%,transparent)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                    <CalendarCheckIcon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <CardTitle className="tracking-tight">Attendance</CardTitle>
                    <CardDescription>Manage doctor attendance logs</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {tenant.type === "PUBLIC_HOSPITAL" && (
            <Link params={{ tenantId }} to="/tenant/$tenantId/clinics">
              <Card className="h-full cursor-pointer overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-[0_28px_80px_color-mix(in_oklch,var(--foreground)_14%,transparent)]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-border bg-background p-2.5 text-muted-foreground">
                      <StethoscopeIcon className="size-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <CardTitle className="tracking-tight">Clinics</CardTitle>
                      <CardDescription>
                        Manage clinics within this hospital
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
