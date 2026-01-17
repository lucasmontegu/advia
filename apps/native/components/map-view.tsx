import Mapbox, { Camera, LocationPuck, MapView as RNMapView } from "@rnmapbox/maps";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { env } from "@advia/env/native";
import { useLocation } from "@/hooks/use-location";

// Initialize Mapbox with access token
Mapbox.setAccessToken(env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

type AlertPolygon = {
  id: string;
  coordinates: number[][][];
  severity: "extreme" | "severe" | "moderate" | "minor";
  title: string;
};

type MapViewProps = {
  alerts?: AlertPolygon[];
  onMapReady?: () => void;
};

const SEVERITY_COLORS = {
  extreme: "rgba(220, 38, 38, 0.4)", // red
  severe: "rgba(249, 115, 22, 0.4)", // orange
  moderate: "rgba(234, 179, 8, 0.4)", // yellow
  minor: "rgba(34, 197, 94, 0.4)", // green
};

const SEVERITY_STROKE_COLORS = {
  extreme: "rgba(220, 38, 38, 0.8)",
  severe: "rgba(249, 115, 22, 0.8)",
  moderate: "rgba(234, 179, 8, 0.8)",
  minor: "rgba(34, 197, 94, 0.8)",
};

export function MapViewComponent({ alerts = [], onMapReady }: MapViewProps) {
  const { location, isLoading } = useLocation();
  const [mapLoaded, setMapLoaded] = useState(false);

  const initialCenter = location
    ? [location.longitude, location.latitude]
    : [-64.18, -31.42]; // Default: Córdoba, Argentina

  useEffect(() => {
    if (mapLoaded && onMapReady) {
      onMapReady();
    }
  }, [mapLoaded, onMapReady]);

  return (
    <View style={styles.container}>
      <RNMapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        onDidFinishLoadingMap={() => setMapLoaded(true)}
      >
        <Camera
          zoomLevel={12}
          centerCoordinate={initialCenter}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* User location puck */}
        <LocationPuck
          puckBearing="heading"
          puckBearingEnabled
          pulsing={{ isEnabled: true, color: "#3b82f6", radius: 50 }}
        />

        {/* Alert polygons */}
        {alerts.map((alert) => (
          <Mapbox.ShapeSource
            key={alert.id}
            id={`alert-source-${alert.id}`}
            shape={{
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: alert.coordinates,
              },
              properties: {
                severity: alert.severity,
                title: alert.title,
              },
            }}
          >
            <Mapbox.FillLayer
              id={`alert-fill-${alert.id}`}
              style={{
                fillColor: SEVERITY_COLORS[alert.severity],
                fillOpacity: 0.6,
              }}
            />
            <Mapbox.LineLayer
              id={`alert-line-${alert.id}`}
              style={{
                lineColor: SEVERITY_STROKE_COLORS[alert.severity],
                lineWidth: 2,
              }}
            />
          </Mapbox.ShapeSource>
        ))}
      </RNMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
