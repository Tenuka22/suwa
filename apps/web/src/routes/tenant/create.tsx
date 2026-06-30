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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateTenant } from "@/hooks/queries/tenant";
import { buildHeadFromKey } from "../__root";

// Hospital services enum
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

// Dynamically fetch places data - file is served from public/
// Update apps/web/public/places_data.json to change available places
const PLACES_DATA_URL = "/places_data.json";

interface PlaceData {
  address: string;
  category: string;
  hours: string | null;
  latitude: number;
  longitude: number;
  name: string;
  phone: string | null;
  place_id: string;
  price_level: number | null;
  rating: number;
  review_count: number;
  url: string;
  website: string | null;
}

export const Route = createFileRoute("/tenant/create")({
  head: () => buildHeadFromKey("web:tenant:create"),
  component: TenantCreatePage,
});

function TenantCreatePage() {
  const navigate = useNavigate();
  const createTenant = useCreateTenant();

  const [placesData, setPlacesData] = useState<PlaceData[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [hospitalType, setHospitalType] = useState<
    "PRIVATE_HOSPITAL" | "PUBLIC_HOSPITAL"
  >("PRIVATE_HOSPITAL");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Load places data
  const loadPlacesData = async () => {
    setPlacesLoading(true);
    try {
      const res = await fetch(PLACES_DATA_URL);
      if (!res.ok) {
        throw new Error("Failed to load places data");
      }
      const data = (await res.json()) as PlaceData[];
      setPlacesData(data);
    } catch {
      toast.error(
        "Could not load places data. You can still fill in manually."
      );
    } finally {
      setPlacesLoading(false);
    }
  };

  // Select a place and prefill fields
  const handlePlaceSelect = (placeName: string | null) => {
    if (!placeName) {
      return;
    }
    const place = placesData.find((p) => p.name === placeName);
    if (!place) {
      return;
    }
    setSelectedPlace(place);
    setName(place.name);
    setAddress(place.address);
    setPhone(place.phone ?? "");
    setWebsite(place.website ?? "");
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const filteredPlaces = placesData.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlace) {
      toast.error("Please select a place from the list first");
      return;
    }

    if (!(name && address)) {
      toast.error("Name and address are required");
      return;
    }

    try {
      await createTenant.mutateAsync({
        name,
        type: hospitalType,
        address,
        phone: phone || undefined,
        website: website || undefined,
        contactInfo: contactInfo || undefined,
        services:
          selectedServices.length > 0
            ? // biome-ignore lint/suspicious/noExplicitAny: union cast
              (selectedServices as any)
            : undefined,
        latitude: selectedPlace.latitude.toString(),
        longitude: selectedPlace.longitude.toString(),
        placeDataRef: `${selectedPlace.name}||${selectedPlace.place_id}`,
      });
      toast.success("Hospital registered successfully!");
      navigate({ to: "/tenant" });
    } catch {
      toast.error("Failed to register hospital");
    }
  };

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/90 bg-card/80 p-5 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:p-6">
          <Badge className="h-7 w-fit rounded-full bg-primary px-3 text-primary-foreground">
            Tenant workspace
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
              Register Hospital
            </h1>
            <p className="max-w-[58ch] text-base text-muted-foreground leading-7">
              Select a hospital from our database and configure your tenant
              profile.
            </p>
          </div>
        </div>

        {/* Place Selector */}
        <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base">
              Select Hospital Location
            </CardTitle>
            <CardDescription>
              Choose from our pre-loaded places database. This is required to
              proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {placesData.length ? (
              <>
                <Input
                  className="rounded-full"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospitals by name, address, or category..."
                  value={searchQuery}
                />
                <Select
                  onValueChange={handlePlaceSelect}
                  value={selectedPlace?.name}
                >
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Select a hospital..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlaces.map((place) => (
                      <SelectItem key={place.name} value={place.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{place.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {place.address} • {place.category} • ⭐{" "}
                            {place.rating}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlace && (
                  <div className="rounded-[1.2rem] border border-border/90 bg-background/72 p-4 text-sm shadow-sm">
                    <p className="font-medium tracking-tight">
                      {selectedPlace.name}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedPlace.address}
                    </p>
                    <div className="mt-2 flex gap-3 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        ⭐ {selectedPlace.rating} ({selectedPlace.review_count}{" "}
                        reviews)
                      </span>
                      <span>{selectedPlace.category}</span>
                      {selectedPlace.phone && (
                        <span className="flex items-center gap-1">
                          📞 {selectedPlace.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Button
                className="h-12 rounded-full border-border bg-card px-5 text-foreground hover:bg-muted"
                disabled={placesLoading}
                onClick={loadPlacesData}
                variant="outline"
              >
                {placesLoading ? "Loading..." : "Load Hospital Places"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="tracking-tight">Hospital Details</CardTitle>
              <CardDescription>
                Configure your hospital tenant profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Hospital Type</Label>
                  <Select
                    onValueChange={(v) =>
                      setHospitalType(
                        v as "PRIVATE_HOSPITAL" | "PUBLIC_HOSPITAL"
                      )
                    }
                    value={hospitalType}
                  >
                    <SelectTrigger className="w-full rounded-full" id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE_HOSPITAL">
                        Private Hospital
                      </SelectItem>
                      <SelectItem value="PUBLIC_HOSPITAL">
                        Public Hospital
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Hospital Name *</Label>
                  <Input
                    disabled={!selectedPlace}
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter hospital name"
                    value={name}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  disabled={!selectedPlace}
                  id="address"
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  value={address}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    disabled={!selectedPlace}
                    id="phone"
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contact phone"
                    value={phone}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    disabled={!selectedPlace}
                    id="website"
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    value={website}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contactInfo">Additional Contact Info</Label>
                <Input
                  id="contactInfo"
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Email, department contacts, etc."
                  value={contactInfo}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services */}
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

          <div className="flex justify-end gap-3">
            <Button
              className="h-12 rounded-full border-border bg-card px-5 text-foreground hover:bg-muted"
              onClick={() => navigate({ to: "/tenant" })}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="h-12 rounded-full bg-primary px-5 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90"
              disabled={createTenant.isPending || !selectedPlace}
              type="submit"
            >
              {createTenant.isPending ? "Registering..." : "Register Hospital"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
