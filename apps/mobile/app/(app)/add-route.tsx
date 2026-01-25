// apps/mobile/app/(app)/add-route.tsx

import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Keyboard,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useCreateRoute } from "@/hooks/use-api";
import { useLocation } from "@/hooks/use-location";
import { type PlaceResult, usePlaceSearch } from "@/hooks/use-place-search";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Analytics } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

type Place = {
	name: string;
	latitude: number;
	longitude: number;
};

export default function AddRouteScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const { t } = useTranslation();
	const { location } = useLocation();
	const createRoute = useCreateRoute();

	const [routeName, setRouteName] = useState("");
	const [origin, setOrigin] = useState<Place | null>(null);
	const [destination, setDestination] = useState<Place | null>(null);
	const [originSearch, setOriginSearch] = useState("");
	const [destinationSearch, setDestinationSearch] = useState("");
	const [activeField, setActiveField] = useState<
		"origin" | "destination" | null
	>(null);

	// Place search hooks
	const originPlaceSearch = usePlaceSearch({ userLocation: location });
	const destinationPlaceSearch = usePlaceSearch({ userLocation: location });

	const handleUseCurrentLocation = useCallback(() => {
		if (location) {
			setOrigin({
				name: t("routes.useCurrentLocation"),
				latitude: location.latitude,
				longitude: location.longitude,
			});
			setOriginSearch(t("routes.useCurrentLocation"));
			originPlaceSearch.clear();
			setActiveField(null);
		}
	}, [location, t, originPlaceSearch]);

	const handleOriginSearchChange = useCallback(
		(text: string) => {
			setOriginSearch(text);
			if (!text) {
				setOrigin(null);
				originPlaceSearch.clear();
			} else {
				originPlaceSearch.search(text);
			}
			setActiveField("origin");
		},
		[originPlaceSearch],
	);

	const handleDestinationSearchChange = useCallback(
		(text: string) => {
			setDestinationSearch(text);
			if (!text) {
				setDestination(null);
				destinationPlaceSearch.clear();
			} else {
				destinationPlaceSearch.search(text);
			}
			setActiveField("destination");
		},
		[destinationPlaceSearch],
	);

	const handleSelectOrigin = useCallback(
		(place: PlaceResult) => {
			setOrigin({
				name: place.name,
				latitude: place.latitude,
				longitude: place.longitude,
			});
			setOriginSearch(place.fullAddress);
			originPlaceSearch.clear();
			setActiveField(null);
			Keyboard.dismiss();
		},
		[originPlaceSearch],
	);

	const handleSelectDestination = useCallback(
		(place: PlaceResult) => {
			setDestination({
				name: place.name,
				latitude: place.latitude,
				longitude: place.longitude,
			});
			setDestinationSearch(place.fullAddress);
			destinationPlaceSearch.clear();
			setActiveField(null);
			Keyboard.dismiss();
		},
		[destinationPlaceSearch],
	);

	const handleSave = async () => {
		if (!routeName.trim()) {
			Alert.alert(t("common.error"), t("routes.routeNamePlaceholder"));
			return;
		}
		if (!origin) {
			Alert.alert(t("common.error"), t("routes.originPlaceholder"));
			return;
		}
		if (!destination) {
			Alert.alert(t("common.error"), t("routes.destinationPlaceholder"));
			return;
		}

		try {
			await createRoute.mutateAsync({
				name: routeName.trim(),
				originName: origin.name,
				originLatitude: origin.latitude,
				originLongitude: origin.longitude,
				destinationName: destination.name,
				destinationLatitude: destination.latitude,
				destinationLongitude: destination.longitude,
			});
			Analytics.routeCreated(false); // Weather alerts checked after creation
			router.back();
		} catch {
			Alert.alert(t("common.error"), t("common.retry"));
		}
	};

	const canSave =
		routeName.trim() && origin && destination && !createRoute.isPending;

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
					{t("routes.createRoute")}
				</Text>
				<Pressable onPress={handleSave} disabled={!canSave}>
					{createRoute.isPending ? (
						<ActivityIndicator size="small" color={colors.primary} />
					) : (
						<Text
							style={{
								fontFamily: "NunitoSans_600SemiBold",
								fontSize: 16,
								color: canSave ? colors.primary : colors.mutedForeground,
							}}
						>
							{t("common.save")}
						</Text>
					)}
				</Pressable>
			</View>

			<ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
				{/* Route name input */}
				<View style={{ marginBottom: 24 }}>
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 14,
							color: colors.foreground,
							marginBottom: 8,
						}}
					>
						{t("routes.routeName")}
					</Text>
					<TextInput
						value={routeName}
						onChangeText={setRouteName}
						placeholder={t("routes.routeNamePlaceholder")}
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

				{/* Origin input */}
				<View style={{ marginBottom: 24, zIndex: 20 }}>
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 14,
							color: colors.foreground,
							marginBottom: 8,
						}}
					>
						{t("routes.origin")}
					</Text>
					<View
						style={{
							backgroundColor: colors.card,
							borderWidth: 1,
							borderColor: origin ? colors.primary : colors.border,
							borderRadius: 8,
							padding: 12,
						}}
					>
						<TextInput
							value={originSearch}
							onChangeText={handleOriginSearchChange}
							onFocus={() => setActiveField("origin")}
							placeholder={t("routes.originPlaceholder")}
							placeholderTextColor={colors.mutedForeground}
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 16,
								color: colors.foreground,
							}}
						/>
					</View>
					{/* Origin suggestions dropdown */}
					{activeField === "origin" && originPlaceSearch.results.length > 0 && (
						<View
							style={{
								position: "absolute",
								top: "100%",
								left: 0,
								right: 0,
								backgroundColor: colors.card,
								borderWidth: 1,
								borderColor: colors.border,
								borderRadius: 8,
								marginTop: 4,
								maxHeight: 200,
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.1,
								shadowRadius: 4,
								elevation: 3,
							}}
						>
							<FlatList
								data={originPlaceSearch.results}
								keyExtractor={(item) => item.id}
								keyboardShouldPersistTaps="handled"
								renderItem={({ item }) => (
									<Pressable
										onPress={() => handleSelectOrigin(item)}
										style={{
											padding: 12,
											borderBottomWidth: 1,
											borderBottomColor: colors.border,
										}}
									>
										<Text
											style={{
												fontFamily: "NunitoSans_600SemiBold",
												fontSize: 14,
												color: colors.foreground,
											}}
											numberOfLines={1}
										>
											{item.name}
										</Text>
										<Text
											style={{
												fontFamily: "NunitoSans_400Regular",
												fontSize: 12,
												color: colors.mutedForeground,
												marginTop: 2,
											}}
											numberOfLines={1}
										>
											{item.fullAddress}
										</Text>
									</Pressable>
								)}
							/>
						</View>
					)}
					{activeField === "origin" && originPlaceSearch.isLoading && (
						<View style={{ marginTop: 8, alignItems: "center" }}>
							<ActivityIndicator size="small" color={colors.primary} />
						</View>
					)}
					{/* Use current location button */}
					<Pressable
						onPress={handleUseCurrentLocation}
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginTop: 8,
							padding: 8,
						}}
					>
						<Icon name="location" size={18} color={colors.primary} />
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 14,
								color: colors.primary,
								marginLeft: 8,
							}}
						>
							{t("routes.useCurrentLocation")}
						</Text>
					</Pressable>
				</View>

				{/* Destination input */}
				<View style={{ marginBottom: 24, zIndex: 10 }}>
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 14,
							color: colors.foreground,
							marginBottom: 8,
						}}
					>
						{t("routes.destination")}
					</Text>
					<View
						style={{
							backgroundColor: colors.card,
							borderWidth: 1,
							borderColor: destination ? colors.primary : colors.border,
							borderRadius: 8,
							padding: 12,
						}}
					>
						<TextInput
							value={destinationSearch}
							onChangeText={handleDestinationSearchChange}
							onFocus={() => setActiveField("destination")}
							placeholder={t("routes.destinationPlaceholder")}
							placeholderTextColor={colors.mutedForeground}
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 16,
								color: colors.foreground,
							}}
						/>
					</View>
					{/* Destination suggestions dropdown */}
					{activeField === "destination" &&
						destinationPlaceSearch.results.length > 0 && (
							<View
								style={{
									position: "absolute",
									top: "100%",
									left: 0,
									right: 0,
									backgroundColor: colors.card,
									borderWidth: 1,
									borderColor: colors.border,
									borderRadius: 8,
									marginTop: 4,
									maxHeight: 200,
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.1,
									shadowRadius: 4,
									elevation: 3,
								}}
							>
								<FlatList
									data={destinationPlaceSearch.results}
									keyExtractor={(item) => item.id}
									keyboardShouldPersistTaps="handled"
									renderItem={({ item }) => (
										<Pressable
											onPress={() => handleSelectDestination(item)}
											style={{
												padding: 12,
												borderBottomWidth: 1,
												borderBottomColor: colors.border,
											}}
										>
											<Text
												style={{
													fontFamily: "NunitoSans_600SemiBold",
													fontSize: 14,
													color: colors.foreground,
												}}
												numberOfLines={1}
											>
												{item.name}
											</Text>
											<Text
												style={{
													fontFamily: "NunitoSans_400Regular",
													fontSize: 12,
													color: colors.mutedForeground,
													marginTop: 2,
												}}
												numberOfLines={1}
											>
												{item.fullAddress}
											</Text>
										</Pressable>
									)}
								/>
							</View>
						)}
					{activeField === "destination" &&
						destinationPlaceSearch.isLoading && (
							<View style={{ marginTop: 8, alignItems: "center" }}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						)}
				</View>

				{/* Tip card */}
				<View
					style={{
						backgroundColor: colors.muted,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: colors.border,
					}}
				>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 8,
						}}
					>
						<Icon name="info" size={20} color={colors.primary} />
						<Text
							style={{
								fontFamily: "NunitoSans_600SemiBold",
								fontSize: 14,
								color: colors.foreground,
								marginLeft: 8,
							}}
						>
							{t("routes.tip")}
						</Text>
					</View>
					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							fontSize: 13,
							color: colors.mutedForeground,
							lineHeight: 20,
						}}
					>
						{t("routes.tipDescription")}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
