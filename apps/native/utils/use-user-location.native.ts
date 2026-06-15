import * as Location from "expo-location"
import { useCallback, useEffect, useState } from "react"

interface UserLocation {
  lat: number
  lng: number
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          setError("Permission denied")
          return
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      }
    })()
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return { location, error, requestLocation }
}
