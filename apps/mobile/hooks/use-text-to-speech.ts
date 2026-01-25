// apps/mobile/hooks/use-text-to-speech.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";

export type TTSState = "idle" | "speaking" | "paused";

type UseTTSOptions = {
	language?: string;
	pitch?: number;
	rate?: number;
	volume?: number;
	defaultEnabled?: boolean;
};

type UseTTSReturn = {
	state: TTSState;
	isSpeaking: boolean;
	isEnabled: boolean;
	speak: (text: string) => Promise<void>;
	stop: () => Promise<void>;
	pause: () => Promise<void>;
	resume: () => Promise<void>;
	setEnabled: (enabled: boolean) => Promise<void>;
	setRate: (rate: number) => void;
	setVolume: (volume: number) => void;
	rate: number;
	volume: number;
};

const TTS_ENABLED_KEY = "@driwet/tts-enabled";
const TTS_RATE_KEY = "@driwet/tts-rate";
const TTS_VOLUME_KEY = "@driwet/tts-volume";

export function useTextToSpeech({
	language = "es-ES",
	pitch = 1.0,
	rate: defaultRate = 1.0,
	volume: defaultVolume = 1.0,
	defaultEnabled = true,
}: UseTTSOptions = {}): UseTTSReturn {
	const [state, setState] = useState<TTSState>("idle");
	const [isEnabled, setIsEnabledState] = useState(defaultEnabled);
	const [rate, setRateState] = useState(defaultRate);
	const [volume, setVolumeState] = useState(defaultVolume);
	const [isInitialized, setIsInitialized] = useState(false);

	const currentTextRef = useRef<string>("");

	// Load saved preferences
	useEffect(() => {
		const loadPreferences = async () => {
			try {
				const [enabledValue, rateValue, volumeValue] = await Promise.all([
					AsyncStorage.getItem(TTS_ENABLED_KEY),
					AsyncStorage.getItem(TTS_RATE_KEY),
					AsyncStorage.getItem(TTS_VOLUME_KEY),
				]);

				if (enabledValue !== null) {
					setIsEnabledState(enabledValue === "true");
				}
				if (rateValue !== null) {
					setRateState(Number.parseFloat(rateValue));
				}
				if (volumeValue !== null) {
					setVolumeState(Number.parseFloat(volumeValue));
				}
			} catch (error) {
				console.error("Error loading TTS preferences:", error);
			} finally {
				setIsInitialized(true);
			}
		};

		loadPreferences();
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			Speech.stop();
		};
	}, []);

	// Speak text
	const speak = useCallback(
		async (text: string) => {
			if (!isEnabled || !text.trim()) {
				return;
			}

			// Stop any current speech
			await Speech.stop();
			currentTextRef.current = text;

			return new Promise<void>((resolve) => {
				setState("speaking");

				Speech.speak(text, {
					language,
					pitch,
					rate,
					volume,
					onStart: () => {
						setState("speaking");
					},
					onDone: () => {
						setState("idle");
						currentTextRef.current = "";
						resolve();
					},
					onStopped: () => {
						setState("idle");
						currentTextRef.current = "";
						resolve();
					},
					onError: (error) => {
						console.error("TTS Error:", error);
						setState("idle");
						currentTextRef.current = "";
						resolve();
					},
				});
			});
		},
		[isEnabled, language, pitch, rate, volume],
	);

	// Stop speaking
	const stop = useCallback(async () => {
		await Speech.stop();
		setState("idle");
		currentTextRef.current = "";
	}, []);

	// Pause speaking (iOS only)
	const pause = useCallback(async () => {
		await Speech.pause();
		setState("paused");
	}, []);

	// Resume speaking (iOS only)
	const resume = useCallback(async () => {
		await Speech.resume();
		setState("speaking");
	}, []);

	// Toggle enabled state
	const setEnabled = useCallback(async (enabled: boolean) => {
		setIsEnabledState(enabled);
		await AsyncStorage.setItem(TTS_ENABLED_KEY, enabled.toString());

		if (!enabled) {
			await Speech.stop();
			setState("idle");
		}
	}, []);

	// Set speech rate
	const setRate = useCallback((newRate: number) => {
		const clampedRate = Math.max(0.5, Math.min(2.0, newRate));
		setRateState(clampedRate);
		AsyncStorage.setItem(TTS_RATE_KEY, clampedRate.toString()).catch(
			console.error,
		);
	}, []);

	// Set volume
	const setVolume = useCallback((newVolume: number) => {
		const clampedVolume = Math.max(0, Math.min(1, newVolume));
		setVolumeState(clampedVolume);
		AsyncStorage.setItem(TTS_VOLUME_KEY, clampedVolume.toString()).catch(
			console.error,
		);
	}, []);

	return {
		state,
		isSpeaking: state === "speaking",
		isEnabled,
		speak,
		stop,
		pause,
		resume,
		setEnabled,
		setRate,
		setVolume,
		rate,
		volume,
	};
}

// Helper to speak agent responses automatically
export function speakAgentResponse(
	tts: UseTTSReturn,
	response: string,
	options?: { skipIfShort?: boolean; minLength?: number },
): void {
	const { skipIfShort = false, minLength = 10 } = options ?? {};

	// Skip very short responses if option enabled
	if (skipIfShort && response.length < minLength) {
		return;
	}

	// Clean up response for speech (remove markdown, emojis, etc.)
	const cleanedText = cleanTextForSpeech(response);

	if (cleanedText) {
		tts.speak(cleanedText);
	}
}

// Clean text for speech synthesis
function cleanTextForSpeech(text: string): string {
	return (
		text
			// Remove markdown formatting
			.replace(/\*\*(.+?)\*\*/g, "$1") // bold
			.replace(/\*(.+?)\*/g, "$1") // italic
			.replace(/`(.+?)`/g, "$1") // inline code
			.replace(/```[\s\S]*?```/g, "") // code blocks
			.replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
			.replace(/^#+\s*/gm, "") // headers
			.replace(/^[-*]\s*/gm, "") // list items
			// Remove emojis (basic)
			.replace(/[\u{1F600}-\u{1F64F}]/gu, "") // emoticons
			.replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // symbols
			.replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // transport
			.replace(/[\u{2600}-\u{26FF}]/gu, "") // misc symbols
			.replace(/[\u{2700}-\u{27BF}]/gu, "") // dingbats
			// Clean up whitespace
			.replace(/\s+/g, " ")
			.trim()
	);
}

// ============================================
// Premium Voice Features
// ============================================

export type VoiceInfo = {
	identifier: string;
	name: string;
	language: string;
	quality: "Default" | "Enhanced";
};

const TTS_VOICE_KEY = "@driwet/tts-voice";

/**
 * Hook for premium voice features including voice selection
 */
export function usePremiumVoice() {
	const tts = useTextToSpeech({ language: "en-US" });
	const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([]);
	const [selectedVoice, setSelectedVoiceState] = useState<string | undefined>();
	const [isLoadingVoices, setIsLoadingVoices] = useState(true);

	// Load available voices
	useEffect(() => {
		async function loadVoices() {
			try {
				const voices = await Speech.getAvailableVoicesAsync();
				const mappedVoices: VoiceInfo[] = voices.map((v) => ({
					identifier: v.identifier,
					name: v.name,
					language: v.language,
					quality:
						v.quality === Speech.VoiceQuality.Enhanced ? "Enhanced" : "Default",
				}));

				// Sort: Enhanced first, then by language
				mappedVoices.sort((a, b) => {
					if (a.quality !== b.quality) {
						return a.quality === "Enhanced" ? -1 : 1;
					}
					return a.language.localeCompare(b.language);
				});

				setAvailableVoices(mappedVoices);

				// Load saved voice preference
				const savedVoice = await AsyncStorage.getItem(TTS_VOICE_KEY);
				if (
					savedVoice &&
					mappedVoices.some((v) => v.identifier === savedVoice)
				) {
					setSelectedVoiceState(savedVoice);
				} else {
					// Auto-select best English enhanced voice
					const bestVoice =
						mappedVoices.find(
							(v) => v.language.startsWith("en") && v.quality === "Enhanced",
						) || mappedVoices.find((v) => v.language.startsWith("en"));

					if (bestVoice) {
						setSelectedVoiceState(bestVoice.identifier);
					}
				}
			} catch (error) {
				console.warn("Failed to load TTS voices:", error);
			} finally {
				setIsLoadingVoices(false);
			}
		}

		loadVoices();
	}, []);

	// Set selected voice and persist
	const setSelectedVoice = useCallback(async (voiceId: string) => {
		setSelectedVoiceState(voiceId);
		await AsyncStorage.setItem(TTS_VOICE_KEY, voiceId);
	}, []);

	// Get voices for a specific language
	const getVoicesForLanguage = useCallback(
		(languageCode: string) => {
			return availableVoices.filter((v) =>
				v.language.toLowerCase().startsWith(languageCode.toLowerCase()),
			);
		},
		[availableVoices],
	);

	// Speak with selected premium voice
	const speakPremium = useCallback(
		async (text: string) => {
			if (!tts.isEnabled || !text.trim()) return;

			await Speech.stop();

			return new Promise<void>((resolve) => {
				Speech.speak(cleanTextForSpeech(text), {
					language: "en-US",
					pitch: 1.0,
					rate: tts.rate,
					volume: tts.volume,
					voice: selectedVoice,
					onDone: () => resolve(),
					onStopped: () => resolve(),
					onError: () => resolve(),
				});
			});
		},
		[tts.isEnabled, tts.rate, tts.volume, selectedVoice],
	);

	return {
		...tts,
		availableVoices,
		selectedVoice,
		setSelectedVoice,
		getVoicesForLanguage,
		isLoadingVoices,
		speakPremium,
	};
}

/**
 * Hook specifically for AI assistant voice interactions
 */
export function useAIVoice() {
	const voice = usePremiumVoice();

	// Speak AI response with natural pacing
	const speakResponse = useCallback(
		async (text: string) => {
			const cleanedText = cleanTextForSpeech(text);
			if (cleanedText) {
				await voice.speakPremium(cleanedText);
			}
		},
		[voice],
	);

	// Speak driving alert with urgency
	const speakAlert = useCallback(
		async (title: string, subtitle?: string) => {
			const message = subtitle ? `${title}. ${subtitle}` : title;

			if (!voice.isEnabled) return;
			await Speech.stop();

			Speech.speak(message, {
				language: "en-US",
				pitch: 1.05, // Slightly higher pitch for urgency
				rate: 1.0,
				volume: voice.volume,
				voice: voice.selectedVoice,
			});
		},
		[voice.isEnabled, voice.volume, voice.selectedVoice],
	);

	// Speak navigation instruction clearly
	const speakNavigation = useCallback(
		async (instruction: string) => {
			if (!voice.isEnabled) return;
			await Speech.stop();

			Speech.speak(instruction, {
				language: "en-US",
				pitch: 1.0,
				rate: 0.95, // Slightly slower for clarity
				volume: voice.volume,
				voice: voice.selectedVoice,
			});
		},
		[voice.isEnabled, voice.volume, voice.selectedVoice],
	);

	// Speak weather warning
	const speakWeatherWarning = useCallback(
		async (
			condition: string,
			severity: "low" | "moderate" | "high" | "extreme",
		) => {
			if (!voice.isEnabled) return;
			await Speech.stop();

			const urgencyRate =
				severity === "extreme" ? 1.1 : severity === "high" ? 1.05 : 1.0;
			const urgencyPitch =
				severity === "extreme" ? 1.1 : severity === "high" ? 1.05 : 1.0;

			Speech.speak(condition, {
				language: "en-US",
				pitch: urgencyPitch,
				rate: urgencyRate,
				volume: voice.volume,
				voice: voice.selectedVoice,
			});
		},
		[voice.isEnabled, voice.volume, voice.selectedVoice],
	);

	return {
		...voice,
		speakResponse,
		speakAlert,
		speakNavigation,
		speakWeatherWarning,
	};
}
