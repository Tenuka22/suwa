"use client";

import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  ListIcon,
  LocateFixed,
  MapPin,
  Search,
  Star,
  Stethoscope,
  User,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MapScreen() {
  const router = useRouter();
  const { mode, search: initialSearch } = useLocalSearchParams<{
    mode?: string;
    search?: string;
  }>();
  const mapRef = useRef<MapView>(null);
  const { location: userLocation, requestLocation } = useUserLocation();

  useEffect(() => {
    fetch("https://tiles.openfreemap.org/styles/liberty", { priority: "low" }).catch(() => {});
  }, []);

  // ── Search state ────────────────────────────────────────────────────
  const [searchMode, setSearchMode] = useState<"hospitals" | "doctors">(
    mode === "doctors" ? "doctors" : "hospitals"
  );
  const [search, setSearch] = useState(
    typeof initialSearch === "string" ? initialSearch : ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [listOpen, setListOpen] = useState(
    typeof initialSearch === "string" && initialSearch.trim().length > 0
  );

  useEffect(() => {
    if (mode === "doctors" || mode === "hospitals") {
      setSearchMode(mode);
    }
    if (typeof initialSearch === "string" && initialSearch.trim()) {
      setSearch(initialSearch);
      setListOpen(true);
    }
  }, [initialSearch, mode]);

  // ── Hospital state ──────────────────────────────────────────────────
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [clinicInfoTenantId, setClinicInfoTenantId] = useState<string | null>(null);

  // ── Doctor state ────────────────────────────────────────────────────
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorDetailId, setDoctorDetailId] = useState<string | null>(null);

  // ── Debounce ────────────────────────────────────────────────────────
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

  // ── Queries ─────────────────────────────────────────────────────────
  const tenantsQuery = useQuery(orpc.listTenants.queryOptions({ input: {} }));
  const tenants = tenantsQuery.data?.tenants ?? [];

  const doctorSearchQuery = useQuery(
    orpc.listDoctors.queryOptions({
      input: { page: 1, pageSize: 12, search: debouncedSearch || "" },
    })
  );

  const tenantDetailQuery = useQuery({
    ...orpc.getTenantDetail.queryOptions({
      input: { tenantId: clinicInfoTenantId ?? "" },
    }),
    enabled: !!clinicInfoTenantId,
  });

  const doctorDetailQuery = useQuery({
    ...orpc.getDoctor.queryOptions({
      input: { doctorId: doctorDetailId ?? "" },
    }),
    enabled: !!doctorDetailId,
  });

  // ── Computed ────────────────────────────────────────────────────────
  const allHospitals = useMemo(() => {
    const merged: any[] = [...staticHospitals];
    for (const t of tenants) {
      if (!merged.some((h: any) => h.name === t.name)) {
        merged.push({
          id: t.id,
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
        });
      }
    }
    return merged;
  }, [tenants]);

  const filteredHospitals = useMemo(() => {
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

  // Doctor markers: doctors at their affiliated hospitals
  const doctorMarkers = useMemo(() => {
    const doctors = doctorSearchQuery.data?.doctors ?? [];
    const markers: Array<{
      doctorId: string;
      doctorName: string;
      headline: string | null;
      latitude: number;
      longitude: number;
      tenantName: string;
    }> = [];
    for (const doc of doctors) {
      for (const aff of doc.affiliations) {
        const tenant = tenants.find((t: any) => t.id === aff.tenantId);
        if (tenant?.latitude && tenant?.longitude) {
          markers.push({
            doctorId: doc.profile.userId,
            doctorName: doc.profile.displayName ?? "Unknown",
            headline: doc.profile.headline ?? null,
            latitude: Number.parseFloat(tenant.latitude),
            longitude: Number.parseFloat(tenant.longitude),
            tenantName: aff.tenantName,
          });
        }
      }
    }
    return markers;
  }, [doctorSearchQuery.data, tenants]);

  const doctorResults = doctorSearchQuery.data?.doctors ?? [];

  // ── Callbacks ───────────────────────────────────────────────────────
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
    setSelectedDoctor(null);
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

  const centerOnDoctorMarker = useCallback(
    (doctorId: string) => {
      const marker = doctorMarkers.find((m) => m.doctorId === doctorId);
      if (!marker) return;
      setSelectedDoctor(
        doctorSearchQuery.data?.doctors.find(
          (d: any) => d.profile.userId === doctorId
        ) ?? null
      );
      setSelectedHospital(null);
      setListOpen(false);
      setSearch("");
      mapRef.current?.animateToRegion(
        {
          latitude: marker.latitude,
          longitude: marker.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400
      );
    },
    [doctorMarkers, doctorSearchQuery.data]
  );

  const handleSearchSubmit = useCallback(() => {
    setListOpen(true);
  }, []);

  const toggleList = useCallback(() => {
    setListOpen((prev) => !prev);
  }, []);

  const openMapsNavigation = (hospital: any) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    Linking.openURL(url);
  };

  const openClinicInfo = useCallback((hospital: any) => {
    const tenant = tenants.find((t: any) => t.name === hospital.name);
    if (tenant) {
      setClinicInfoTenantId(tenant.id);
      setSelectedHospital(null);
    }
  }, [tenants]);

  const openDoctorDetail = useCallback((doctorId: string) => {
    setDoctorDetailId(doctorId);
    setSelectedDoctor(null);
  }, []);

  const isTenantHospital = (hospital: any) =>
    tenants.some((t: any) => t.name === hospital.name);

  // ── Render helpers ──────────────────────────────────────────────────

  const renderSearchToggle = () => (
    <View className="flex-row gap-1.5 mb-2">
      <Pressable
        className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
          searchMode === "hospitals"
            ? "bg-primary shadow-sm"
            : "bg-background-elevated/60 border border-border/50"
        }`}
        onPress={() => setSearchMode("hospitals")}
      >
        <Building2
          size={14}
          className={
            searchMode === "hospitals"
              ? "text-primary-foreground"
              : "text-foreground-muted"
          }
        />
        <Text
          className={`font-poppins-medium text-xs ${
            searchMode === "hospitals"
              ? "text-primary-foreground"
              : "text-foreground-muted"
          }`}
        >
          Hospitals
        </Text>
      </Pressable>
      <Pressable
        className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
          searchMode === "doctors"
            ? "bg-primary shadow-sm"
            : "bg-background-elevated/60 border border-border/50"
        }`}
        onPress={() => setSearchMode("doctors")}
      >
        <Stethoscope
          size={14}
          className={
            searchMode === "doctors"
              ? "text-primary-foreground"
              : "text-foreground-muted"
          }
        />
        <Text
          className={`font-poppins-medium text-xs ${
            searchMode === "doctors"
              ? "text-primary-foreground"
              : "text-foreground-muted"
          }`}
        >
          Doctors
        </Text>
      </Pressable>
    </View>
  );

  const renderClinicInfoModal = () => {
    if (!clinicInfoTenantId) return null;
    const { data, isLoading } = tenantDetailQuery;
    return (
      <Modal
        animationType="slide"
        onRequestClose={() => setClinicInfoTenantId(null)}
        statusBarTranslucent
        transparent
        visible={!!clinicInfoTenantId}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[82%] rounded-t-[32px] bg-background pb-8">
            <View className="mt-sm h-1.5 w-12 self-center rounded-full bg-border" />
            <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
              <Text className="font-serif text-title text-foreground flex-1 mr-4" numberOfLines={1}>
                {data?.tenant?.name ?? "Hospital"}
              </Text>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
                onPress={() => setClinicInfoTenantId(null)}
              >
                <X className="text-foreground-muted" size={16} />
              </Pressable>
            </View>

            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator className="text-primary" size="large" />
              </View>
            ) : data ? (
              <ScrollView className="px-6 pt-2" contentContainerClassName="gap-4 pb-6">
                {/* Clinics */}
                <View>
                  <Text className="font-poppins-medium text-body text-foreground mb-2">
                    🏥 Clinics
                  </Text>
                  {data.clinics.length === 0 ? (
                    <Text className="font-sans text-caption text-foreground-muted">
                      No clinics listed
                    </Text>
                  ) : (
                    <View className="gap-2">
                      {data.clinics.map((clinic: any) => (
                        <View
                          key={clinic.id}
                          className="rounded-xl border border-border px-3 py-2.5"
                        >
                          <Text className="font-sans text-body text-primary">
                            {clinic.name}
                          </Text>
                          {clinic.specialization && (
                            <Text className="font-sans text-caption text-foreground-secondary mt-0.5">
                              {clinic.specialization}
                            </Text>
                          )}
                          {clinic.schedule && (
                            <View className="flex-row items-center gap-1 mt-1">
                              <Clock
                                className="text-foreground-muted"
                                size={11}
                              />
                              <Text className="font-sans text-caption text-foreground-muted">
                                {clinic.schedule}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Doctors */}
                <View>
                  <Text className="font-poppins-medium text-body text-foreground mb-2">
                    👨‍⚕️ Affiliated Doctors
                  </Text>
                  {data.affiliatedDoctors.length === 0 ? (
                    <Text className="font-sans text-caption text-foreground-muted">
                      No doctors affiliated
                    </Text>
                  ) : (
                    <View className="gap-2">
                      {data.affiliatedDoctors.map((doc: any) => (
                        <Pressable
                          key={doc.affiliationId}
                          className="rounded-xl border border-border px-3 py-2.5"
                          onPress={() => {
                            setClinicInfoTenantId(null);
                            openDoctorDetail(doc.doctorId);
                          }}
                        >
                          <View className="flex-row items-center gap-2">
                            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-subtle">
                              <User className="text-primary" size={16} />
                            </View>
                            <View className="flex-1">
                              <Text className="font-sans text-body text-primary">
                                {doc.profile.displayName}
                              </Text>
                              <View className="flex-row items-center gap-1">
                                {doc.profile.specialties.length > 0 && (
                                  <Text className="font-sans text-caption text-foreground-secondary">
                                    {doc.profile.specialties.slice(0, 2).join(", ")}
                                  </Text>
                                )}
                                {doc.availabilityWindows.length > 0 && (
                                  <View className="flex-row items-center gap-1 ml-auto">
                                    <Clock
                                      className="text-foreground-muted"
                                      size={10}
                                    />
                                    <Text className="font-sans text-caption text-foreground-muted">
                                      {doc.availabilityWindows.length > 0
                                        ? `${DAY_NAMES[doc.availabilityWindows[0].dayOfWeek]} ${doc.availabilityWindows[0].startTime.slice(0, 5)}`
                                        : ""}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="font-sans text-caption text-foreground-muted">
                  Could not load hospital details
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderDoctorDetailModal = () => {
    if (!doctorDetailId) return null;
    const { data, isLoading } = doctorDetailQuery;
    const doc = data ?? doctorSearchQuery.data?.doctors.find(
      (d: any) => d.profile.userId === doctorDetailId
    );

    return (
      <Modal
        animationType="slide"
        onRequestClose={() => setDoctorDetailId(null)}
        statusBarTranslucent
        transparent
        visible={!!doctorDetailId}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[85%] rounded-t-[32px] bg-background pb-8">
            <View className="mt-sm h-1.5 w-12 self-center rounded-full bg-border" />
            <View className="flex-row items-center justify-between px-6 pt-12 pb-2">
              <Text className="font-serif text-title text-foreground flex-1 mr-4" numberOfLines={1}>
                {data?.profile?.displayName ?? doc?.profile?.displayName ?? "Doctor"}
              </Text>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
                onPress={() => setDoctorDetailId(null)}
              >
                <X className="text-foreground-muted" size={16} />
              </Pressable>
            </View>

            {isLoading && !doc ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator className="text-primary" size="large" />
              </View>
            ) : (
              <ScrollView className="px-6 pt-2" contentContainerClassName="gap-4 pb-6">
                {/* Profile */}
                <View className="flex-row items-center gap-3">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-subtle">
                    <User className="text-primary" size={28} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-serif text-subtitle text-foreground">
                      {data?.profile?.displayName ?? doc?.profile?.displayName ?? "Unknown"}
                    </Text>
                    {data?.profile?.headline && (
                      <Text className="font-sans text-caption text-foreground-secondary mt-0.5">
                        {data.profile.headline}
                      </Text>
                    )}
                    {data?.profile?.specialties?.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {data.profile.specialties.slice(0, 3).map((s: string) => (
                          <View key={s} className="rounded-full bg-primary-subtle px-2 py-0.5">
                            <Text className="font-sans text-micro text-primary">
                              {s}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Bio */}
                {data?.profile?.bio && (
                  <View>
                    <Text className="font-poppins-medium text-body text-foreground mb-1">
                      About
                    </Text>
                    <Text className="font-sans text-caption text-foreground-secondary leading-relaxed">
                      {data.profile.bio}
                    </Text>
                  </View>
                )}

                {/* Practice Place & Availability */}
                {(data?.profile?.placeName || data?.weeklyAvailability?.length > 0) && (
                  <View>
                    <Text className="font-poppins-medium text-body text-foreground mb-2">
                      Practice & Availability
                    </Text>
                    <TouchableOpacity
                      className="rounded-xl border border-border px-3 py-2.5"
                      onPress={() => {
                        setDoctorDetailId(null);
                        const matchingTenant = data?.profile?.placeName
                          ? tenants.find(
                              (t: any) => t.name === data.profile.placeName
                            )
                          : null;
                        if (matchingTenant?.latitude && matchingTenant?.longitude) {
                          setSelectedHospital(matchingTenant);
                          setSelectedDoctor(null);
                          setListOpen(false);
                          setSearch("");
                          mapRef.current?.animateToRegion(
                            {
                              latitude: Number.parseFloat(matchingTenant.latitude),
                              longitude: Number.parseFloat(matchingTenant.longitude),
                              latitudeDelta: 0.02,
                              longitudeDelta: 0.02,
                            },
                            400
                          );
                        } else if (data?.affiliations?.[0]) {
                          const first = data.affiliations[0];
                          if (first.tenantLatitude && first.tenantLongitude) {
                            setSelectedHospital(first);
                            setSelectedDoctor(null);
                            setListOpen(false);
                            setSearch("");
                            mapRef.current?.animateToRegion(
                              {
                                latitude: Number.parseFloat(first.tenantLatitude),
                                longitude: Number.parseFloat(first.tenantLongitude),
                                latitudeDelta: 0.02,
                                longitudeDelta: 0.02,
                              },
                              400
                            );
                          }
                        }
                      }}
                    >
                      {data?.profile?.placeName && (
                        <>
                          <View className="flex-row items-center gap-2">
                            <MapPin className="text-foreground-muted" size={16} />
                            <View className="flex-1">
                              <Text className="font-sans text-body text-primary">
                                {data.profile.placeName}
                              </Text>
                              {data.profile.placeAddress && (
                                <Text className="font-sans text-caption text-foreground-secondary">
                                  {data.profile.placeAddress}
                                </Text>
                              )}
                            </View>
                          </View>
                          {data.profile.placeDescription && (
                            <Text className="font-sans text-caption text-foreground-muted mt-1.5 ml-8 leading-relaxed">
                              {data.profile.placeDescription}
                            </Text>
                          )}
                        </>
                      )}
                      {data?.weeklyAvailability
                        ?.filter((w: any) => w.isAvailable)
                        .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek)
                        .length > 0 && (
                        <View className={data?.profile?.placeName ? "mt-3 gap-1" : "gap-1"}>
                          {data.weeklyAvailability
                            .filter((w: any) => w.isAvailable)
                            .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek)
                            .map((w: any) => (
                              <View
                                key={w.id}
                                className="flex-row items-center gap-1.5"
                              >
                                <Calendar className="text-foreground-muted" size={12} />
                                <Text className="font-sans text-caption text-foreground-secondary">
                                  {DAY_NAMES[w.dayOfWeek]}: {w.startTime.slice(0, 5)} - {w.endTime.slice(0, 5)}
                                </Text>
                              </View>
                            ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Education */}
                {data?.education && data.education.length > 0 && (
                  <View>
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <GraduationCap className="text-foreground-muted" size={16} />
                      <Text className="font-poppins-medium text-body text-foreground">
                        Education
                      </Text>
                    </View>
                    <View className="gap-2">
                      {data.education.map((edu: any) => (
                        <View
                          key={edu.id}
                          className="flex-row items-center gap-2 rounded-xl border border-border px-3 py-2"
                        >
                          <GraduationCap className="text-foreground-muted" size={16} />
                          <View className="flex-1">
                            <Text className="font-sans text-body text-primary">
                              {edu.degree}
                            </Text>
                            <Text className="font-sans text-caption text-foreground-secondary">
                              {edu.institution}{edu.year ? ` · ${edu.year}` : ""}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Practice Locations */}
                {(() => {
                  const affiliations = data?.affiliations ?? doc?.affiliations ?? [];
                  if (affiliations.length === 0) return null;
                  return (
                    <View>
                      <View className="flex-row items-center gap-1.5 mb-2">
                        <Building2 className="text-foreground-muted" size={16} />
                        <Text className="font-poppins-medium text-body text-foreground">
                          Practice Locations
                        </Text>
                      </View>
                      <View className="gap-2">
                        {affiliations.map((aff: any) => {
                          const hospital = allHospitals.find(
                            (h: any) => h.name === aff.tenantName
                          );
                          const windows = aff.availabilityWindows ?? [];
                          return (
                            <TouchableOpacity
                              key={aff.tenantId}
                              className="rounded-xl border border-border px-3 py-2.5"
                              onPress={() => {
                                setDoctorDetailId(null);
                                if (hospital) {
                                  setSelectedHospital(hospital);
                                  setSelectedDoctor(null);
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
                                }
                              }}
                            >
                              <View className="flex-row items-center gap-2">
                                <MapPin className="text-foreground-muted" size={16} />
                                <View className="flex-1">
                                  <Text className="font-sans text-body text-primary">
                                    {aff.tenantName}
                                  </Text>
                                  {hospital?.address && (
                                    <Text className="font-sans text-caption text-foreground-secondary">
                                      {hospital.address}
                                    </Text>
                                  )}
                                </View>
                              </View>
                              {windows.length > 0 && (
                                <View className="mt-2 ml-8 gap-1">
                                  {windows.map((w: any) => (
                                    <View
                                      key={`${aff.tenantId}-${w.dayOfWeek}`}
                                      className="flex-row items-center gap-1.5"
                                    >
                                      <Calendar className="text-foreground-muted" size={11} />
                                      <Text className="font-sans text-caption text-foreground-secondary">
                                        {DAY_NAMES[w.dayOfWeek]}: {w.startTime.slice(0, 5)} - {w.endTime.slice(0, 5)}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false, title: getScreenTitle("native:patient:map") }} />

      <MapComponent
        filteredHospitals={allHospitals}
        doctorMarkers={doctorMarkers}
        onMarkerPress={(hospital: any) => {
          setSelectedHospital(hospital);
          setSelectedDoctor(null);
          setListOpen(false);
          setSearch("");
        }}
        onDoctorMarkerPress={(doctorId: string) => {
          centerOnDoctorMarker(doctorId);
        }}
        platformHospitalNames={tenants.map((t: any) => t.name)}
        ref={mapRef}
        selectedHospitalId={selectedHospital?.name}
        userLocation={userLocation}
      />

      {/* Floating Header */}
      <View className="absolute top-8 right-lg left-lg">
        {renderSearchToggle()}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              className="py-4 pr-4"
              inputContainerClassName="rounded-full bg-background-elevated/80 backdrop-blur-[2px]"
              leftIcon={
                <MapPin className="text-foreground-placeholder" size={20} />
              }
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              placeholder={
                searchMode === "hospitals"
                  ? "Search hospitals..."
                  : "Search doctors..."
              }
              returnKeyType="search"
              value={search}
            />
          </View>
          <Pressable
            className={`size-16 items-center justify-center rounded-xl border-2 border-input shadow-lg backdrop-blur-[2px] ${isDebouncing ? "bg-foreground/10" : "bg-background-elevated/60"}`}
            disabled={isDebouncing && listOpen}
            onPress={handleSearchSubmit}
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
          <View className="rounded-2xl bg-background-elevated/50 p-4 shadow-xl backdrop-blur-[2px]">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-0.5">
                <Text className="font-serif text-title text-primary">
                  {selectedHospital.name}
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <Star className="fill-accent text-accent" size={12} />
                  <Text className="font-sans text-caption text-foreground-secondary">
                    {selectedHospital.rating || "4.5"}
                  </Text>
                  <Text className="font-sans text-caption text-foreground-muted">
                    &middot;
                  </Text>
                  <Text className="font-sans text-caption text-foreground-muted">
                    {selectedHospital.category}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <MapPin className="text-foreground-muted" size={12} />
                  <Text
                    className="flex-1 font-sans text-caption text-foreground-secondary"
                    numberOfLines={1}
                  >
                    {selectedHospital.address}
                  </Text>
                </View>
              </View>
              <Pressable
                className="h-7 w-7 items-center justify-center rounded-full bg-background-subtle"
                onPress={() => setSelectedHospital(null)}
              >
                <X className="text-foreground-muted" size={14} />
              </Pressable>
            </View>

            {/* Affiliated doctors */}
            {(() => {
              const docs = doctorResults.filter((doc: any) =>
                doc.affiliations?.some(
                  (aff: any) => aff.tenantName === selectedHospital.name
                )
              );
              if (docs.length === 0) return null;
              return (
                <View className="mt-3 gap-1.5">
                  <Text className="font-poppins-medium text-caption text-foreground">
                    Doctors
                  </Text>
                  {docs.slice(0, 3).map((doc: any) => (
                    <TouchableOpacity
                      key={doc.profile.userId}
                      className="flex-row items-center gap-2"
                      onPress={() => openDoctorDetail(doc.profile.userId)}
                    >
                      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-subtle">
                        <User className="text-primary" size={13} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans text-caption text-primary">
                          {doc.profile.displayName}
                        </Text>
                        <Text className="font-sans text-micro text-foreground-secondary" numberOfLines={1}>
                          {doc.profile.headline ?? doc.profile.specialties?.slice(0, 2).join(", ")}
                        </Text>
                      </View>
                      <Stethoscope className="text-foreground-muted" size={13} />
                    </TouchableOpacity>
                  ))}
                  {docs.length > 3 && (
                    <Text className="font-sans text-micro text-foreground-muted ml-9">
                      +{docs.length - 3} more
                    </Text>
                  )}
                </View>
              );
            })()}

            <View className="flex-row gap-2 mt-3">
              {isTenantHospital(selectedHospital) && (
                <Button
                  className="flex-1"
                  size="sm"
                  onPress={() => openClinicInfo(selectedHospital)}
                >
                  Clinic Info
                </Button>
              )}
              <Button
                className={isTenantHospital(selectedHospital) ? "" : "flex-1"}
                size="sm"
                onPress={() => openMapsNavigation(selectedHospital)}
                variant={isTenantHospital(selectedHospital) ? "outline" : "default"}
              >
                Navigate
              </Button>
              {selectedHospital.phone && (
                <Button
                  className="flex-1"
                  size="sm"
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

      {/* Selected Doctor Card */}
      {selectedDoctor && (
        <View className="absolute right-lg bottom-8 left-lg">
          <View className="gap-md rounded-3xl bg-background-elevated/50 p-lg shadow-xl backdrop-blur-[2px]">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-xxs">
                <Text className="font-serif text-primary text-title">
                  {selectedDoctor.profile.displayName ?? "Doctor"}
                </Text>
                {selectedDoctor.profile.headline && (
                  <Text className="font-sans text-caption text-foreground-secondary">
                    {selectedDoctor.profile.headline}
                  </Text>
                )}
              </View>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
                onPress={() => setSelectedDoctor(null)}
              >
                <X className="text-foreground-muted" size={16} />
              </Pressable>
            </View>

            {selectedDoctor.profile.specialties?.length > 0 && (
              <View className="flex-row flex-wrap gap-1">
                {selectedDoctor.profile.specialties.map((s: string) => (
                  <View key={s} className="rounded-full bg-primary-subtle px-2.5 py-0.5">
                    <Text className="font-sans text-micro text-primary">{s}</Text>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row gap-md">
              <Button
                className="flex-1"
                onPress={() => openDoctorDetail(selectedDoctor.profile.userId)}
              >
                View Profile
              </Button>
              {selectedDoctor.affiliations?.length > 0 && (
                <Button
                  className="flex-1"
                  onPress={() => {
                    const first = selectedDoctor.affiliations[0];
                    const tenant = tenants.find((t: any) => t.id === first.tenantId);
                    if (tenant) centerOnHospital(tenant);
                  }}
                  variant="outline"
                >
                  Hospital
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {!selectedHospital && !selectedDoctor && (
        <ScreenBottomBar
          leftActions={[
            {
              active: listOpen,
              icon: <ListIcon size={20} />,
              label: searchMode === "hospitals" ? "Hospitals" : "Doctors",
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
      {listOpen && searchMode === "hospitals" && (
        <View className="absolute top-32 right-lg left-lg h-auto max-h-[65%] rounded-2xl border-2 border-input bg-background-elevated/80 shadow-xl backdrop-blur-[2px]">
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
            data={filteredHospitals}
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
                  {item.id && (
                    <>
                      <Text className="font-sans text-caption text-foreground-muted">
                        &middot;
                      </Text>
                      <Text className="font-sans text-caption text-primary">
                        Clinic Info
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Doctor List Panel */}
      {listOpen && searchMode === "doctors" && (
        <View className="absolute top-36 right-lg left-lg h-auto max-h-[65%] rounded-2xl border-2 border-input bg-background-elevated/80 shadow-xl backdrop-blur-[2px]">
          <View className="flex-row items-center justify-between border-border border-b px-4 py-3">
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-background-subtle"
              onPress={() => setListOpen(false)}
            >
              <ArrowLeft className="text-foreground-muted" size={18} />
            </Pressable>
            <Text className="font-sans text-caption text-foreground">
              {search ? `Results for "${search}"` : "All doctors"}
            </Text>
            <View className="w-8" />
          </View>

          <FlatList
            className="px-2"
            contentContainerClassName="py-2 gap-2"
            data={doctorResults}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item: any) => item.profile.userId}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Stethoscope className="text-foreground-muted" size={32} />
                <Text className="mt-2 font-sans text-caption text-foreground-muted">
                  {doctorSearchQuery.isLoading
                    ? "Searching..."
                    : search
                      ? "No doctors found"
                      : "Search for doctors"}
                </Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity
                className="rounded-xl border border-border px-3 py-2.5"
                onPress={() => openDoctorDetail(item.profile.userId)}
              >
                <View className="flex-row items-center gap-2">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-subtle">
                    <User className="text-primary" size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-body text-primary">
                      {item.profile.displayName}
                    </Text>
                    <Text
                      className="font-sans text-caption text-foreground-secondary"
                      numberOfLines={1}
                    >
                      {item.profile.headline ?? item.profile.specialties?.slice(0, 2).join(", ")}
                    </Text>
                  </View>
                  <Stethoscope className="text-foreground-muted" size={16} />
                </View>
                {item.affiliations?.length > 0 && (
                  <Text className="font-sans text-caption text-foreground-muted mt-1 ml-11">
                    {item.affiliations.map((a: any) => a.tenantName).join(", ")}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Modals */}
      {renderClinicInfoModal()}
      {renderDoctorDetailModal()}
    </View>
  );
}
