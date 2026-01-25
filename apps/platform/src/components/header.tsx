"use client";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const { t } = useTranslation();

	const links = [
		{ to: "/", labelKey: "web.nav.home" },
		{ to: "/dashboard", labelKey: "web.nav.dashboard" },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, labelKey }) => {
						return (
							<Link key={to} href={to}>
								{t(labelKey)}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
