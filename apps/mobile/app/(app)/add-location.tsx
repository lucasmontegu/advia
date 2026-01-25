// apps/native/app/(app)/add-location.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

export default function AddLocationScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const { t } = useTranslation();
	const [locationName, setLocationName] = useState("");

	const handleSave = () => {
		// TODO: Implement save location logic
		router.back();
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			{/* Header */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 16,
					paddingVertical: 12,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				}}
			>
				<Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
					<Icon name="arrowLeft" size={24} color={colors.foreground} />
				</Pressable>
				<Text
					style={{
						fontFamily: "NunitoSans_700Bold",
						fontSize: 20,
						color: colors.foreground,
						flex: 1,
					}}
				>
					{t("locations.addNew")}
				</Text>
				<Pressable onPress={handleSave}>
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 16,
							color: colors.primary,
						}}
					>
						{t("common.save")}
					</Text>
				</Pressable>
			</View>

			<ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
				{/* Location name input */}
				<View style={{ marginBottom: 16 }}>
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 14,
							color: colors.foreground,
							marginBottom: 8,
						}}
					>
						{t("locations.name")}
					</Text>
					<TextInput
						value={locationName}
						onChangeText={setLocationName}
						placeholder={t("locations.namePlaceholder")}
						placeholderTextColor={colors.mutedForeground}
						style={{
							backgroundColor: colors.card,
							borderWidth: 1,
							borderColor: colors.border,
							borderRadius: 8,
							padding: 12,
							fontFamily: "NunitoSans_400Regular",
							fontSize: 16,
							color: colors.foreground,
						}}
					/>
				</View>

				{/* TODO: Add map picker or location search */}
				<View
					style={{
						backgroundColor: colors.card,
						borderRadius: 12,
						padding: 24,
						alignItems: "center",
						borderWidth: 1,
						borderColor: colors.border,
					}}
				>
					<Icon name="location" size={48} color={colors.mutedForeground} />
					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							fontSize: 14,
							color: colors.mutedForeground,
							marginTop: 12,
							textAlign: "center",
						}}
					>
						{t("locations.selectOnMap")}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
