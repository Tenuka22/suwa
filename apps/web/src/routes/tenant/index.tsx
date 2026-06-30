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
  BuildingIcon,
  MapPinIcon,
  PlusIcon,
  StethoscopeIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { useListTenants } from "@/hooks/queries/tenant";
import { buildHeadFromKey } from "../__root";

export const Route = createFileRoute("/tenant/")({
  head: () => buildHeadFromKey("web:tenant:index"),
  component: TenantListPage,
});

function TenantListPage() {
  const { data, isLoading } = useListTenants();
  const tenants = data?.tenants ?? [];
  let content: ReactNode;

  if (isLoading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card
            className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md"
            key={i}
          >
            <CardHeader>
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  } else if (tenants.length) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            params={{ tenantId: tenant.id }}
            to="/tenant/$tenantId"
          >
            <Card className="h-full cursor-pointer overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-[0_28px_80px_color-mix(in_oklch,var(--foreground)_14%,transparent)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-border bg-background p-3 text-muted-foreground">
                      <StethoscopeIcon className="size-5" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <CardTitle className="text-lg tracking-tight">
                        {tenant.name}
                      </CardTitle>
                      <Badge
                        className="h-6 w-fit rounded-full px-3 text-[10px]"
                        variant={
                          tenant.type === "PRIVATE_HOSPITAL"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {tenant.type === "PRIVATE_HOSPITAL"
                          ? "Private"
                          : "Public"}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    className="h-6 rounded-full px-3 text-[10px]"
                    variant={getTenantStatusVariant(tenant.status)}
                  >
                    {tenant.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <MapPinIcon className="size-3.5" />
                  <span className="truncate">{tenant.address}</span>
                </div>
                {tenant.services && tenant.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tenant.services.slice(0, 4).map((service) => (
                      <Badge
                        className="h-6 rounded-full border-border bg-background/72 px-3 text-[10px] text-foreground"
                        key={service}
                        variant="outline"
                      >
                        {service}
                      </Badge>
                    ))}
                    {tenant.services.length > 4 && (
                      <Badge
                        className="h-6 rounded-full border-border bg-background/72 px-3 text-[10px] text-foreground"
                        variant="outline"
                      >
                        +{tenant.services.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  } else {
    content = (
      <Card className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border-border/95 bg-card/82 p-8 text-center shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
        <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
          <BuildingIcon className="size-8" />
        </div>
        <CardTitle className="text-2xl tracking-tight">
          No hospitals yet
        </CardTitle>
        <CardDescription className="max-w-md text-center text-muted-foreground leading-7">
          Register your first hospital to start managing doctors, attendance,
          and tenant operations.
        </CardDescription>
        <Link
          className={buttonVariants({
            className:
              "h-12 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90",
          })}
          to="/tenant/create"
        >
          <PlusIcon className="size-4" />
          Register Hospital
        </Link>
      </Card>
    );
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:flex-row sm:items-center sm:p-6">
          <div className="flex flex-col gap-3">
            <Badge className="h-7 w-fit rounded-full bg-primary px-3 text-primary-foreground">
              Tenant workspace
            </Badge>
            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
                My Hospitals
              </h1>
              <p className="max-w-[58ch] text-base text-muted-foreground leading-7">
                Manage your hospital organizations, tenant settings, doctors,
                services, and attendance readiness from one calm workspace.
              </p>
            </div>
          </div>
          <Link
            className={buttonVariants({
              className:
                "h-12 rounded-full bg-primary px-5 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90",
            })}
            to="/tenant/create"
          >
            <PlusIcon className="size-4" />
            Register Hospital
          </Link>
        </div>

        {content}
      </div>
    </div>
  );
}

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
