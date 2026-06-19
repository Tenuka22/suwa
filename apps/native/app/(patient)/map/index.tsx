"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  LocateFixed,
  MapPin,
  Search,
  Star,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import type MapView from "react-native-maps";
import { Button } from "@/components/design/ui/button";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import MapComponent from "@/components/map/map-view";
import { hospitals as staticHospitals } from "@/data/hospitals";
import { orpc } from "@/utils/orpc";
import { useUserLocation } from "@/utils/use-user-location";

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { location: userLocation, requestLocation } = useUserLocation();

  const [search, setSearch] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400
      );
    } else {
      requestLocation();
    }
  }, [userLocation, requestLocation]);

  const tenantsQuery = useQuery(
    orpc.listTenants.queryOptions({ input: { page: 0, pageSize: 0 } })
  );
  const tenants = tenantsQuery.data?.tenants ?? [];

  const allHospitals = useMemo(() => {
    const merged = [...staticHospitals];
    for (const t of tenants) {
      if (!merged.some((h) => h.name === t.name)) {
        merged.push({
          name: t.name,
          address: t.address,
          rating: 4.5,
          latitude: Number.parseFloat(t.latitude ?? "0"),
          longitude: Number.parseFloat(t.longitude ?? "0"),
          phone: t.phone,
          category:
            t.type === "PRIVATE_HOSPITAL"
              ? "Private hospital"
              : "Government hospital",
        } as any);
      }
    }
    return merged;
  }, [tenants]);

  const openMapsNavigation = (hospital: any) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <MapComponent
        filteredHospitals={allHospitals}
        onMarkerPress={setSelectedHospital}
        platformHospitalNames={tenants.map((t: any) => t.name)}
        ref={mapRef}
        selectedHospitalId={selectedHospital?.name}
        userLocation={userLocation}
      />

      {/* Floating Header */}
      <View className="absolute top-14 right-lg left-lg gap-md">
        <View className="flex-row items-center gap-md">

          <View className="h-12 flex-1 flex-row items-center gap-md rounded-full bg-background-elevated px-lg shadow-lg">
            <Search className="text-foreground-placeholder" size={20} />
            <TextInput
              className="flex-1 font-sans text-body"
              onChangeText={setSearch}
              placeholder="Search hospitals..."
              value={search}
            />
          </View>
        </View>
      </View>

      {/* Selected Hospital Card */}
      {selectedHospital && (
        <View className="absolute right-lg bottom-huge left-lg">
          <View className="gap-lg rounded-3xl bg-background-elevated p-lg shadow-xl">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-xxs">
                <Text className="font-serif text-primary text-title">
                  {selectedHospital.name}
                </Text>
                <View className="flex-row items-center gap-xs">
                  <Star className="fill-accent text-accent" size={14} />
                  <Text className="font-sans text-caption text-foreground-secondary">
                    {selectedHospital.rating || "4.5"}
                  </Text>
                  <Text className="font-sans text-caption text-foreground-muted">
                    •
                  </Text>
                  <Text className="font-sans text-caption text-foreground-muted">
                    {selectedHospital.category}
                  </Text>
                </View>
              </View>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
                onPress={() => setSelectedHospital(null)}
              >
                <X className="text-foreground-muted" size={16} />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-sm">
              <MapPin className="text-foreground-muted" size={16} />
              <Text
                className="flex-1 font-sans text-body text-foreground-secondary"
                numberOfLines={2}
              >
                {selectedHospital.address}
              </Text>
            </View>

            <View className="flex-row gap-md">
              <Button
                className="flex-1"
                onPress={() => openMapsNavigation(selectedHospital)}
              >
                Navigate
              </Button>
              {selectedHospital.phone && (
                <Button
                  className="flex-1"
                  onPress={() =>
                    Linking.openURL(`tel:${selectedHospital.phone}`)
                  }
                  variant="outline"
                >
                  Call
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      <ScreenBottomBar
        leftActions={[
          {
            icon: <LocateFixed className="text-foreground" size={20} />,
            label: "My location",
            onPress: centerOnUserLocation,
          },
        ]}
        returnAction={{
          href: "/(patient)",
          icon: <ArrowLeft className="text-foreground" size={24} />,
        }}
      />
    </View>
  );
}
