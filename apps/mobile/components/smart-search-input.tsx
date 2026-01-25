import { env } from "@driwet/env/mobile";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Keyboard,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import Animated, {
	FadeIn,
	FadeOut,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { useLocation } from "@/hooks/use-location";
import { useThemeColors } from "@/hooks/use-theme-colors";

type RouteLocation = {
	name: string;
	coordinates: { latitude: number; longitude: number };
};

type MapboxFeature = {
	id: string;
	place_name: string;
	center: [number, number]; // [longitude, latitude]
};

type SmartSearchInputProps = {
	origin: RouteLocation | null;
	destination: RouteLocation | null;
	onRouteChange: (
		origin: RouteLocation | null,
		destination: RouteLocation | null,
	) => void;
};

// Patterns to detect origin and destination
const ROUTE_PATTERNS = [
	/^de\s+(.+?)\s+a\s+(.+)$/i,
	/^desde\s+(.+?)\s+hasta\s+(.+)$/i,
	/^(.+?)\s*→\s*(.+)$/,
	/^salgo\s+de\s+(.+?)\s+voy\s+a\s+(.+)$/i,
];

// Pattern to detect we're typing origin
const ORIGIN_PATTERNS = [
	/^de\s+(.+)$/i,
	/^desde\s+(.+)$/i,
	/^salgo\s+de\s+(.+)$/i,
];

export function SmartSearchInput({
	origin,
	destination,
	onRouteChange,
}: SmartSearchInputProps) {
	const colors = useThemeColors();
	const { location: userLocation } = useLocation();
	const inputRef = useRef<TextInput>(null);

	const [inputValue, setInputValue] = useState("");
	const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [activeField, setActiveField] = useState<
		"origin" | "destination" | null
	>(null);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Geocode search using Mapbox
	const searchPlaces = useCallback(
		async (
			query: string,
			userLocation?: { latitude: number; longitude: number },
		) => {
			if (query.length < 2) {
				setSuggestions([]);
				return;
			}

			setIsLoading(true);
			try {
				// Build URL with parameters for better international results
				let url =
					`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
					`access_token=${env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}&` +
					"types=place,locality,region,country,address&" +
					"language=es&" +
					"limit=6";

				// If we have user location, use proximity to bias (not restrict) results
				if (userLocation) {
					url += `&proximity=${userLocation.longitude},${userLocation.latitude}`;
				}

				const response = await fetch(url);
				const data = await response.json();
				setSuggestions(data.features || []);
			} catch (error) {
				console.error("Geocoding error:", error);
				setSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	// Parse input to detect patterns
	const parseInput = useCallback((text: string) => {
		// Check for complete route patterns
		for (const pattern of ROUTE_PATTERNS) {
			const match = text.match(pattern);
			if (match) {
				return {
					type: "complete" as const,
					originQuery: match[1]?.trim(),
					destinationQuery: match[2]?.trim(),
				};
			}
		}

		// Check for origin-only patterns
		for (const pattern of ORIGIN_PATTERNS) {
			const match = text.match(pattern);
			if (match) {
				return {
					type: "origin" as const,
					query: match[1]?.trim(),
				};
			}
		}

		// Default: treat as destination search
		return {
			type: "destination" as const,
			query: text.trim(),
		};
	}, []);

	// Handle text input change
	const handleTextChange = useCallback(
		(text: string) => {
			setInputValue(text);

			// Clear previous timeout
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			const parsed = parseInput(text);

			// Debounce search
			searchTimeoutRef.current = setTimeout(async () => {
				if (parsed.type === "origin" && parsed.query) {
					setActiveField("origin");
					searchPlaces(parsed.query, userLocation ?? undefined);
					setShowSuggestions(true);
				} else if (parsed.type === "destination" && parsed.query) {
					setActiveField("destination");
					searchPlaces(parsed.query, userLocation ?? undefined);
					setShowSuggestions(true);
				} else if (parsed.type === "complete") {
					// For complete patterns, first auto-geocode origin, then search destination
					if (parsed.originQuery && !origin) {
						// Auto-geocode origin and set it
						try {
							let url =
								`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(parsed.originQuery)}.json?` +
								`access_token=${env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}&` +
								"types=place,locality,region,country,address&" +
								"language=es&" +
								"limit=1";
							if (userLocation) {
								url += `&proximity=${userLocation.longitude},${userLocation.latitude}`;
							}
							const response = await fetch(url);
							const data = await response.json();
							if (data.features && data.features.length > 0) {
								const feature = data.features[0];
								const originLocation: RouteLocation = {
									name: feature.place_name.split(",")[0] || feature.place_name,
									coordinates: {
										latitude: feature.center[1],
										longitude: feature.center[0],
									},
								};
								onRouteChange(originLocation, destination);
							}
						} catch (error) {
							console.error("Auto-geocode origin error:", error);
						}
					}
					// Then search for destination
					setActiveField("destination");
					if (parsed.destinationQuery) {
						searchPlaces(parsed.destinationQuery, userLocation ?? undefined);
						setShowSuggestions(true);
					}
				} else {
					setShowSuggestions(false);
				}
			}, 300);
		},
		[
			parseInput,
			searchPlaces,
			userLocation,
			origin,
			destination,
			onRouteChange,
		],
	);

	// Handle suggestion selection
	const handleSelectSuggestion = useCallback(
		(feature: MapboxFeature) => {
			const location: RouteLocation = {
				name: feature.place_name.split(",")[0] || feature.place_name,
				coordinates: {
					latitude: feature.center[1],
					longitude: feature.center[0],
				},
			};

			if (activeField === "origin") {
				onRouteChange(location, destination);
				// Continue to destination input
				setInputValue(`de ${location.name} a `);
				setActiveField("destination");
			} else {
				onRouteChange(origin, location);
				setInputValue("");
				Keyboard.dismiss();
			}

			setSuggestions([]);
			setShowSuggestions(false);
		},
		[activeField, origin, destination, onRouteChange],
	);

	// Handle clear
	const handleClear = useCallback(() => {
		setInputValue("");
		onRouteChange(null, null);
		setSuggestions([]);
		setShowSuggestions(false);
		setActiveField(null);
	}, [onRouteChange]);

	// Handle token press (to edit)
	const handleTokenPress = useCallback(
		(field: "origin" | "destination") => {
			if (field === "origin" && origin) {
				setInputValue("de ");
				onRouteChange(null, destination);
				setActiveField("origin");
				inputRef.current?.focus();
			} else if (field === "destination" && destination) {
				setInputValue(origin ? `de ${origin.name} a ` : "");
				onRouteChange(origin, null);
				setActiveField("destination");
				inputRef.current?.focus();
			}
		},
		[origin, destination, onRouteChange],
	);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	const hasRoute = origin && destination;

	return (
		<View style={styles.container}>
			{/* Main Input Container */}
			<View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
				<Icon name="search" size={20} color={colors.mutedForeground} />

				{hasRoute ? (
					// Show tokens when route is complete
					<View style={styles.tokensContainer}>
						<TouchableOpacity
							onPress={() => handleTokenPress("origin")}
							style={[styles.token, { backgroundColor: colors.primary + "20" }]}
						>
							<Icon name="location" size={14} color={colors.primary} />
							<Text
								style={[styles.tokenText, { color: colors.primary }]}
								numberOfLines={1}
							>
								{origin.name}
							</Text>
						</TouchableOpacity>

						<Text style={[styles.arrow, { color: colors.mutedForeground }]}>
							→
						</Text>

						<TouchableOpacity
							onPress={() => handleTokenPress("destination")}
							style={[
								styles.token,
								{ backgroundColor: colors.destructive + "20" },
							]}
						>
							<Icon name="route" size={14} color={colors.destructive} />
							<Text
								style={[styles.tokenText, { color: colors.destructive }]}
								numberOfLines={1}
							>
								{destination.name}
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					// Show text input when building route
					<TextInput
						ref={inputRef}
						style={[styles.input, { color: colors.foreground }]}
						placeholder='¿A dónde vas? Ej: "de Córdoba a Buenos Aires"'
						placeholderTextColor={colors.mutedForeground}
						value={inputValue}
						onChangeText={handleTextChange}
						onFocus={() => setShowSuggestions(suggestions.length > 0)}
						autoCorrect={false}
						autoCapitalize="none"
					/>
				)}

				{/* Clear button */}
				{(inputValue.length > 0 || hasRoute) && (
					<TouchableOpacity onPress={handleClear} style={styles.clearButton}>
						<Icon name="close" size={18} color={colors.mutedForeground} />
					</TouchableOpacity>
				)}
			</View>

			{/* Suggestions Dropdown */}
			{showSuggestions && (
				<Animated.View
					entering={FadeIn.duration(200)}
					exiting={FadeOut.duration(150)}
					style={[
						styles.suggestionsContainer,
						{ backgroundColor: colors.card },
					]}
				>
					{isLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="small" color={colors.primary} />
						</View>
					) : suggestions.length > 0 ? (
						<FlatList
							data={suggestions}
							keyExtractor={(item) => item.id}
							keyboardShouldPersistTaps="handled"
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.suggestionItem}
									onPress={() => handleSelectSuggestion(item)}
								>
									<Icon
										name="location"
										size={16}
										color={
											activeField === "origin"
												? colors.primary
												: colors.destructive
										}
									/>
									<View style={styles.suggestionTextContainer}>
										<Text
											style={[
												styles.suggestionTitle,
												{ color: colors.foreground },
											]}
											numberOfLines={1}
										>
											{item.place_name.split(",")[0]}
										</Text>
										<Text
											style={[
												styles.suggestionSubtitle,
												{ color: colors.mutedForeground },
											]}
											numberOfLines={1}
										>
											{item.place_name.split(",").slice(1).join(",").trim()}
										</Text>
									</View>
								</TouchableOpacity>
							)}
							ItemSeparatorComponent={() => (
								<View
									style={[styles.separator, { backgroundColor: colors.border }]}
								/>
							)}
						/>
					) : inputValue.length >= 2 ? (
						<View style={styles.noResultsContainer}>
							<Text
								style={[
									styles.noResultsText,
									{ color: colors.mutedForeground },
								]}
							>
								No se encontraron resultados
							</Text>
						</View>
					) : null}
				</Animated.View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		zIndex: 100,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 16,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	input: {
		flex: 1,
		fontFamily: "Inter_400Regular",
		fontSize: 15,
		padding: 0,
	},
	tokensContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	token: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 20,
		gap: 4,
		maxWidth: "40%",
	},
	tokenText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 13,
		flexShrink: 1,
	},
	arrow: {
		fontFamily: "Inter_400Regular",
		fontSize: 16,
	},
	clearButton: {
		padding: 4,
	},
	suggestionsContainer: {
		marginTop: 8,
		borderRadius: 16,
		overflow: "hidden",
		maxHeight: 250,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	loadingContainer: {
		padding: 20,
		alignItems: "center",
	},
	suggestionItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
	},
	suggestionTextContainer: {
		flex: 1,
	},
	suggestionTitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
	},
	suggestionSubtitle: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	separator: {
		height: 1,
		marginHorizontal: 16,
	},
	noResultsContainer: {
		padding: 20,
		alignItems: "center",
	},
	noResultsText: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
	},
});
