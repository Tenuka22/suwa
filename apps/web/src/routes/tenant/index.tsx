import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { buttonVariants } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import {
  BuildingIcon,
  MapPinIcon,
  PlusIcon,
  StethoscopeIcon,
} from "lucide-react";

import { useListTenants } from "@/hooks/queries/tenant";

export const Route = createFileRoute("/tenant/")({
  component: TenantListPage,
});

function TenantListPage() {
  const { data, isLoading } = useListTenants();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">My Hospitals</h1>
          <p className="text-muted-foreground">
            Manage your hospital organizations and tenant settings.
          </p>
        </div>
        <Link
          to="/tenant/create"
          className={buttonVariants({})}
        >
          <PlusIcon className="mr-2 size-4" />
          Register Hospital
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data?.tenants?.length ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <BuildingIcon className="mb-4 size-12 text-muted-foreground/40" />
          <CardTitle className="mb-1">No hospitals yet</CardTitle>
          <CardDescription className="mb-4 text-center">
            Register your first hospital to start managing doctors and
            attendance.
          </CardDescription>
          <Link
            to="/tenant/create"
            className={buttonVariants({})}
          >
            <PlusIcon className="mr-2 size-4" />
            Register Hospital
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tenants.map((tenant) => (
            <Link
              key={tenant.id}
              params={{ tenantId: tenant.id }}
              to="/tenant/$tenantId"
            >
              <Card className="cursor-pointer transition-colors hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg border bg-muted/40 p-2">
                        <StethoscopeIcon className="size-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {tenant.name}
                        </CardTitle>
                        <Badge
                          variant={
                            tenant.type === "PRIVATE_HOSPITAL"
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1 text-[10px]"
                        >
                          {tenant.type === "PRIVATE_HOSPITAL"
                            ? "Private"
                            : "Public"}
                        </Badge>
                      </div>
                    </div>
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
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPinIcon className="size-3.5" />
                    <span className="truncate">{tenant.address}</span>
                  </div>
                  {tenant.services && tenant.services.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tenant.services.slice(0, 4).map((service) => (
                        <Badge
                          key={service}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {service}
                        </Badge>
                      ))}
                      {tenant.services.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">
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
      )}
    </div>
  );
}
