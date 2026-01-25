// packages/i18n/src/index.ts
import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

export const resources = {
	en: { translation: en },
	es: { translation: es },
} as const;

export const defaultNS = "translation";
export const fallbackLng = "en";
export const supportedLngs = ["en", "es"] as const;

export type SupportedLanguage = (typeof supportedLngs)[number];

// Track initialization state
let isInitialized = false;

export function initI18n(lng: SupportedLanguage = "es") {
	// Prevent multiple initializations
	if (isInitialized) {
		i18n.changeLanguage(lng);
		return Promise.resolve();
	}

	isInitialized = true;

	// Use initImmediate to make it synchronous in the callback
	return i18n.use(initReactI18next).init({
		resources,
		lng,
		fallbackLng,
		defaultNS,
		interpolation: {
			escapeValue: false,
		},
		// This makes the initialization synchronous
		initImmediate: false,
	});
}

// Get the initialized i18n instance
export function getI18n() {
	return i18n;
}

export { i18n, I18nextProvider };
export { Trans, useTranslation } from "react-i18next";
