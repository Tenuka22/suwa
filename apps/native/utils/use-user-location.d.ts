export function useUserLocation(): {
  location: { lat: number; lng: number } | null
  error: string | null
  requestLocation: () => void
}
