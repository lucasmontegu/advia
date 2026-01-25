// apps/mobile/components/ai/route-compare-card.tsx
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type RouteAlternative = {
	id: string;
	name: string;
	type: "highway" | "scenic" | "mixed";
	distanceKm: number;
	durationMin: number;
	riskLevel: "safe" | "caution" | "warning" | "danger";
	riskScore: number;
	tollCost: number;
	fuelCost: number;
	alerts: number;
	description: string;
};

type RouteCompareCardProps = {
	alternatives: RouteAlternative[];
	recommended?: string;
	originName?: string;
	destName?: string;
	onSelectRoute?: (route: RouteAlternative) => void;
	onStartNavigation?: (route: RouteAlternative) => void;
};

const RISK_CONFIG = {
	safe: { color: "#10B981", label: "Seguro", icon: "checkCircle" as const },
	caution: { color: "#F59E0B", label: "Precaución", icon: "alert" as const },
	warning: { color: "#F97316", label: "Riesgo", icon: "warning" as const },
	danger: { color: "#EF4444", label: "Peligro", icon: "alert" as const },
};

const ROUTE_TYPE_CONFIG = {
	highway: { icon: "road" as const, label: "Autopista" },
	scenic: { icon: "map" as const, label: "Escénica" },
	mixed: { icon: "route" as const, label: "Mixta" },
};

function formatDuration(minutes: number): string {
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function formatCurrency(amount: number): string {
	return `$${amount.toLocaleString("es-MX")}`;
}

function RouteOption({
	route,
	isSelected,
	isRecommended,
	onSelect,
	onNavigate,
}: {
	route: RouteAlternative;
	isSelected: boolean;
	isRecommended: boolean;
	onSelect: () => void;
	onNavigate: () => void;
}) {
	const colors = useThemeColors();
	const riskConfig = RISK_CONFIG[route.riskLevel];
	const typeConfig = ROUTE_TYPE_CONFIG[route.type];

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			layout={Layout.springify()}
			style={[
				styles.routeCard,
				{
					backgroundColor: isSelected ? riskConfig.color + "15" : colors.muted,
				},
				isSelected && { borderColor: riskConfig.color, borderWidth: 2 },
			]}
		>
			<Pressable style={styles.routeContent} onPress={onSelect}>
				{/* Header */}
				<View style={styles.routeHeader}>
					<View style={styles.routeNameContainer}>
						<Icon name={typeConfig.icon} size={18} color={colors.primary} />
						<Text style={[styles.routeName, { color: colors.foreground }]}>
							{route.name}
						</Text>
					</View>
					{isRecommended && (
						<View
							style={[
								styles.recommendedBadge,
								{ backgroundColor: riskConfig.color },
							]}
						>
							<Icon name="star" size={12} color="#FFFFFF" />
							<Text style={styles.recommendedText}>Recomendada</Text>
						</View>
					)}
				</View>

				{/* Risk indicator */}
				<View style={styles.riskRow}>
					<View
						style={[
							styles.riskIndicator,
							{ backgroundColor: riskConfig.color + "20" },
						]}
					>
						<Icon name={riskConfig.icon} size={14} color={riskConfig.color} />
						<Text style={[styles.riskLabel, { color: riskConfig.color }]}>
							{riskConfig.label}
						</Text>
					</View>
					{route.alerts > 0 && (
						<Text
							style={[styles.alertsText, { color: colors.mutedForeground }]}
						>
							{route.alerts} alerta{route.alerts > 1 ? "s" : ""}
						</Text>
					)}
				</View>

				{/* Stats */}
				<View style={styles.statsContainer}>
					<View style={styles.statItem}>
						<Icon name="clock" size={14} color={colors.mutedForeground} />
						<Text style={[styles.statValue, { color: colors.foreground }]}>
							{formatDuration(route.durationMin)}
						</Text>
					</View>
					<View style={styles.statItem}>
						<Icon name="location" size={14} color={colors.mutedForeground} />
						<Text style={[styles.statValue, { color: colors.foreground }]}>
							{route.distanceKm} km
						</Text>
					</View>
				</View>

				{/* Costs */}
				<View style={styles.costsContainer}>
					<View style={styles.costItem}>
						<Text style={[styles.costLabel, { color: colors.mutedForeground }]}>
							Peaje
						</Text>
						<Text style={[styles.costValue, { color: colors.foreground }]}>
							{route.tollCost > 0 ? formatCurrency(route.tollCost) : "Gratis"}
						</Text>
					</View>
					<View style={styles.costItem}>
						<Text style={[styles.costLabel, { color: colors.mutedForeground }]}>
							Combustible
						</Text>
						<Text style={[styles.costValue, { color: colors.foreground }]}>
							~{formatCurrency(route.fuelCost)}
						</Text>
					</View>
					<View style={styles.costItem}>
						<Text style={[styles.costLabel, { color: colors.mutedForeground }]}>
							Total
						</Text>
						<Text
							style={[
								styles.costValue,
								{ color: colors.primary, fontFamily: "Inter_600SemiBold" },
							]}
						>
							~{formatCurrency(route.tollCost + route.fuelCost)}
						</Text>
					</View>
				</View>

				{/* Description */}
				<Text style={[styles.description, { color: colors.mutedForeground }]}>
					{route.description}
				</Text>

				{/* Navigate button */}
				{isSelected && (
					<Animated.View entering={FadeIn.duration(200)}>
						<Pressable
							style={[
								styles.navigateButton,
								{ backgroundColor: colors.primary },
							]}
							onPress={onNavigate}
						>
							<Icon name="navigation" size={16} color="#FFFFFF" />
							<Text style={styles.navigateButtonText}>Iniciar navegación</Text>
						</Pressable>
					</Animated.View>
				)}
			</Pressable>
		</Animated.View>
	);
}

export function RouteCompareCard({
	alternatives,
	recommended,
	originName,
	destName,
	onSelectRoute,
	onStartNavigation,
}: RouteCompareCardProps) {
	const colors = useThemeColors();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const handleSelect = useCallback(
		(route: RouteAlternative) => {
			setSelectedId(route.id);
			onSelectRoute?.(route);
		},
		[onSelectRoute],
	);

	const handleNavigate = useCallback(
		(route: RouteAlternative) => {
			onStartNavigation?.(route);
		},
		[onStartNavigation],
	);

	if (alternatives.length === 0) {
		return (
			<Animated.View
				entering={FadeIn.duration(300)}
				exiting={FadeOut.duration(200)}
				style={[styles.container, { backgroundColor: colors.card }]}
			>
				<View style={styles.header}>
					<Icon name="navigation" size={24} color={colors.warning} />
					<View style={styles.headerText}>
						<Text style={[styles.title, { color: colors.foreground }]}>
							Sin rutas disponibles
						</Text>
						<Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
							No se encontraron alternativas para este destino
						</Text>
					</View>
				</View>
			</Animated.View>
		);
	}

	// Find the recommended route for summary
	const recommendedRoute =
		alternatives.find((r) => r.id === recommended) || alternatives[0];

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			exiting={FadeOut.duration(200)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<View
					style={[
						styles.headerIcon,
						{ backgroundColor: colors.primary + "20" },
					]}
				>
					<Icon name="navigation" size={24} color={colors.primary} />
				</View>
				<View style={styles.headerText}>
					<Text style={[styles.title, { color: colors.foreground }]}>
						Comparar rutas
					</Text>
					{originName && destName && (
						<Text
							style={[styles.subtitle, { color: colors.mutedForeground }]}
							numberOfLines={1}
						>
							{originName} → {destName}
						</Text>
					)}
				</View>
			</View>

			{/* Summary banner */}
			{recommendedRoute && (
				<View
					style={[
						styles.summaryBanner,
						{ backgroundColor: colors.primary + "10" },
					]}
				>
					<Icon name="star" size={16} color={colors.primary} />
					<Text style={[styles.summaryText, { color: colors.foreground }]}>
						Recomendamos la {recommendedRoute.name.toLowerCase()} -{" "}
						{RISK_CONFIG[recommendedRoute.riskLevel].label.toLowerCase()} y{" "}
						{formatDuration(recommendedRoute.durationMin)}
					</Text>
				</View>
			)}

			{/* Route options */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.routesScroll}
			>
				{alternatives.map((route) => (
					<RouteOption
						key={route.id}
						route={route}
						isSelected={selectedId === route.id}
						isRecommended={route.id === recommended}
						onSelect={() => handleSelect(route)}
						onNavigate={() => handleNavigate(route)}
					/>
				))}
			</ScrollView>

			{/* Footer */}
			<Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
				Toca una ruta para ver detalles · Desliza para ver más
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
		marginBottom: 12,
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
	summaryBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		padding: 12,
		borderRadius: 10,
		marginBottom: 12,
	},
	summaryText: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
		flex: 1,
	},
	routesScroll: {
		paddingVertical: 4,
		gap: 12,
	},
	routeCard: {
		width: 220,
		borderRadius: 12,
		overflow: "hidden",
	},
	routeContent: {
		padding: 12,
		gap: 10,
	},
	routeHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	routeNameContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		flex: 1,
	},
	routeName: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 15,
		flex: 1,
	},
	recommendedBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	recommendedText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 10,
		color: "#FFFFFF",
	},
	riskRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	riskIndicator: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	riskLabel: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 11,
	},
	alertsText: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
	statsContainer: {
		flexDirection: "row",
		gap: 16,
	},
	statItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	statValue: {
		fontFamily: "Inter_500Medium",
		fontSize: 13,
	},
	costsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,0.05)",
	},
	costItem: {
		alignItems: "center",
	},
	costLabel: {
		fontFamily: "Inter_400Regular",
		fontSize: 10,
		marginBottom: 2,
	},
	costValue: {
		fontFamily: "Inter_500Medium",
		fontSize: 12,
	},
	description: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	navigateButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 10,
		borderRadius: 8,
		marginTop: 4,
	},
	navigateButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 13,
		color: "#FFFFFF",
	},
	footerHint: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
		textAlign: "center",
		marginTop: 12,
	},
});
