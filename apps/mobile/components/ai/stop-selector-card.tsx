// apps/mobile/components/ai/stop-selector-card.tsx
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
	buildNavigationURL,
	safeOpenURL,
	sanitizeCoordinates,
} from "@/lib/url-security";

export type SafeStop = {
	id: string;
	name: string;
	type: "gas_station" | "rest_area" | "town" | "convenience_store";
	lat: number;
	lng: number;
	distanceKm: number;
	address?: string;
	reason: string;
};

type StopSelectorCardProps = {
	stops: SafeStop[];
	urgency?: "low" | "medium" | "high";
	onStopSelect?: (stop: SafeStop) => void;
	onNavigate?: (stop: SafeStop) => void;
};

const TYPE_CONFIG: Record<SafeStop["type"], { icon: string; label: string }> = {
	gas_station: { icon: "gas", label: "Gasolinera" },
	rest_area: { icon: "parking", label: "Área de descanso" },
	town: { icon: "location", label: "Localidad" },
	convenience_store: { icon: "store", label: "Tienda" },
};

function StopItem({
	stop,
	isSelected,
	onSelect,
	onNavigate,
	urgency,
}: {
	stop: SafeStop;
	isSelected: boolean;
	onSelect: () => void;
	onNavigate: () => void;
	urgency: "low" | "medium" | "high";
}) {
	const colors = useThemeColors();
	const config = TYPE_CONFIG[stop.type] || TYPE_CONFIG.gas_station;

	const getUrgencyColor = () => {
		switch (urgency) {
			case "high":
				return colors.danger;
			case "medium":
				return colors.warning;
			default:
				return colors.primary;
		}
	};

	const openNavigation = useCallback(async () => {
		// Validate coordinates before building URLs
		const coords = sanitizeCoordinates(stop.lat, stop.lng);
		if (!coords) {
			console.error("[Security] Invalid coordinates for navigation");
			return;
		}

		// Build validated navigation URLs
		const wazeUrl = buildNavigationURL(
			"waze",
			coords.latitude,
			coords.longitude,
		);
		const googleUrl = buildNavigationURL(
			"google",
			coords.latitude,
			coords.longitude,
		);

		// Try Waze first, then Google Maps
		if (wazeUrl && (await safeOpenURL(wazeUrl))) {
			onNavigate();
			return;
		}

		if (googleUrl && (await safeOpenURL(googleUrl))) {
			onNavigate();
			return;
		}

		console.warn("[Navigation] Could not open any navigation app");
	}, [stop, onNavigate]);

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			layout={Layout.springify()}
			style={[
				styles.stopItem,
				{
					backgroundColor: isSelected ? getUrgencyColor() + "15" : colors.muted,
				},
				isSelected && { borderColor: getUrgencyColor(), borderWidth: 2 },
			]}
		>
			<Pressable style={styles.stopContent} onPress={onSelect}>
				{/* Checkbox */}
				<View
					style={[
						styles.checkbox,
						{ borderColor: isSelected ? getUrgencyColor() : colors.border },
						isSelected && { backgroundColor: getUrgencyColor() },
					]}
				>
					{isSelected && <Icon name="checkmark" size={14} color="#FFFFFF" />}
				</View>

				{/* Type icon */}
				<View style={[styles.typeIcon, { backgroundColor: colors.card }]}>
					<Icon name={config.icon as any} size={18} color={getUrgencyColor()} />
				</View>

				{/* Info */}
				<View style={styles.stopInfo}>
					<Text
						style={[styles.stopName, { color: colors.foreground }]}
						numberOfLines={1}
					>
						{stop.name}
					</Text>
					<Text
						style={[styles.stopMeta, { color: colors.mutedForeground }]}
						numberOfLines={1}
					>
						{config.label} · {stop.distanceKm} km
					</Text>
					<Text
						style={[styles.stopReason, { color: colors.mutedForeground }]}
						numberOfLines={2}
					>
						{stop.reason}
					</Text>
				</View>

				{/* Navigate button */}
				<Pressable
					style={[styles.navButton, { backgroundColor: getUrgencyColor() }]}
					onPress={openNavigation}
				>
					<Icon name="navigation" size={18} color="#FFFFFF" />
				</Pressable>
			</Pressable>
		</Animated.View>
	);
}

export function StopSelectorCard({
	stops,
	urgency = "medium",
	onStopSelect,
	onNavigate,
}: StopSelectorCardProps) {
	const colors = useThemeColors();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const handleSelect = useCallback(
		(stop: SafeStop) => {
			setSelectedId(stop.id);
			onStopSelect?.(stop);
		},
		[onStopSelect],
	);

	const handleNavigate = useCallback(
		(stop: SafeStop) => {
			onNavigate?.(stop);
		},
		[onNavigate],
	);

	const getUrgencyHeader = () => {
		switch (urgency) {
			case "high":
				return {
					icon: "alert" as const,
					title: "Refugios de emergencia",
					subtitle: "Dirígete al más cercano ahora",
					color: colors.danger,
				};
			case "medium":
				return {
					icon: "shield" as const,
					title: "Paradas sugeridas",
					subtitle: "Considera detenerte pronto",
					color: colors.warning,
				};
			default:
				return {
					icon: "location" as const,
					title: "Lugares seguros cercanos",
					subtitle: "Por si necesitas parar",
					color: colors.primary,
				};
		}
	};

	const header = getUrgencyHeader();

	if (stops.length === 0) {
		return (
			<Animated.View
				entering={FadeIn.duration(300)}
				exiting={FadeOut.duration(200)}
				style={[styles.container, { backgroundColor: colors.card }]}
			>
				<View style={styles.header}>
					<Icon name="alert" size={24} color={colors.warning} />
					<View style={styles.headerText}>
						<Text style={[styles.title, { color: colors.foreground }]}>
							Sin refugios cercanos
						</Text>
						<Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
							Busca un lugar seguro fuera de la carretera
						</Text>
					</View>
				</View>
			</Animated.View>
		);
	}

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			exiting={FadeOut.duration(200)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<View
					style={[styles.headerIcon, { backgroundColor: header.color + "20" }]}
				>
					<Icon name={header.icon} size={24} color={header.color} />
				</View>
				<View style={styles.headerText}>
					<Text style={[styles.title, { color: colors.foreground }]}>
						{header.title}
					</Text>
					<Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
						{header.subtitle}
					</Text>
				</View>
			</View>

			{/* Stops list */}
			<View style={styles.stopsList}>
				{stops.map((stop) => (
					<StopItem
						key={stop.id}
						stop={stop}
						isSelected={selectedId === stop.id}
						onSelect={() => handleSelect(stop)}
						onNavigate={() => handleNavigate(stop)}
						urgency={urgency}
					/>
				))}
			</View>

			{/* Footer hint */}
			<Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
				Toca para seleccionar · Presiona el icono de navegación para ir
			</Text>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 16,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 16,
	},
	headerIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
		marginBottom: 2,
	},
	subtitle: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
	},
	stopsList: {
		gap: 8,
	},
	stopItem: {
		borderRadius: 12,
		overflow: "hidden",
	},
	stopContent: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		gap: 12,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		justifyContent: "center",
		alignItems: "center",
	},
	typeIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	stopInfo: {
		flex: 1,
	},
	stopName: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
	},
	stopMeta: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	stopReason: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
		marginTop: 4,
	},
	navButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	footerHint: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
		textAlign: "center",
		marginTop: 12,
	},
});
