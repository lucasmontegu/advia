// apps/mobile/components/toast/toast-provider.tsx

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toast, type ToastType } from "./toast";

// ============ Types ============

export interface ToastOptions {
	type?: ToastType;
	duration?: number;
	action?: {
		label: string;
		onPress: () => void;
	};
	dismissible?: boolean;
}

interface ToastData {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
	action?: {
		label: string;
		onPress: () => void;
	};
	dismissible: boolean;
}

interface ToastContextValue {
	show: (message: string, options?: ToastOptions) => string;
	success: (message: string, options?: Omit<ToastOptions, "type">) => string;
	error: (message: string, options?: Omit<ToastOptions, "type">) => string;
	warning: (message: string, options?: Omit<ToastOptions, "type">) => string;
	info: (message: string, options?: Omit<ToastOptions, "type">) => string;
	dismiss: (id: string) => void;
	dismissAll: () => void;
}

// ============ Context ============

const ToastContext = createContext<ToastContextValue | null>(null);

// ============ Provider ============

interface ToastProviderProps {
	children: ReactNode;
	/**
	 * Maximum number of toasts to show at once
	 */
	maxToasts?: number;
	/**
	 * Default duration in ms
	 */
	defaultDuration?: number;
	/**
	 * Position of toasts
	 */
	position?: "top" | "bottom";
}

export function ToastProvider({
	children,
	maxToasts = 3,
	defaultDuration = 4000,
	position = "bottom",
}: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastData[]>([]);
	const insets = useSafeAreaInsets();

	const generateId = useCallback(() => {
		return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}, []);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const dismissAll = useCallback(() => {
		setToasts([]);
	}, []);

	const show = useCallback(
		(message: string, options?: ToastOptions): string => {
			const id = generateId();
			const toast: ToastData = {
				id,
				message,
				type: options?.type ?? "info",
				duration: options?.duration ?? defaultDuration,
				action: options?.action,
				dismissible: options?.dismissible ?? true,
			};

			setToasts((prev) => {
				const newToasts = [toast, ...prev];
				return newToasts.slice(0, maxToasts);
			});

			return id;
		},
		[generateId, defaultDuration, maxToasts],
	);

	const success = useCallback(
		(message: string, options?: Omit<ToastOptions, "type">): string => {
			return show(message, { ...options, type: "success" });
		},
		[show],
	);

	const error = useCallback(
		(message: string, options?: Omit<ToastOptions, "type">): string => {
			return show(message, { ...options, type: "error", duration: 6000 });
		},
		[show],
	);

	const warning = useCallback(
		(message: string, options?: Omit<ToastOptions, "type">): string => {
			return show(message, { ...options, type: "warning" });
		},
		[show],
	);

	const info = useCallback(
		(message: string, options?: Omit<ToastOptions, "type">): string => {
			return show(message, { ...options, type: "info" });
		},
		[show],
	);

	const contextValue = useMemo(
		() => ({
			show,
			success,
			error,
			warning,
			info,
			dismiss,
			dismissAll,
		}),
		[show, success, error, warning, info, dismiss, dismissAll],
	);

	const containerStyle = useMemo(
		() => [
			styles.container,
			position === "top"
				? { top: insets.top + 8 }
				: { bottom: insets.bottom + 8 },
		],
		[position, insets],
	);

	return (
		<ToastContext.Provider value={contextValue}>
			{children}
			<View style={containerStyle} pointerEvents="box-none">
				{toasts.map((toast, index) => (
					<Toast
						key={toast.id}
						id={toast.id}
						message={toast.message}
						type={toast.type}
						duration={toast.duration}
						action={toast.action}
						dismissible={toast.dismissible}
						onDismiss={dismiss}
						index={index}
					/>
				))}
			</View>
		</ToastContext.Provider>
	);
}

// ============ Hook ============

/**
 * Hook for showing toast notifications
 *
 * @example
 * const toast = useToast();
 * toast.success("Route saved!");
 * toast.error("Network error", { action: { label: "Retry", onPress: retry } });
 */
export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

// ============ Styles ============

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 16,
		right: 16,
		gap: 8,
		zIndex: 9999,
	},
});
