import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Gowai - Tu Asesor de Tormentas con IA",
	description:
		"La primera app que no solo te alerta del clima peligroso, sino que te dice DONDE refugiarte y te guia hasta ahi.",
	keywords: ["clima", "granizo", "alertas", "refugio", "argentina", "app"],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es">
			<body className="min-h-screen bg-background antialiased">{children}</body>
		</html>
	);
}
