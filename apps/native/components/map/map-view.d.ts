import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { Hospital } from "@/data/hospitals";

interface MapViewProps {
  filteredHospitals: Hospital[];
  onMarkerPress: (hospital: Hospital) => void;
  userLocation?: { lat: number; lng: number } | null;
}

type MapViewRef = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration: number
  ) => void;
};

declare const MapComponent: ForwardRefExoticComponent<
  MapViewProps & RefAttributes<MapViewRef>
>;

export default MapComponent;
