import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  toast,
} from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BuildingIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { BodyText, PageTitle } from "@/components/typography";
import { useCreateTenant } from "@/hooks/queries/tenant";

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
      toast.danger(
        "Could not load places data. You can still fill in manually."
      );
    } finally {
      setPlacesLoading(false);
    }
  };

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
      toast.danger("Please select a place from the list first");
      return;
    }

    if (!(name && address)) {
      toast.danger("Name and address are required");
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
        // biome-ignore lint/suspicious/noExplicitAny: service enum cast
        services:
          selectedServices.length > 0 ? (selectedServices as any) : undefined,
        latitude: selectedPlace.latitude.toString(),
        longitude: selectedPlace.longitude.toString(),
        placeDataRef: `${selectedPlace.name}||${selectedPlace.place_id}`,
      });
      toast.success("Hospital registered successfully!");
      navigate({ to: "/tenant" });
    } catch {
      toast.danger("Failed to register hospital");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent/10">
            <PlusIcon className="size-6 text-accent" />
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                Register Hospital
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <BuildingIcon className="size-3" />
                </div>
                New tenant
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Select a hospital from our database and configure your tenant
              profile.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>Select Hospital Location</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Choose from our pre-loaded places database. This is required to
            proceed.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border px-4 py-3">
          {placesData.length ? (
            <>
              <Input
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospitals by name, address, or category..."
                value={searchQuery}
              />
              <Select
                className="w-full"
                onSelectionChange={(id) => handlePlaceSelect(String(id))}
                placeholder="Select a hospital..."
                selectedKey={selectedPlace?.name}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {filteredPlaces.map((place) => (
                      <ListBox.Item id={place.name} key={place.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{place.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {place.address} • {place.category} • ⭐{" "}
                            {place.rating}
                          </span>
                        </div>
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              {selectedPlace && (
                <div className="rounded-lg border bg-muted/30 text-sm">
                  <p className="font-medium">{selectedPlace.name}</p>
                  <p className="text-muted-foreground">
                    {selectedPlace.address}
                  </p>
                  <div className="flex gap-3 text-muted-foreground text-xs">
                    <span>
                      ⭐ {selectedPlace.rating} ({selectedPlace.review_count}{" "}
                      reviews)
                    </span>
                    <span>{selectedPlace.category}</span>
                    {selectedPlace.phone && (
                      <span>📞 {selectedPlace.phone}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Button
              isDisabled={placesLoading}
              onPress={loadPlacesData}
              variant="outline"
            >
              {placesLoading ? "Loading..." : "Load Hospital Places"}
            </Button>
          )}
        </div>
      </section>

      <Separator />

      <form className="flex flex-col gap-3 px-6" onSubmit={handleSubmit}>
        <div>
          <PageTitle>Hospital Details</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Configure your hospital tenant profile.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border px-4 py-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Hospital Type</Label>
              <Select
                id="type"
                onSelectionChange={(id) =>
                  setHospitalType(
                    String(id) as "PRIVATE_HOSPITAL" | "PUBLIC_HOSPITAL"
                  )
                }
                selectedKey={hospitalType}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="PRIVATE_HOSPITAL">
                      Private Hospital
                    </ListBox.Item>
                    <ListBox.Item id="PUBLIC_HOSPITAL">
                      Public Hospital
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
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
        </div>

        <Separator />

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

        <div className="flex justify-end gap-3 pt-2">
          <Button onPress={() => navigate({ to: "/tenant" })} variant="outline">
            Cancel
          </Button>
          <Button
            isDisabled={createTenant.isPending || !selectedPlace}
            type="submit"
          >
            {createTenant.isPending ? "Registering..." : "Register Hospital"}
          </Button>
        </div>
      </form>
    </div>
  );
}
