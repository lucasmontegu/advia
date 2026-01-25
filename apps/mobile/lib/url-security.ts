// apps/mobile/lib/url-security.ts
// Security utilities for URL construction and validation

import { Linking } from "react-native";

/**
 * Validates that a value is a valid latitude (-90 to 90)
 */
export function isValidLatitude(value: unknown): value is number {
	if (typeof value !== "number" || isNaN(value)) return false;
	return value >= -90 && value <= 90;
}

/**
 * Validates that a value is a valid longitude (-180 to 180)
 */
export function isValidLongitude(value: unknown): value is number {
	if (typeof value !== "number" || isNaN(value)) return false;
	return value >= -180 && value <= 180;
}

/**
 * Validates and returns sanitized coordinates or null if invalid
 */
export function sanitizeCoordinates(
	lat: unknown,
	lng: unknown,
): { latitude: number; longitude: number } | null {
	if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
		return null;
	}
	return { latitude: lat, longitude: lng };
}

/**
 * Validates an ID string contains only safe characters (alphanumeric, dash, underscore)
 */
export function isValidId(value: unknown): value is string {
	if (typeof value !== "string") return false;
	return (
		/^[a-zA-Z0-9_-]+$/.test(value) && value.length > 0 && value.length <= 128
	);
}

/**
 * Sanitizes an ID string, returning null if invalid
 */
export function sanitizeId(value: unknown): string | null {
	if (!isValidId(value)) return null;
	return value;
}

/**
 * Allowed URL protocols for external navigation
 */
const ALLOWED_PROTOCOLS = [
	"http:",
	"https:",
	"maps:",
	"comgooglemaps:",
	"waze:",
	"google.navigation:",
	"app-settings:",
];

/**
 * Validates a URL has an allowed protocol
 */
export function isAllowedURL(url: string): boolean {
	try {
		// Handle special Android schemes that don't have ://
		if (
			url.startsWith("google.navigation:") ||
			url.startsWith("app-settings:")
		) {
			return true;
		}
		const parsed = new URL(url);
		return ALLOWED_PROTOCOLS.includes(parsed.protocol);
	} catch {
		return false;
	}
}

/**
 * Safely opens a URL after validating the protocol
 * Returns false if URL was blocked
 */
export async function safeOpenURL(url: string): Promise<boolean> {
	if (!isAllowedURL(url)) {
		console.warn("[Security] Blocked URL with disallowed protocol:", url);
		return false;
	}

	try {
		const canOpen = await Linking.canOpenURL(url);
		if (canOpen) {
			await Linking.openURL(url);
			return true;
		}
		return false;
	} catch (error) {
		console.error("[Security] Error opening URL:", error);
		return false;
	}
}

/**
 * Builds a navigation URL with validated coordinates
 */
export function buildNavigationURL(
	app: "waze" | "google" | "apple",
	lat: unknown,
	lng: unknown,
): string | null {
	const coords = sanitizeCoordinates(lat, lng);
	if (!coords) {
		console.warn("[Security] Invalid coordinates for navigation URL");
		return null;
	}

	const { latitude, longitude } = coords;

	switch (app) {
		case "waze":
			return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes&z=10`;
		case "google":
			return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
		case "apple":
			return `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
		default:
			return null;
	}
}
