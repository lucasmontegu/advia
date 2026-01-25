// apps/mobile/components/onboarding/onboarding-screen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useRef, useState } from "react";
import {
	Dimensions,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type ViewToken,
} from "react-native";
import Animated, {
	FadeIn,
	FadeInUp,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { OnboardingSlide, type OnboardingSlideData } from "./onboarding-slide";

const { width } = Dimensions.get("window");
const ONBOARDING_COMPLETE_KEY = "@driwet/onboarding-complete";

// Onboarding slides data
const SLIDES: OnboardingSlideData[] = [
	{
		id: "welcome",
		icon: "storm",
		iconColor: undefined, // Uses primary
		title: "Hola, soy Driwet",
		subtitle: "Tu copiloto de viaje",
		description:
			"Soy tu asistente inteligente que te ayuda a planificar viajes seguros. Pregúntame cualquier cosa sobre tu ruta.",
	},
	{
		id: "weather",
		icon: "alert",
		iconColor: "#F97316", // warning orange
		title: "Te aviso antes del peligro",
		subtitle: "Protección climática en tiempo real",
		description:
			"Analizo el clima en toda tu ruta y te aviso si hay tormentas, niebla o condiciones peligrosas. Tu seguridad es mi prioridad.",
	},
	{
		id: "voice",
		icon: "voice",
		iconColor: "#10B981", // safe green
		title: "Hablamos mientras conduces",
		subtitle: "Manos libres, siempre seguro",
		description:
			"Usa tu voz para preguntarme sobre el clima, paradas seguras o cambiar tu ruta. Yo te respondo en voz alta.",
	},
];

type OnboardingScreenProps = {
	onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const [currentIndex, setCurrentIndex] = useState(0);
	const flatListRef = useRef<FlatList>(null);

	const handleViewableItemsChanged = useCallback(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			if (viewableItems.length > 0 && viewableItems[0].index !== null) {
				setCurrentIndex(viewableItems[0].index);
			}
		},
		[],
	);

	const viewabilityConfig = useRef({
		viewAreaCoveragePercentThreshold: 50,
	}).current;

	const handleNext = useCallback(() => {
		if (currentIndex < SLIDES.length - 1) {
			flatListRef.current?.scrollToIndex({
				index: currentIndex + 1,
				animated: true,
			});
		}
	}, [currentIndex]);

	const handleSkip = useCallback(async () => {
		await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
		onComplete();
	}, [onComplete]);

	const handleGetStarted = useCallback(async () => {
		await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
		onComplete();
	}, [onComplete]);

	const isLastSlide = currentIndex === SLIDES.length - 1;

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Slides */}
			<FlatList
				ref={flatListRef}
				data={SLIDES}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				bounces={false}
				onViewableItemsChanged={handleViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
				keyExtractor={(item) => item.id}
				renderItem={({ item, index }) => (
					<OnboardingSlide slide={item} isActive={index === currentIndex} />
				)}
				getItemLayout={(_, index) => ({
					length: width,
					offset: width * index,
					index,
				})}
			/>

			{/* Bottom section */}
			<Animated.View
				entering={FadeInUp.delay(600).duration(400)}
				style={[
					styles.bottomSection,
					{
						paddingBottom: insets.bottom + 24,
						backgroundColor: colors.background,
					},
				]}
			>
				{/* Pagination dots */}
				<View style={styles.pagination}>
					{SLIDES.map((_, index) => (
						<PaginationDot
							key={index}
							isActive={index === currentIndex}
							colors={colors}
						/>
					))}
				</View>

				{/* Buttons */}
				<View style={styles.buttonsContainer}>
					{!isLastSlide ? (
						<>
							<TouchableOpacity
								onPress={handleSkip}
								style={styles.skipButton}
								activeOpacity={0.7}
							>
								<Text
									style={[
										styles.skipButtonText,
										{ color: colors.mutedForeground },
									]}
								>
									Saltar
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleNext}
								style={[styles.nextButton, { backgroundColor: colors.primary }]}
								activeOpacity={0.8}
							>
								<Text
									style={[
										styles.nextButtonText,
										{ color: colors.primaryForeground },
									]}
								>
									Siguiente
								</Text>
							</TouchableOpacity>
						</>
					) : (
						<TouchableOpacity
							onPress={handleGetStarted}
							style={[
								styles.getStartedButton,
								{ backgroundColor: colors.primary },
							]}
							activeOpacity={0.8}
						>
							<Text
								style={[
									styles.getStartedButtonText,
									{ color: colors.primaryForeground },
								]}
							>
								Comenzar
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</Animated.View>
		</View>
	);
}

// Pagination dot component
function PaginationDot({
	isActive,
	colors,
}: {
	isActive: boolean;
	colors: ReturnType<typeof useThemeColors>;
}) {
	const animatedStyle = useAnimatedStyle(() => ({
		width: withTiming(isActive ? 24 : 8, { duration: 200 }),
		backgroundColor: withTiming(isActive ? colors.primary : colors.muted, {
			duration: 200,
		}),
	}));

	return <Animated.View style={[styles.dot, animatedStyle]} />;
}

// Helper to check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
	try {
		const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
		return value === "true";
	} catch {
		return false;
	}
}

// Helper to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
	await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	bottomSection: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 24,
		paddingTop: 16,
	},
	pagination: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
		marginBottom: 24,
	},
	dot: {
		height: 8,
		borderRadius: 4,
	},
	buttonsContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	skipButton: {
		paddingVertical: 16,
		paddingHorizontal: 24,
	},
	skipButtonText: {
		fontFamily: "Inter_500Medium",
		fontSize: 16,
	},
	nextButton: {
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
	},
	nextButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
	},
	getStartedButton: {
		flex: 1,
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	getStartedButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 18,
	},
});
