// apps/native/lib/i18n.ts
import { getI18n, i18n, initI18n, type SupportedLanguage } from "@driwet/i18n";
import * as Localization from "expo-localization";
import { I18nextProvider } from "react-i18next";

export function setupI18n() {
	const deviceLocale = Localization.getLocales()[0]?.languageCode;
	const lng: SupportedLanguage = deviceLocale === "es" ? "es" : "en";
	return initI18n(lng);
}

export function getI18nInstance() {
	return i18n;
}

export { I18nextProvider };
export { useTranslation } from "react-i18next";
