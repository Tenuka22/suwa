"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Map, type MapRef, Marker } from "@vis.gl/react-maplibre";
import { Hospital as HospitalIcon } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "react-native";

import { GALLE_REGION, type Hospital } from "@/data/hospitals";

interface MapViewProps {
  filteredHospitals: Hospital[];
  onMarkerPress: (hospital: Hospital) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const MapComponent = forwardRef<
  {
    animateToRegion: (
      region: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
      },
      duration: number
    ) => void;
  },
  MapViewProps
>(({ filteredHospitals, onMarkerPress, userLocation }, ref) => {
  const mapRef = useRef<MapRef>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion(region, _duration) {
      mapRef.current?.flyTo({
        center: [region.longitude, region.latitude],
        zoom: 14,
        duration: _duration,
      });
    },
  }));

  return (
    <View className="flex-1">
      <Map
        initialViewState={{
          longitude: GALLE_REGION.longitude,
          latitude: GALLE_REGION.latitude,
          zoom: GALLE_REGION.latitudeDelta > 0.1 ? 11 : 13,
        }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
      >
        {userLocation && (
          <Marker latitude={userLocation.lat} longitude={userLocation.lng}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#3b82f6",
                borderWidth: 3,
                borderColor: "white",
                boxShadow: "0 0 4px rgba(59, 130, 246, 0.5)",
              }}
            />
          </Marker>
        )}
        {filteredHospitals.map((hospital) => (
          <Marker
            key={hospital.name}
            latitude={hospital.latitude}
            longitude={hospital.longitude}
            onClick={() => onMarkerPress(hospital)}
            style={{ cursor: "pointer" }}
          >
            <View
              className="items-center justify-center rounded-full border-2 border-border bg-primary"
              style={{
                width: 28,
                height: 28,
                boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              }}
            >
              <HospitalIcon color="white" size={14} strokeWidth={2.5} />
            </View>
          </Marker>
        ))}
      </Map>
    </View>
  );
});

MapComponent.displayName = "MapView";

export default MapComponent;
