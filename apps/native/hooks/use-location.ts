import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type LocationState = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
} | null;

export type LocationError = {
  code: string;
  message: string;
} | null;

export function useLocation() {
  const [location, setLocation] = useState<LocationState>(null);
  const [error, setError] = useState<LocationError>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function startLocationTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);

        if (status !== "granted") {
          setError({
            code: "PERMISSION_DENIED",
            message: "Se necesita permiso de ubicación para usar la app",
          });
          setIsLoading(false);
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          accuracy: initialLocation.coords.accuracy,
          speed: initialLocation.coords.speed,
          heading: initialLocation.coords.heading,
        });
        setIsLoading(false);

        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy,
              speed: newLocation.coords.speed,
              heading: newLocation.coords.heading,
            });
          }
        );
      } catch (err) {
        setError({
          code: "LOCATION_ERROR",
          message:
            err instanceof Error ? err.message : "Error al obtener ubicación",
        });
        setIsLoading(false);
      }
    }

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const isDriving = location?.speed ? location.speed > 4.17 : false; // > 15 km/h

  return {
    location,
    error,
    isLoading,
    permissionStatus,
    isDriving,
  };
}
