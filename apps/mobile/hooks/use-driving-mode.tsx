// apps/mobile/hooks/use-driving-mode.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "./use-location";

export type DrivingModeState = "walking" | "driving" | "unknown";

type UseDrivingModeOptions = {
	/** Speed threshold in km/h to enter driving mode (default: 10) */
	enterThreshold?: number;
	/** Speed threshold in km/h to exit driving mode (default: 5) - lower to prevent flickering */
	exitThreshold?: number;
	/** Time in ms speed must be sustained before changing mode (default: 3000) */
	sustainedDuration?: number;
	/** Whether to auto-detect driving mode (default: true) */
	autoDetect?: boolean;
};

type UseDrivingModeReturn = {
	/** Current driving mode state */
	mode: DrivingModeState;
	/** Whether currently in driving mode */
	isDriving: boolean;
	/** Current speed in km/h */
	speedKmh: number | null;
	/** Whether auto-detection is enabled */
	autoDetect: boolean;
	/** UI scale factor (1.0 normal, 1.15 driving) */
	uiScale: number;
	/** Font size multiplier for driving mode */
	fontScale: number;
	/** Manually set driving mode (disables auto-detection) */
	setManualMode: (mode: DrivingModeState | null) => void;
	/** Toggle auto-detection */
	setAutoDetect: (enabled: boolean) => Promise<void>;
};

const DRIVING_MODE_AUTO_KEY = "@driwet/driving-mode-auto";

// Convert m/s to km/h
const msToKmh = (ms: number | null): number | null => {
	if (ms === null) return null;
	return ms * 3.6;
};

export function useDrivingMode({
	enterThreshold = 10,
	exitThreshold = 5,
	sustainedDuration = 3000,
	autoDetect: defaultAutoDetect = true,
}: UseDrivingModeOptions = {}): UseDrivingModeReturn {
	const { location } = useLocation();
	const [mode, setMode] = useState<DrivingModeState>("unknown");
	const [autoDetect, setAutoDetectState] = useState(defaultAutoDetect);
	const [manualMode, setManualModeState] = useState<DrivingModeState | null>(
		null,
	);

	// Track sustained speed for hysteresis
	const sustainedStartRef = useRef<number | null>(null);
	const sustainedModeRef = useRef<DrivingModeState>("unknown");

	const speedKmh = msToKmh(location?.speed ?? null);

	// Load auto-detect preference
	useEffect(() => {
		AsyncStorage.getItem(DRIVING_MODE_AUTO_KEY)
			.then((value) => {
				if (value !== null) {
					setAutoDetectState(value === "true");
				}
			})
			.catch(console.error);
	}, []);

	// Auto-detect driving mode with hysteresis
	useEffect(() => {
		if (!autoDetect || manualMode !== null) {
			return;
		}

		if (speedKmh === null) {
			setMode("unknown");
			sustainedStartRef.current = null;
			return;
		}

		// Determine target mode based on speed with hysteresis
		let targetMode: DrivingModeState;
		if (mode === "driving") {
			// Already driving - need to drop below exit threshold to change
			targetMode = speedKmh < exitThreshold ? "walking" : "driving";
		} else {
			// Not driving - need to exceed enter threshold to change
			targetMode = speedKmh > enterThreshold ? "driving" : "walking";
		}

		// If target mode changed, start tracking sustained duration
		if (targetMode !== sustainedModeRef.current) {
			sustainedStartRef.current = Date.now();
			sustainedModeRef.current = targetMode;
		}

		// Check if mode has been sustained long enough
		const sustainedStart = sustainedStartRef.current;
		if (sustainedStart && Date.now() - sustainedStart >= sustainedDuration) {
			if (mode !== targetMode) {
				setMode(targetMode);
			}
		}
	}, [
		speedKmh,
		mode,
		autoDetect,
		manualMode,
		enterThreshold,
		exitThreshold,
		sustainedDuration,
	]);

	// Use manual mode if set
	useEffect(() => {
		if (manualMode !== null) {
			setMode(manualMode);
		}
	}, [manualMode]);

	const setManualMode = useCallback((newMode: DrivingModeState | null) => {
		setManualModeState(newMode);
		if (newMode === null) {
			// Re-enable auto-detection
			sustainedStartRef.current = null;
		}
	}, []);

	const setAutoDetect = useCallback(async (enabled: boolean) => {
		setAutoDetectState(enabled);
		await AsyncStorage.setItem(DRIVING_MODE_AUTO_KEY, enabled.toString());
		if (enabled) {
			setManualModeState(null);
		}
	}, []);

	const isDriving = mode === "driving";

	// UI scaling factors for driving mode
	// Design doc: "15% más grandes en modo conducción"
	const uiScale = isDriving ? 1.15 : 1.0;
	const fontScale = isDriving ? 1.15 : 1.0;

	return {
		mode,
		isDriving,
		speedKmh,
		autoDetect,
		uiScale,
		fontScale,
		setManualMode,
		setAutoDetect,
	};
}

// Context for app-wide driving mode
import { createContext, type ReactNode, useContext } from "react";

type DrivingModeContextValue = UseDrivingModeReturn;

const DrivingModeContext = createContext<DrivingModeContextValue | null>(null);

export function DrivingModeProvider({ children }: { children: ReactNode }) {
	const drivingMode = useDrivingMode();

	return (
		<DrivingModeContext.Provider value={drivingMode}>
			{children}
		</DrivingModeContext.Provider>
	);
}

export function useDrivingModeContext(): DrivingModeContextValue {
	const context = useContext(DrivingModeContext);
	if (!context) {
		throw new Error(
			"useDrivingModeContext must be used within DrivingModeProvider",
		);
	}
	return context;
}
