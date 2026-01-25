import { i18n, type SupportedLanguage } from "@driwet/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useUpdateSettings } from "@/hooks/use-api";
import { authClient } from "@/lib/auth-client";

type LanguageContextType = {
	language: SupportedLanguage;
	setLanguage: (lang: SupportedLanguage) => void;
	isLoading: boolean;
};

const LANGUAGE_KEY = "@driwet/language";
const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

export const LanguageProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [language, setLanguageState] = useState<SupportedLanguage>("es");
	const [isLoading, setIsLoading] = useState(true);

	// Get session for user preferences
	const { data: session } = authClient.useSession();
	const updateSettings = useUpdateSettings();

	// Cast user to include custom fields from Better Auth additionalFields
	type UserWithPreferences = {
		theme?: string;
		language?: string;
		notificationsEnabled?: boolean;
	};
	const user = session?.user
		? (session.user as typeof session.user & UserWithPreferences)
		: undefined;

	// Load language: prefer server preference, then local storage, finally device
	useEffect(() => {
		const loadLanguage = async () => {
			try {
				// If user is logged in and has a language preference, use it
				const userLang = user?.language as SupportedLanguage | undefined;
				if (userLang && (userLang === "en" || userLang === "es")) {
					setLanguageState(userLang);
					i18n.changeLanguage(userLang);
					await AsyncStorage.setItem(LANGUAGE_KEY, userLang);
				} else {
					// Try local storage
					const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
					if (savedLang && (savedLang === "en" || savedLang === "es")) {
						setLanguageState(savedLang as SupportedLanguage);
						i18n.changeLanguage(savedLang);
					} else {
						// Fallback to device locale
						const deviceLocale = Localization.getLocales()[0]?.languageCode;
						const detectedLang: SupportedLanguage =
							deviceLocale === "es" ? "es" : "en";
						setLanguageState(detectedLang);
						i18n.changeLanguage(detectedLang);
					}
				}
			} catch (error) {
				console.error("Failed to load language:", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadLanguage();
	}, [user?.language]);

	const setLanguage = useCallback(
		(lang: SupportedLanguage) => {
			setLanguageState(lang);
			i18n.changeLanguage(lang);
			// Save locally
			AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(console.error);
			// Sync to server if logged in
			if (session?.user) {
				updateSettings.mutate({ language: lang });
			}
		},
		[session?.user, updateSettings],
	);

	const value = useMemo(
		() => ({
			language,
			setLanguage,
			isLoading,
		}),
		[language, setLanguage, isLoading],
	);

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
};

// Default context for Suspense
const defaultLanguageContext: LanguageContextType = {
	language: "es",
	setLanguage: () => {},
	isLoading: false,
};

export function useLanguage() {
	const context = useContext(LanguageContext);
	return context ?? defaultLanguageContext;
}
