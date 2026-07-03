import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Input } from "@suwa/ui/components/input";
import { Label } from "@suwa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Skeleton } from "@suwa/ui/components/skeleton";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useGetTenant, useUpdateTenant } from "@/hooks/queries/tenant";
import { buildHeadFromKey } from "../../__root";

const HOSPITAL_SERVICES = [
  "EMERGENCY",
  "THEATRE",
  "ICU",
  "OPD",
  "PHARMACY",
  "LABORATORY",
  "RADIOLOGY",
  "PHYSIOTHERAPY",
  "CARDIOLOGY",
  "PEDIATRICS",
] as const;

export const Route = createFileRoute("/tenant/$tenantId/settings")({
  head: () => buildHeadFromKey("web:tenant:settings"),
  component: TenantSettingsPage,
});

function TenantSettingsPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetTenant(tenantId);
  const updateTenant = useUpdateTenant();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data?.tenant && !initialized) {
      const t = data.tenant;
      setName(t.name);
      setAddress(t.address);
      setPhone(t.phone ?? "");
      setWebsite(t.website ?? "");
      setContactInfo(t.contactInfo ?? "");
      setStatus(t.status);
      setSelectedServices(Array.isArray(t.services) ? t.services : []);
      setInitialized(true);
    }
  }, [data, initialized]);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleSave = async () => {
    try {
      await updateTenant.mutateAsync({
        id: tenantId,
        name,
        address,
        phone: phone || null,
        website: website || null,
        contactInfo: contactInfo || null,
        status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED",
        // biome-ignore lint/suspicious/noExplicitAny: service enum cast
        services: selectedServices as any,
      });
      toast.success("Tenant updated successfully");
    } catch {
      toast.error("Failed to update tenant");
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
        />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 rounded-full" />
          <Skeleton className="h-96 w-full rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:p-6">
          <Badge className="h-7 w-fit rounded-full bg-primary px-3 text-primary-foreground">
            Hospital settings
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
              Settings
            </h1>
            <p className="max-w-[58ch] text-base text-muted-foreground leading-7">
              Manage your hospital tenant profile, services, and branding.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="tracking-tight">Hospital Profile</CardTitle>
            <CardDescription>Edit tenant details and services.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Hospital Name</Label>
                <Input
                  className="rounded-full"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  onValueChange={(v) => setStatus(v ?? "ACTIVE")}
                  value={status}
                >
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Address</Label>
              <Input
                className="rounded-full"
                onChange={(e) => setAddress(e.target.value)}
                value={address}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <Input
                  className="rounded-full"
                  onChange={(e) => setPhone(e.target.value)}
                  value={phone}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Website</Label>
                <Input
                  className="rounded-full"
                  onChange={(e) => setWebsite(e.target.value)}
                  value={website}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Additional Contact Info</Label>
              <Input
                className="rounded-full"
                onChange={(e) => setContactInfo(e.target.value)}
                value={contactInfo}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="tracking-tight">Services Offered</CardTitle>
            <CardDescription>
              Select which services this hospital provides.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {HOSPITAL_SERVICES.map((service) => (
                <Badge
                  className="h-7 cursor-pointer rounded-full px-3 text-xs transition-all hover:-translate-y-0.5"
                  key={service}
                  onClick={() => toggleService(service)}
                  variant={
                    selectedServices.includes(service) ? "default" : "outline"
                  }
                >
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admins */}
        {data?.admins && data.admins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tenant Admins</CardTitle>
              <CardDescription>
                Users who can manage this hospital.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {data.admins.map((admin) => (
                  <div
                    className="flex items-center justify-between rounded-lg border"
                    key={admin.id}
                  >
                    <span className="text-sm">{admin.userId}</span>
                    <span className="text-muted-foreground text-xs">
                      Since {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            className="h-12 rounded-full border-border bg-card px-5 text-foreground hover:bg-muted"
            onClick={() => navigate({ to: `/tenant/${tenantId}` })}
            variant="outline"
          >
            Back to Dashboard
          </Button>
          <Button
            className="h-12 rounded-full bg-primary px-5 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90"
            disabled={updateTenant.isPending}
            onClick={handleSave}
          >
            {updateTenant.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
