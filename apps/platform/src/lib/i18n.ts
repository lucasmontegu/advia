// apps/platform/src/lib/i18n.ts
"use client";
import { i18n, initI18n, type SupportedLanguage } from "@driwet/i18n";
import { I18nextProvider, useTranslation } from "react-i18next";

export function setupI18n() {
	const browserLang =
		typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en";
	const lng: SupportedLanguage = browserLang === "es" ? "es" : "en";
	return initI18n(lng);
}

export function getI18nInstance() {
	return i18n;
}

export { I18nextProvider, useTranslation };
