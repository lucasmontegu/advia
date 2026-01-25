// apps/mobile/lib/navigation-launcher.ts
import { router } from "expo-router";
import { Alert, Linking, Platform } from "react-native";

export type NavigationDestination = {
	latitude: number;
	longitude: number;
	name?: string;
};

export type NavigationOrigin = {
	latitude: number;
	longitude: number;
	name?: string;
};

export type NavigationOptions = {
	/** Use built-in navigation instead of external app */
	useBuiltIn?: boolean;
	/** Simulate route for testing */
	simulate?: boolean;
	/** Preferred external app */
	preferredApp?: "waze" | "google" | "apple";
};

/**
 * Launch navigation to a destination
 * Can use built-in Mapbox navigation or external apps
 */
export async function launchNavigation(
	destination: NavigationDestination,
	origin?: NavigationOrigin,
	options: NavigationOptions = {},
): Promise<void> {
	const { useBuiltIn = true, simulate = false, preferredApp } = options;

	// Use built-in navigation if available and requested
	if (useBuiltIn && origin) {
		router.push({
			pathname: "/(app)/navigation",
			params: {
				originLat: origin.latitude.toString(),
				originLng: origin.longitude.toString(),
				destLat: destination.latitude.toString(),
				destLng: destination.longitude.toString(),
				originName: origin.name || "Ubicación actual",
				destName: destination.name || "Destino",
				simulate: simulate ? "true" : "false",
			},
		});
		return;
	}

	// Fall back to external navigation apps
	if (preferredApp) {
		const launched = await tryLaunchExternalApp(
			preferredApp,
			destination,
			origin,
		);
		if (launched) return;
	}

	// Show app selection dialog
	showNavigationAppPicker(destination, origin);
}

/**
 * Show picker to select navigation app
 */
function showNavigationAppPicker(
	destination: NavigationDestination,
	origin?: NavigationOrigin,
): void {
	const apps: Array<{ name: string; key: "waze" | "google" | "apple" }> = [
		{ name: "Waze", key: "waze" },
		{ name: "Google Maps", key: "google" },
	];

	if (Platform.OS === "ios") {
		apps.push({ name: "Apple Maps", key: "apple" });
	}

	Alert.alert("Elegir app de navegación", "¿Con qué app querés navegar?", [
		...apps.map((app) => ({
			text: app.name,
			onPress: () => tryLaunchExternalApp(app.key, destination, origin),
		})),
		{
			text: "Cancelar",
			style: "cancel" as const,
		},
	]);
}

/**
 * Try to launch a specific external navigation app
 */
async function tryLaunchExternalApp(
	app: "waze" | "google" | "apple",
	destination: NavigationDestination,
	origin?: NavigationOrigin,
): Promise<boolean> {
	const { latitude, longitude, name } = destination;

	let url: string;

	switch (app) {
		case "waze":
			url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
			if (name) {
				url += `&q=${encodeURIComponent(name)}`;
			}
			break;

		case "google":
			url = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
			if (origin) {
				url += `&saddr=${origin.latitude},${origin.longitude}`;
			}
			break;

		case "apple":
			url = `maps://?daddr=${latitude},${longitude}&dirflg=d`;
			if (name) {
				url += `&q=${encodeURIComponent(name)}`;
			}
			break;

		default:
			return false;
	}

	try {
		const canOpen = await Linking.canOpenURL(url);
		if (canOpen) {
			await Linking.openURL(url);
			return true;
		}

		// Fallback to web URLs
		return tryWebFallback(app, destination, origin);
	} catch (error) {
		console.error(`Failed to open ${app}:`, error);
		return tryWebFallback(app, destination, origin);
	}
}

/**
 * Try web-based fallback URLs
 */
async function tryWebFallback(
	app: "waze" | "google" | "apple",
	destination: NavigationDestination,
	origin?: NavigationOrigin,
): Promise<boolean> {
	const { latitude, longitude, name } = destination;

	let url: string;

	switch (app) {
		case "waze":
			url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
			break;

		case "google":
			url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
			if (origin) {
				url += `&origin=${origin.latitude},${origin.longitude}`;
			}
			break;

		case "apple":
			url = `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
			if (name) {
				url += `&q=${encodeURIComponent(name)}`;
			}
			break;

		default:
			return false;
	}

	try {
		await Linking.openURL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if built-in navigation is available
 */
export function isBuiltInNavigationAvailable(): boolean {
	// Built-in navigation requires the Mapbox Navigation SDK
	// which is installed via @pawan-pk/react-native-mapbox-navigation
	return true;
}

/**
 * Check which external navigation apps are installed
 */
export async function getInstalledNavigationApps(): Promise<
	Array<"waze" | "google" | "apple">
> {
	const apps: Array<"waze" | "google" | "apple"> = [];

	try {
		if (await Linking.canOpenURL("waze://")) {
			apps.push("waze");
		}
	} catch {}

	try {
		if (await Linking.canOpenURL("comgooglemaps://")) {
			apps.push("google");
		}
	} catch {}

	if (Platform.OS === "ios") {
		try {
			if (await Linking.canOpenURL("maps://")) {
				apps.push("apple");
			}
		} catch {}
	}

	return apps;
}
