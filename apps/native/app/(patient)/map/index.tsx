"use client";

import { useQuery } from "@tanstack/react-query";
import { type Href, Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Hospital as HospitalIcon,
  LocateFixed,
  MapPin,
  Search,
  Star,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type MapView from "react-native-maps";

import MapComponent from "@/components/map/map-view";
import { Button } from "@/components/design/ui/button";
import { Screen } from "@/components/ui/screen";
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
      mapRef.current?.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 400);
    } else {
      requestLocation();
    }
  }, [userLocation, requestLocation]);

  const tenantsQuery = useQuery(orpc.listTenants.queryOptions());
  const tenants = (tenantsQuery.data?.tenants ?? []) as any[];

  const allHospitals = useMemo(() => {
    const merged = [...staticHospitals];
    for (const t of tenants) {
      if (!merged.some(h => h.name === t.name)) {
        merged.push({
          name: t.name,
          address: t.address,
          rating: 4.5,
          latitude: Number.parseFloat(t.latitude ?? "0"),
          longitude: Number.parseFloat(t.longitude ?? "0"),
          phone: t.phone,
          category: t.type === "PRIVATE_HOSPITAL" ? "Private hospital" : "Government hospital",
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
        platformHospitalNames={tenants.map(t => t.name)}
        ref={mapRef}
        selectedHospitalId={selectedHospital?.name}
        userLocation={userLocation}
      />

      {/* Floating Header */}
      <View className="absolute top-14 left-lg right-lg gap-md">
        <View className="flex-row items-center gap-md">
          <Pressable
            onPress={() => router.back()}
            className="h-12 w-12 rounded-full bg-background-elevated shadow-lg items-center justify-center"
          >
            <ArrowLeft size={24} className="text-primary" />
          </Pressable>
          <View className="flex-1 h-12 flex-row items-center gap-md bg-background-elevated rounded-full px-lg shadow-lg">
            <Search size={20} className="text-foreground-placeholder" />
            <TextInput 
              placeholder="Search hospitals..." 
              className="flex-1 font-sans text-body"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </View>

      {/* Selected Hospital Card */}
      {selectedHospital && (
        <View className="absolute bottom-huge left-lg right-lg">
          <View className="bg-background-elevated rounded-3xl p-lg shadow-xl gap-lg">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 gap-xxs">
                <Text className="font-serif text-title text-primary">{selectedHospital.name}</Text>
                <View className="flex-row items-center gap-xs">
                  <Star size={14} className="text-accent fill-accent" />
                  <Text className="font-sans text-caption text-foreground-secondary">{selectedHospital.rating || "4.5"}</Text>
                  <Text className="font-sans text-caption text-foreground-muted">•</Text>
                  <Text className="font-sans text-caption text-foreground-muted">{selectedHospital.category}</Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedHospital(null)} className="h-8 w-8 rounded-full bg-background-subtle items-center justify-center">
                <X size={16} className="text-foreground-muted" />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-sm">
              <MapPin size={16} className="text-foreground-muted" />
              <Text className="font-sans text-body text-foreground-secondary flex-1" numberOfLines={2}>{selectedHospital.address}</Text>
            </View>

            <View className="flex-row gap-md">
              <Button className="flex-1" onPress={() => openMapsNavigation(selectedHospital)}>Navigate</Button>
              {selectedHospital.phone && (
                <Button variant="outline" className="flex-1" onPress={() => Linking.openURL(`tel:${selectedHospital.phone}`)}>Call</Button>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Locate Button */}
      {!selectedHospital && (
        <Pressable
          onPress={centerOnUserLocation}
          className="absolute bottom-huge right-lg h-14 w-14 rounded-full bg-primary shadow-lg items-center justify-center"
        >
          <LocateFixed size={24} className="text-primary-foreground" />
        </Pressable>
      )}
    </View>
  );
}
