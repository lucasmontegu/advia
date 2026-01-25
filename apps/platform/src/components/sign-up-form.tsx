"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();
	const { t } = useTranslation();
	const { isPending } = authClient.useSession();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState<
		"email" | "google" | "apple" | null
	>(null);

	const handleEmailSignUp = async () => {
		if (!email.trim() || !password || !name.trim()) {
			toast.error(t("auth.fillAllFields"));
			return;
		}

		if (password.length < 8) {
			toast.error(t("auth.passwordTooShort"));
			return;
		}

		setIsLoading("email");
		try {
			const result = await authClient.signUp.email({
				email: email.trim(),
				password,
				name: name.trim(),
			});

			if (result.error) {
				toast.error(result.error.message || t("auth.signUpError"));
				return;
			}

			toast.success(t("web.auth.signUpSuccess"));
			router.push("/dashboard");
		} catch (error) {
			toast.error(t("auth.signUpError"));
		} finally {
			setIsLoading(null);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsLoading("google");
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/dashboard",
			});
		} catch (error) {
			toast.error("Error signing up with Google");
			setIsLoading(null);
		}
	};

	const handleAppleSignIn = async () => {
		setIsLoading("apple");
		try {
			await authClient.signIn.social({
				provider: "apple",
				callbackURL: "/dashboard",
			});
		} catch (error) {
			toast.error("Error signing up with Apple");
			setIsLoading(null);
		}
	};

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">
				{t("web.auth.createAccount")}
			</h1>

			{/* Social login buttons */}
			<div className="mb-6 space-y-3">
				<Button
					variant="outline"
					className="w-full"
					onClick={handleGoogleSignIn}
					disabled={isLoading !== null}
				>
					<svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="currentColor"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="currentColor"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="currentColor"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					{isLoading === "google"
						? t("auth.connecting")
						: t("auth.continueWithGoogle")}
				</Button>

				<Button
					variant="outline"
					className="w-full"
					onClick={handleAppleSignIn}
					disabled={isLoading !== null}
				>
					<svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
					</svg>
					{isLoading === "apple"
						? t("auth.connecting")
						: t("auth.continueWithApple")}
				</Button>
			</div>

			{/* Divider */}
			<div className="relative mb-6">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">
						{t("common.or")}
					</span>
				</div>
			</div>

			{/* Email/Password form */}
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="name">{t("web.auth.name")}</Label>
					<Input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t("auth.namePlaceholder")}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">{t("web.auth.email")}</Label>
					<Input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={t("auth.emailPlaceholder")}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="password">{t("web.auth.password")}</Label>
					<Input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={t("auth.passwordPlaceholder")}
					/>
					<p className="text-muted-foreground text-sm">
						{t("auth.passwordRequirements")}
					</p>
				</div>

				<Button
					className="w-full"
					onClick={handleEmailSignUp}
					disabled={isLoading !== null}
				>
					{isLoading === "email"
						? t("web.auth.signingUp")
						: t("web.auth.signUp")}
				</Button>
			</div>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={onSwitchToSignIn}
					className="text-indigo-600 hover:text-indigo-800"
				>
					{t("web.auth.haveAccount")}
				</Button>
			</div>
		</div>
	);
}
