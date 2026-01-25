// apps/mobile/components/onboarding/onboarding-slide.tsx
import {
	Dimensions,
	Image,
	type ImageSourcePropType,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated, {
	FadeIn,
	FadeInDown,
	FadeInUp,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

const { width, height } = Dimensions.get("window");

export type OnboardingSlideData = {
	id: string;
	icon: IconName;
	iconColor?: string;
	title: string;
	subtitle: string;
	description: string;
	image?: ImageSourcePropType;
};

type OnboardingSlideProps = {
	slide: OnboardingSlideData;
	isActive: boolean;
};

export function OnboardingSlide({ slide, isActive }: OnboardingSlideProps) {
	const colors = useThemeColors();

	if (!isActive) return null;

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Icon */}
			<Animated.View
				entering={FadeInUp.delay(100).duration(400)}
				style={[
					styles.iconContainer,
					{ backgroundColor: (slide.iconColor || colors.primary) + "15" },
				]}
			>
				<Icon
					name={slide.icon}
					size={48}
					color={slide.iconColor || colors.primary}
				/>
			</Animated.View>

			{/* Title */}
			<Animated.Text
				entering={FadeInDown.delay(200).duration(400)}
				style={[styles.title, { color: colors.foreground }]}
			>
				{slide.title}
			</Animated.Text>

			{/* Subtitle */}
			<Animated.Text
				entering={FadeInDown.delay(300).duration(400)}
				style={[styles.subtitle, { color: colors.primary }]}
			>
				{slide.subtitle}
			</Animated.Text>

			{/* Description */}
			<Animated.Text
				entering={FadeIn.delay(400).duration(400)}
				style={[styles.description, { color: colors.mutedForeground }]}
			>
				{slide.description}
			</Animated.Text>

			{/* Optional illustration */}
			{slide.image && (
				<Animated.View
					entering={FadeIn.delay(500).duration(400)}
					style={styles.imageContainer}
				>
					<Image
						source={slide.image}
						style={styles.image}
						resizeMode="contain"
					/>
				</Animated.View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingBottom: 120, // Space for buttons
	},
	iconContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 32,
	},
	title: {
		fontFamily: "Inter_700Bold",
		fontSize: 28,
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 18,
		textAlign: "center",
		marginBottom: 16,
	},
	description: {
		fontFamily: "Inter_400Regular",
		fontSize: 16,
		textAlign: "center",
		lineHeight: 24,
		paddingHorizontal: 16,
	},
	imageContainer: {
		marginTop: 40,
		width: width * 0.8,
		height: height * 0.25,
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
