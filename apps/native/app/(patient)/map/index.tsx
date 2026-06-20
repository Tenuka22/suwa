"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  ListIcon,
  LocateFixed,
  MapPin,
  Search,
  Star,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type MapView from "react-native-maps";
import { Button } from "@/components/design/ui/button";
import { Input } from "@/components/design/ui/input";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (!search) {
      setDebouncedSearch("");
      setIsDebouncing(false);
      return;
    }
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsDebouncing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const centerOnHospital = useCallback((hospital: any) => {
    setSelectedHospital(hospital);
    setListOpen(false);
    setSearch("");
    mapRef.current?.animateToRegion(
      {
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400
    );
  }, []);

  const handleSearch = useCallback(() => {
    setListOpen(true);
  }, []);

  const toggleList = useCallback(() => {
    setListOpen((prev) => !prev);
  }, []);

  const tenantsQuery = useQuery(orpc.listTenants.queryOptions({ input: {} }));
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

  const filteredForList = useMemo(() => {
    if (!debouncedSearch) {
      return allHospitals;
    }
    const q = debouncedSearch.toLowerCase();
    return allHospitals.filter(
      (h: any) =>
        h.name.toLowerCase().includes(q) ||
        (h.address && h.address.toLowerCase().includes(q))
    );
  }, [allHospitals, debouncedSearch]);

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
        platformHospitalNames={tenants.map((t) => t.name)}
        ref={mapRef}
        selectedHospitalId={selectedHospital?.name}
        userLocation={userLocation}
      />

      {/* Floating Header */}
      <View className="absolute top-8 right-lg left-lg">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              className="py-4 pr-4"
              inputContainerClassName="rounded-full bg-background-elevated/80 backdrop-blur-[2px]"
              leftIcon={
                <MapPin className="text-foreground-placeholder" size={20} />
              }
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              placeholder="Search hospitals..."
              returnKeyType="search"
              value={search}
            />
          </View>
          <Pressable
            className={`size-16 items-center justify-center rounded-xl border-2 border-input shadow-lg backdrop-blur-[2px] ${isDebouncing ? "bg-foreground/10" : "bg-background-elevated/60"}`}
            disabled={isDebouncing && listOpen}
            onPress={handleSearch}
          >
            {isDebouncing && listOpen ? (
              <ActivityIndicator className="text-foreground" size="small" />
            ) : (
              <Search className="text-foreground" size={20} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Selected Hospital Card */}
      {selectedHospital && (
        <View className="absolute right-lg bottom-8 left-lg">
          <View className="gap-lg rounded-3xl bg-background-elevated/50 p-lg shadow-xl backdrop-blur-[2px]">
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

      {!selectedHospital && (
        <ScreenBottomBar
          leftActions={[
            {
              active: listOpen,
              icon: <ListIcon size={20} />,
              label: "Hospitals",
              onPress: toggleList,
            },
            {
              icon: <LocateFixed className="text-foreground" size={20} />,
              label: "My Loc.",
              onPress: centerOnUserLocation,
            },
          ]}
          returnAction={{
            href: "/(patient)",
            icon: <ArrowLeft className="text-foreground" size={24} />,
          }}
        />
      )}

      {/* Hospital List Panel */}
      {listOpen && (
        <View className="absolute top-28 right-lg left-lg h-auto max-h-[70%] rounded-2xl border-2 border-input bg-background-elevated/80 shadow-xl backdrop-blur-[2px]">
          <View className="flex-row items-center justify-between border-border border-b px-4 py-3">
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
              onPress={() => setListOpen(false)}
            >
              <ArrowLeft className="text-foreground-muted" size={18} />
            </Pressable>
            <Text className="font-sans text-caption text-foreground">
              {search ? `Results for "${search}"` : "All hospitals"}
            </Text>
            <View className="w-8" />
          </View>

          <FlatList
            className="px-2"
            contentContainerClassName="py-2 gap-2"
            data={filteredForList}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item: any) => item.name}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Building2 className="text-foreground-muted" size={32} />
                <Text className="mt-2 font-sans text-caption text-foreground-muted">
                  No hospitals found
                </Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity
                className="rounded-xl border border-border px-3 py-2.5"
                onPress={() => centerOnHospital(item)}
              >
                <Text className="font-sans text-body text-primary">
                  {item.name}
                </Text>
                <Text
                  className="mt-0.5 font-sans text-caption text-foreground-secondary"
                  numberOfLines={1}
                >
                  {item.address}
                </Text>
                <View className="mt-1 flex-row items-center gap-2">
                  <Star className="fill-accent text-accent" size={11} />
                  <Text className="font-sans text-caption text-foreground-muted">
                    {item.rating || "4.5"}
                  </Text>
                  <Text className="font-sans text-caption text-foreground-muted">
                    &middot;
                  </Text>
                  <Text className="font-sans text-caption text-foreground-muted">
                    {item.category}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
