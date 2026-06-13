import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { useGetTenant, useUpdateTenant } from "@/hooks/queries/tenant";

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your hospital tenant profile and branding.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hospital Profile</CardTitle>
          <CardDescription>Edit tenant details and services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Hospital Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "ACTIVE")}>
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Contact Info</Label>
            <Input
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Services Offered</CardTitle>
          <CardDescription>
            Select which services this hospital provides.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {HOSPITAL_SERVICES.map((service) => (
              <Badge
                key={service}
                variant={
                  selectedServices.includes(service) ? "default" : "outline"
                }
                className="cursor-pointer px-3 py-1.5 text-xs transition-colors"
                onClick={() => toggleService(service)}
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
            <div className="space-y-2">
              {data.admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between rounded-lg border p-2"
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
        <Button variant="outline" onClick={() => navigate({ to: `/tenant/${tenantId}` })}>
          Back to Dashboard
        </Button>
        <Button onClick={handleSave} disabled={updateTenant.isPending}>
          {updateTenant.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
