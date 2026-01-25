// apps/mobile/components/route-weather-layer.tsx
import Mapbox from "@rnmapbox/maps";
import { useMemo } from "react";
import type { RoadRisk, RouteWeatherSegment } from "@/hooks/use-route-weather";
import { RISK_COLORS } from "@/hooks/use-route-weather";

type RouteWeatherLayerProps = {
	/**
	 * Weather segments from the route analysis API.
	 * Each segment contains coordinates and risk level.
	 */
	segments: RouteWeatherSegment[];
	/**
	 * Whether to show weather icons at segment points
	 */
	showIcons?: boolean;
	/**
	 * Line width for the route
	 */
	lineWidth?: number;
};

/**
 * RouteWeatherLayer renders a route with color-coded segments
 * based on weather risk levels.
 *
 * Colors:
 * - Green (low risk): Safe driving conditions
 * - Yellow (moderate): Caution recommended
 * - Orange (high): Difficult conditions
 * - Red (extreme): Dangerous - avoid if possible
 */
export function RouteWeatherLayer({
	segments,
	showIcons = true,
	lineWidth = 6,
}: RouteWeatherLayerProps) {
	// Create GeoJSON LineString features for each risk-based segment
	const routeFeatures = useMemo(() => {
		if (segments.length < 2) return null;

		// Group consecutive points by risk level to create segments
		const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
		let currentRisk: RoadRisk = segments[0]!.weather.roadRisk;
		let currentSegmentCoords: [number, number][] = [
			[segments[0]!.lng, segments[0]!.lat],
		];

		for (let i = 1; i < segments.length; i++) {
			const segment = segments[i]!;
			const risk = segment.weather.roadRisk;

			if (risk !== currentRisk) {
				// Close current segment and start new one
				currentSegmentCoords.push([segment.lng, segment.lat]);
				features.push({
					type: "Feature",
					properties: {
						risk: currentRisk,
						color: RISK_COLORS[currentRisk],
					},
					geometry: {
						type: "LineString",
						coordinates: currentSegmentCoords,
					},
				});

				// Start new segment
				currentRisk = risk;
				currentSegmentCoords = [[segment.lng, segment.lat]];
			} else {
				currentSegmentCoords.push([segment.lng, segment.lat]);
			}
		}

		// Close the last segment
		if (currentSegmentCoords.length > 1) {
			features.push({
				type: "Feature",
				properties: {
					risk: currentRisk,
					color: RISK_COLORS[currentRisk],
				},
				geometry: {
					type: "LineString",
					coordinates: currentSegmentCoords,
				},
			});
		}

		return {
			type: "FeatureCollection" as const,
			features,
		};
	}, [segments]);

	// Create point features for weather icons
	const iconFeatures = useMemo(() => {
		if (!showIcons || segments.length === 0) return null;

		// Show icons at start, middle, and end of route
		const iconIndices = [
			0,
			Math.floor(segments.length / 2),
			segments.length - 1,
		];
		const uniqueIndices = [...new Set(iconIndices)].filter(
			(i) => i >= 0 && i < segments.length,
		);

		const features: GeoJSON.Feature<GeoJSON.Point>[] = uniqueIndices.map(
			(i) => {
				const segment = segments[i]!;
				return {
					type: "Feature",
					properties: {
						risk: segment.weather.roadRisk,
						precipType: segment.weather.precipitationType,
						temp: Math.round(segment.weather.temperature),
						km: segment.km,
					},
					geometry: {
						type: "Point",
						coordinates: [segment.lng, segment.lat],
					},
				};
			},
		);

		return {
			type: "FeatureCollection" as const,
			features,
		};
	}, [segments, showIcons]);

	if (!routeFeatures || routeFeatures.features.length === 0) {
		return null;
	}

	return (
		<>
			{/* Route line segments with risk-based colors */}
			<Mapbox.ShapeSource id="route-weather-source" shape={routeFeatures}>
				{/* Background line (creates border effect) */}
				<Mapbox.LineLayer
					id="route-weather-bg"
					style={{
						lineColor: "#000000",
						lineWidth: lineWidth + 2,
						lineOpacity: 0.3,
						lineCap: "round",
						lineJoin: "round",
					}}
				/>
				{/* Main colored line */}
				<Mapbox.LineLayer
					id="route-weather-line"
					style={{
						lineColor: ["get", "color"],
						lineWidth: lineWidth,
						lineCap: "round",
						lineJoin: "round",
					}}
				/>
			</Mapbox.ShapeSource>

			{/* Weather icons at key points */}
			{iconFeatures && iconFeatures.features.length > 0 && (
				<Mapbox.ShapeSource id="route-weather-icons" shape={iconFeatures}>
					<Mapbox.CircleLayer
						id="route-weather-icon-bg"
						style={{
							circleRadius: 16,
							circleColor: "#ffffff",
							circleStrokeColor: [
								"match",
								["get", "risk"],
								"low",
								RISK_COLORS.low,
								"moderate",
								RISK_COLORS.moderate,
								"high",
								RISK_COLORS.high,
								"extreme",
								RISK_COLORS.extreme,
								RISK_COLORS.low,
							],
							circleStrokeWidth: 3,
						}}
					/>
					<Mapbox.SymbolLayer
						id="route-weather-icon-label"
						style={{
							textField: ["concat", ["to-string", ["get", "temp"]], "°"],
							textSize: 12,
							textColor: "#1f2937",
							textAllowOverlap: true,
						}}
					/>
				</Mapbox.ShapeSource>
			)}
		</>
	);
}

/**
 * RouteOverallRiskIndicator shows a badge with the overall route risk
 */
export function getOverallRiskEmoji(risk: RoadRisk): string {
	const emojis: Record<RoadRisk, string> = {
		low: "✅",
		moderate: "⚠️",
		high: "🟠",
		extreme: "🛑",
	};
	return emojis[risk];
}
