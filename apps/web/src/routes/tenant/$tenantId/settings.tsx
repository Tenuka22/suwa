import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Skeleton,
  toast,
} from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BuildingIcon, SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { BodyText, PageTitle } from "@/components/typography";
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
      toast.danger("Failed to update tenant");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const tenant = data?.tenant;

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
              <h1 className="font-light text-2xl tracking-tight">Settings</h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <SettingsIcon className="size-3" />
                </div>
                {tenant?.name ?? "Tenant"}
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Manage your hospital tenant profile and branding.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>Hospital Profile</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Edit tenant details and services.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border px-4 py-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Hospital Name</Label>
              <Input onChange={(e) => setName(e.target.value)} value={name} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                onSelectionChange={(id) => setStatus(String(id) ?? "ACTIVE")}
                selectedKey={status}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="ACTIVE">Active</ListBox.Item>
                    <ListBox.Item id="INACTIVE">Inactive</ListBox.Item>
                    <ListBox.Item id="SUSPENDED">Suspended</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Address</Label>
            <Input
              onChange={(e) => setAddress(e.target.value)}
              value={address}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Phone</Label>
              <Input onChange={(e) => setPhone(e.target.value)} value={phone} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Website</Label>
              <Input
                onChange={(e) => setWebsite(e.target.value)}
                value={website}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Additional Contact Info</Label>
            <Input
              onChange={(e) => setContactInfo(e.target.value)}
              value={contactInfo}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>Services Offered</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Select which services this hospital provides.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl border border-border px-4 py-3">
          {HOSPITAL_SERVICES.map((service) => (
            <Chip
              className="cursor-pointer text-xs transition-colors"
              color={selectedServices.includes(service) ? "accent" : "default"}
              key={service}
              onClick={() => toggleService(service)}
              variant={
                selectedServices.includes(service) ? "soft" : "secondary"
              }
            >
              {service}
            </Chip>
          ))}
        </div>
      </section>

      {data?.admins && data.admins.length > 0 && (
        <>
          <Separator />

          <section className="flex flex-col gap-3 px-6">
            <div>
              <PageTitle>Tenant Admins</PageTitle>
              <p className="font-light text-foreground/60 text-sm">
                Users who can manage this hospital.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3">
              {data.admins.map((admin) => (
                <div
                  className="flex items-center justify-between"
                  key={admin.id}
                >
                  <span className="text-sm">{admin.userId}</span>
                  <span className="text-muted-foreground text-xs">
                    Since {new Date(admin.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Separator />

      <div className="flex justify-between px-6 pb-4">
        <Button
          onPress={() => navigate({ to: `/tenant/${tenantId}` })}
          variant="outline"
        >
          Back to Dashboard
        </Button>
        <Button isDisabled={updateTenant.isPending} onPress={handleSave}>
          {updateTenant.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
