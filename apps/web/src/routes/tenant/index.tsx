import { Button, Card, Chip, Skeleton } from "@heroui/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const { data, isLoading } = useListTenants();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg tracking-tight">My Hospitals</h1>
          <p className="text-muted-foreground">
            Manage your hospital organizations and tenant settings.
          </p>
        </div>
        <Button onPress={() => navigate({ to: "/tenant/create" })} size="sm">
          <PlusIcon className="size-4" />
          Register Hospital
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Card.Header>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </Card.Header>
              <Card.Content>
                <Skeleton className="h-4 w-full" />
              </Card.Content>
            </Card>
          ))}
        </div>
      ) : data?.tenants?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tenants.map((tenant) => (
            <Link
              key={tenant.id}
              params={{ tenantId: tenant.id }}
              to="/tenant/$tenantId"
            >
              <Card className="cursor-pointer transition-colors hover:border-primary/50 hover:shadow-md">
                <Card.Header>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg border bg-muted/40 p-2">
                        <StethoscopeIcon className="size-4 text-primary" />
                      </div>
                      <div>
                        <Card.Title className="text-base">
                          {tenant.name}
                        </Card.Title>
                        <Chip
                          className="text-[10px]"
                          color={
                            tenant.type === "PRIVATE_HOSPITAL"
                              ? "accent"
                              : "default"
                          }
                          variant="soft"
                        >
                          {tenant.type === "PRIVATE_HOSPITAL"
                            ? "Private"
                            : "Public"}
                        </Chip>
                      </div>
                    </div>
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
                </Card.Header>
                <Card.Content>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPinIcon className="size-3.5" />
                    <span className="truncate">{tenant.address}</span>
                  </div>
                  {tenant.services && tenant.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tenant.services.slice(0, 4).map((service) => (
                        <Chip
                          className="text-[10px]"
                          key={service}
                          variant="secondary"
                        >
                          {service}
                        </Chip>
                      ))}
                      {tenant.services.length > 4 && (
                        <Chip className="text-[10px]" variant="secondary">
                          +{tenant.services.length - 4}
                        </Chip>
                      )}
                    </div>
                  )}
                </Card.Content>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center">
          <BuildingIcon className="size-12 text-muted-foreground/40" />
          <Card.Title>No hospitals yet</Card.Title>
          <Card.Description className="text-center">
            Register your first hospital to start managing doctors and
            attendance.
          </Card.Description>
          <Button onPress={() => navigate({ to: "/tenant/create" })} size="sm">
            <PlusIcon className="size-4" />
            Register Hospital
          </Button>
        </Card>
      )}
    </div>
  );
}
