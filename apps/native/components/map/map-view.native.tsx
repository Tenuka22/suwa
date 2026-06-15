"use client";

import { Hospital as HospitalIcon } from "lucide-react-native";
import { forwardRef } from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { GALLE_REGION, type Hospital } from "@/data/hospitals";

interface MapViewProps {
  filteredHospitals: Hospital[];
  onMarkerPress: (hospital: Hospital) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const MapComponent = forwardRef<MapView, MapViewProps>(
  ({ filteredHospitals, onMarkerPress }, ref) => (
    <MapView
      className="flex-1"
      initialRegion={GALLE_REGION}
      ref={ref}
      showsUserLocation
    >
      {filteredHospitals.map((hospital) => (
        <Marker
          coordinate={{
            latitude: hospital.latitude,
            longitude: hospital.longitude,
          }}
          key={hospital.name}
          onPress={() => onMarkerPress(hospital)}
          tracksViewChanges={false}
        >
          <View
            className="items-center justify-center rounded-full border-2 border-border bg-primary"
            style={{
              width: 28,
              height: 28,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <HospitalIcon color="white" size={14} strokeWidth={2.5} />
          </View>
        </Marker>
      ))}
    </MapView>
  )
);

MapComponent.displayName = "MapView";

export default MapComponent;
