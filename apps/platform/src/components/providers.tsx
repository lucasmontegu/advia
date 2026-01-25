"use client";

import { setupI18n } from "@/lib/i18n";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

// Initialize i18n on client side
if (typeof window !== "undefined") {
	setupI18n();
}

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			{children}
			<Toaster richColors />
		</ThemeProvider>
	);
}
