// apps/mobile/components/chat-input.tsx

import { env } from "@driwet/env/mobile";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	GestureResponderEvent,
	Keyboard,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import Animated, {
	Extrapolation,
	FadeIn,
	FadeOut,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { RecordingIndicator } from "@/components/voice";
import { useLocation } from "@/hooks/use-location";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useVoiceRecording } from "@/hooks/use-voice-recording";

// Types
export type RouteLocation = {
	name: string;
	coordinates: { latitude: number; longitude: number };
};

type MapboxFeature = {
	id: string;
	place_name: string;
	center: [number, number]; // [longitude, latitude]
};

type ChatInputProps = {
	origin: RouteLocation | null;
	destination: RouteLocation | null;
	onRouteChange: (
		origin: RouteLocation | null,
		destination: RouteLocation | null,
	) => void;
	onChatSubmit: (message: string) => void;
	isLoading?: boolean;
	disabled?: boolean;
};

// Patterns to detect origin and destination
const ROUTE_PATTERNS = [
	/^de\s+(.+?)\s+a\s+(.+)$/i,
	/^desde\s+(.+?)\s+hasta\s+(.+)$/i,
	/^(.+?)\s*→\s*(.+)$/,
	/^salgo\s+de\s+(.+?)\s+voy\s+a\s+(.+)$/i,
	/^from\s+(.+?)\s+to\s+(.+)$/i,
];

// Pattern to detect we're typing origin
const ORIGIN_PATTERNS = [
	/^de\s+(.+)$/i,
	/^desde\s+(.+)$/i,
	/^salgo\s+de\s+(.+)$/i,
	/^from\s+(.+)$/i,
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChatInput({
	origin,
	destination,
	onRouteChange,
	onChatSubmit,
	isLoading = false,
	disabled = false,
}: ChatInputProps) {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { location: userLocation } = useLocation();
	const inputRef = useRef<TextInput>(null);

	// State
	const [inputValue, setInputValue] = useState("");
	const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [activeField, setActiveField] = useState<
		"origin" | "destination" | "chat" | null
	>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	// Voice recording
	const voiceRecording = useVoiceRecording({
		onTranscription: (text) => {
			if (text.trim()) {
				// If we have a route, treat as chat message
				if (origin && destination) {
					onChatSubmit(text.trim());
				} else {
					// Otherwise, populate the input for location search
					setInputValue(text.trim());
					handleTextChange(text.trim());
				}
			}
		},
		onError: (error) => {
			console.error("Voice recording error:", error);
		},
		maxDuration: 30,
	});

	// Animation values
	const expandProgress = useSharedValue(0);
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const voicePressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	// Animated styles for expansion
	const containerAnimatedStyle = useAnimatedStyle(() => {
		const height = interpolate(
			expandProgress.value,
			[0, 1],
			[56, 140],
			Extrapolation.CLAMP,
		);
		return {
			height,
		};
	});

	const inputAnimatedStyle = useAnimatedStyle(() => {
		const height = interpolate(
			expandProgress.value,
			[0, 1],
			[44, 100],
			Extrapolation.CLAMP,
		);
		return {
			height,
		};
	});

	// Handle expansion
	const handleFocus = useCallback(() => {
		setIsExpanded(true);
		expandProgress.value = withSpring(1, { damping: 20, stiffness: 300 });
	}, [expandProgress]);

	const handleBlur = useCallback(() => {
		if (!inputValue.trim()) {
			setIsExpanded(false);
			expandProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
		}
	}, [inputValue, expandProgress]);

	// Geocode search using Mapbox
	const searchPlaces = useCallback(
		async (
			query: string,
			location?: { latitude: number; longitude: number },
		) => {
			if (query.length < 2) {
				setSuggestions([]);
				return;
			}

			setIsSearching(true);
			try {
				let url =
					`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
					`access_token=${env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}&` +
					"types=place,locality,region,country,address&" +
					"language=es&" +
					"limit=5";

				if (location) {
					url += `&proximity=${location.longitude},${location.latitude}`;
				}

				const response = await fetch(url);
				const data = await response.json();
				setSuggestions(data.features || []);
			} catch (error) {
				console.error("Geocoding error:", error);
				setSuggestions([]);
			} finally {
				setIsSearching(false);
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

		// Check if it's a question (chat mode)
		const isQuestion =
			/^(como|que|cual|donde|cuando|por que|cuanto|hay|\?)/i.test(text.trim());
		if (isQuestion) {
			return { type: "chat" as const, query: text.trim() };
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

			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			const parsed = parseInput(text);

			searchTimeoutRef.current = setTimeout(async () => {
				if (parsed.type === "chat") {
					setActiveField("chat");
					setSuggestions([]);
				} else if (parsed.type === "origin" && parsed.query) {
					setActiveField("origin");
					searchPlaces(parsed.query, userLocation ?? undefined);
				} else if (parsed.type === "destination" && parsed.query) {
					setActiveField("destination");
					searchPlaces(parsed.query, userLocation ?? undefined);
				} else if (parsed.type === "complete") {
					// Auto-geocode origin first
					if (parsed.originQuery && !origin) {
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
							if (data.features?.[0]) {
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
					setActiveField("destination");
					if (parsed.destinationQuery) {
						searchPlaces(parsed.destinationQuery, userLocation ?? undefined);
					}
				} else if (text.trim().length < 2) {
					setSuggestions([]);
					setActiveField(null);
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
				setInputValue(`de ${location.name} a `);
				setActiveField("destination");
			} else {
				onRouteChange(origin, location);
				setInputValue("");
				setSuggestions([]);
				setIsExpanded(false);
				expandProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
				Keyboard.dismiss();
			}
		},
		[activeField, origin, destination, onRouteChange, expandProgress],
	);

	// Handle submit (chat message)
	const handleSubmit = useCallback(() => {
		const trimmed = inputValue.trim();
		if (!trimmed || disabled || isLoading) return;

		// If we have a route context, send to chat
		if (origin && destination) {
			onChatSubmit(trimmed);
			setInputValue("");
			return;
		}

		// If it looks like a chat message
		if (
			activeField === "chat" ||
			/^(como|que|cual|donde|cuando|por que|cuanto|hay|\?)/i.test(trimmed)
		) {
			onChatSubmit(trimmed);
			setInputValue("");
			return;
		}

		// Otherwise try to interpret as destination
		if (trimmed.length > 2) {
			searchPlaces(trimmed, userLocation ?? undefined);
			setActiveField("destination");
		}
	}, [
		inputValue,
		disabled,
		isLoading,
		origin,
		destination,
		activeField,
		onChatSubmit,
		searchPlaces,
		userLocation,
	]);

	// Handle voice button - push-to-talk functionality
	const handleVoicePressIn = useCallback(() => {
		// Start recording after a short delay to confirm intent
		voicePressTimeoutRef.current = setTimeout(() => {
			voiceRecording.startRecording();
		}, 150);
	}, [voiceRecording]);

	const handleVoicePressOut = useCallback(() => {
		// Clear the timeout if released before delay
		if (voicePressTimeoutRef.current) {
			clearTimeout(voicePressTimeoutRef.current);
			voicePressTimeoutRef.current = null;
		}

		// Stop recording if we were recording
		if (voiceRecording.isRecording) {
			voiceRecording.stopRecording();
		}
	}, [voiceRecording]);

	const handleVoiceCancel = useCallback(() => {
		// Cancel if user drags away
		if (voicePressTimeoutRef.current) {
			clearTimeout(voicePressTimeoutRef.current);
			voicePressTimeoutRef.current = null;
		}

		if (voiceRecording.isRecording) {
			voiceRecording.cancelRecording();
		}
	}, [voiceRecording]);

	// Cleanup
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
			if (voicePressTimeoutRef.current) {
				clearTimeout(voicePressTimeoutRef.current);
			}
		};
	}, []);

	const hasRoute = origin && destination;
	const showSuggestions = suggestions.length > 0 && activeField !== "chat";
	const placeholder = hasRoute
		? "Preguntale a Driwet sobre tu ruta..."
		: "A donde vamos?";

	const isVoiceActive =
		voiceRecording.state !== "idle" && voiceRecording.state !== "done";

	return (
		<View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
			{/* Recording indicator - above input when recording */}
			{isVoiceActive && (
				<View style={styles.recordingContainer}>
					<RecordingIndicator
						state={voiceRecording.state}
						duration={voiceRecording.duration}
						compact={false}
					/>
				</View>
			)}

			{/* Suggestions dropdown - above input */}
			{showSuggestions && !isVoiceActive && (
				<Animated.View
					entering={FadeIn.duration(200)}
					exiting={FadeOut.duration(150)}
					style={[
						styles.suggestionsContainer,
						{ backgroundColor: colors.card },
					]}
				>
					{isSearching ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="small" color={colors.primary} />
						</View>
					) : (
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
											activeField === "origin" ? colors.primary : colors.safe
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
					)}
				</Animated.View>
			)}

			{/* Main input container */}
			<Animated.View
				style={[
					styles.container,
					{ backgroundColor: colors.card },
					containerAnimatedStyle,
				]}
			>
				<Animated.View style={[styles.inputWrapper, inputAnimatedStyle]}>
					<TextInput
						ref={inputRef}
						style={[
							styles.input,
							{ color: colors.foreground },
							isExpanded && styles.inputExpanded,
						]}
						placeholder={placeholder}
						placeholderTextColor={colors.mutedForeground}
						value={inputValue}
						onChangeText={handleTextChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
						onSubmitEditing={handleSubmit}
						returnKeyType="send"
						editable={!disabled}
						maxLength={500}
						multiline={isExpanded}
						textAlignVertical={isExpanded ? "top" : "center"}
					/>
				</Animated.View>

				{/* Action buttons */}
				<View style={styles.actionsContainer}>
					{/* Voice button - push-to-talk */}
					<Pressable
						onPressIn={handleVoicePressIn}
						onPressOut={handleVoicePressOut}
						onLongPress={() => {}} // Prevent default long press behavior
						delayLongPress={150}
						disabled={disabled || voiceRecording.isProcessing}
						style={({ pressed }) => [
							styles.actionButton,
							{
								backgroundColor: voiceRecording.isRecording
									? colors.danger
									: pressed
										? colors.primary
										: colors.muted,
								transform: [
									{ scale: pressed || voiceRecording.isRecording ? 1.1 : 1 },
								],
							},
						]}
					>
						<Icon
							name="voice"
							size={20}
							color={
								voiceRecording.isRecording ? "#FFFFFF" : colors.mutedForeground
							}
						/>
					</Pressable>

					{/* Send button */}
					<TouchableOpacity
						onPress={handleSubmit}
						disabled={!inputValue.trim() || disabled || isLoading}
						style={[
							styles.actionButton,
							{
								backgroundColor:
									inputValue.trim() && !disabled && !isLoading
										? colors.primary
										: colors.muted,
							},
						]}
					>
						{isLoading ? (
							<ActivityIndicator
								size="small"
								color={colors.primaryForeground}
							/>
						) : (
							<Icon
								name="send"
								size={18}
								color={
									inputValue.trim() && !disabled
										? colors.primaryForeground
										: colors.mutedForeground
								}
							/>
						)}
					</TouchableOpacity>
				</View>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		paddingHorizontal: 16,
	},
	recordingContainer: {
		marginBottom: 12,
	},
	container: {
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 8,
	},
	inputWrapper: {
		flex: 1,
	},
	input: {
		fontFamily: "Inter_400Regular",
		fontSize: 16,
		paddingVertical: 12,
		paddingRight: 80,
	},
	inputExpanded: {
		paddingTop: 12,
		paddingBottom: 50,
	},
	actionsContainer: {
		position: "absolute",
		right: 8,
		bottom: 8,
		flexDirection: "row",
		gap: 8,
	},
	actionButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	suggestionsContainer: {
		marginBottom: 8,
		borderRadius: 16,
		overflow: "hidden",
		maxHeight: 200,
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
});
