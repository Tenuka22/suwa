import { Button, Card, Chip, Separator, Skeleton } from "@heroui/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BuildingIcon,
  CalendarCheckIcon,
  MapPinIcon,
  PhoneIcon,
  StethoscopeIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { BodyText, PageTitle } from "@/components/typography";
import {
  useGetTenant,
  useListTenantAffiliations,
} from "@/hooks/queries/tenant";

export const Route = createFileRoute("/tenant/$tenantId/")({
  component: TenantDashboardPage,
});

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BuildingIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-foreground/50" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-foreground/60 text-sm">{label}</span>
    </div>
  );
}

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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-52 rounded-3xl" />
        <Separator />
        <div className="flex flex-wrap gap-x-6 gap-y-2 px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-5 w-40" key={i.toString()} />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
          <BuildingIcon className="size-6 text-foreground/40" />
        </div>
        <p className="font-light text-sm">Hospital not found</p>
        <p className="max-w-xs font-light text-foreground/60 text-sm">
          The hospital you're looking for doesn't exist.
        </p>
      </div>
    );
  }

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
                {tenant.name}
              </h1>
              <Chip
                color={
                  tenant.type === "PRIVATE_HOSPITAL" ? "accent" : "default"
                }
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

            <div className="flex flex-wrap items-center gap-4">
              <BodyText className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5" />
                {tenant.address}
              </BodyText>
              {tenant.phone && (
                <BodyText className="flex items-center gap-1.5">
                  <PhoneIcon className="size-3.5" />
                  {tenant.phone}
                </BodyText>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Button
              onPress={() =>
                navigate({
                  to: "/tenant/$tenantId/invite",
                  params: { tenantId },
                })
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
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={UsersIcon}
            label="active doctors"
            value={affLoading ? "..." : activeDoctors.length.toString()}
          />
          <StatItem
            icon={StethoscopeIcon}
            label="total affiliations"
            value={affLoading ? "..." : affiliations.length.toString()}
          />
          <StatItem
            icon={CalendarCheckIcon}
            label="services"
            value={(tenant.services?.length ?? 0).toString()}
          />
          <StatItem
            icon={UsersIcon}
            label="admins"
            value={(tenantData?.admins?.length ?? 0).toString()}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>Quick actions</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Navigate to key sections for this hospital.
          </p>
        </div>

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
                <Card.Description>
                  Manage doctor attendance logs
                </Card.Description>
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
      </section>

      {tenant.services && tenant.services.length > 0 && (
        <>
          <Separator />

          <section className="flex flex-col gap-3 px-6">
            <div>
              <PageTitle>Services Offered</PageTitle>
              <p className="font-light text-foreground/60 text-sm">
                Medical services available at this hospital.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tenant.services.map((service: string) => (
                <Chip key={service} variant="secondary">
                  {service}
                </Chip>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
