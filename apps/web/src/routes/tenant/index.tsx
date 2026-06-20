import { Button, Card, Chip, Separator, Skeleton } from "@heroui/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BuildingIcon,
  MapPinIcon,
  PlusIcon,
  StethoscopeIcon,
} from "lucide-react";

import { BodyText, PageTitle } from "@/components/typography";
import { useListTenants } from "@/hooks/queries/tenant";

export const Route = createFileRoute("/tenant/")({
  component: TenantListPage,
});

function TenantListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useListTenants();

  const tenants = data?.tenants ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent/10">
            <BuildingIcon className="size-6 text-accent" />
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                My Hospitals
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <BuildingIcon className="size-3" />
                </div>
                Tenant management
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Manage your hospital organizations and tenant settings.
            </BodyText>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Button
              onPress={() => navigate({ to: "/tenant/create" })}
              size="sm"
            >
              <PlusIcon className="size-4" />
              Register Hospital
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>All hospitals</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            {tenants.length} hospital{tenants.length === 1 ? "" : "s"}{" "}
            registered under your account.
          </p>
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
        ) : tenants.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
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
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <BuildingIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No hospitals yet</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Register your first hospital to start managing doctors and
              attendance.
            </p>
            <Button
              onPress={() => navigate({ to: "/tenant/create" })}
              size="sm"
            >
              <PlusIcon className="size-4" />
              Register Hospital
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
