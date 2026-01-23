import * as Location from "expo-location";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n";

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

  const { t } = useTranslation();

  // Use ref to avoid restarting location tracking when t changes
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    async function startLocationTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        setPermissionStatus(status);

        if (status !== "granted") {
          setError({
            code: "PERMISSION_DENIED",
            message: tRef.current("location.permissionDenied"),
          });
          setIsLoading(false);
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;

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
            if (!isMounted) return;
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
        if (!isMounted) return;
        setError({
          code: "LOCATION_ERROR",
          message:
            err instanceof Error ? err.message : tRef.current("location.error"),
        });
        setIsLoading(false);
      }
    }

    startLocationTracking();

    return () => {
      isMounted = false;
      locationSubscription?.remove();
    };
  }, []);

  // Simple driving detection - for advanced detection with hysteresis, use useDrivingMode
  const isDriving = location?.speed ? location.speed > 2.78 : false; // > 10 km/h

  return {
    location,
    error,
    isLoading,
    permissionStatus,
    isDriving,
  };
}
