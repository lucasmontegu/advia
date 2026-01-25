// apps/mobile/components/error-boundary.tsx

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Analytics } from "@/lib/analytics";

// ============ Types ============

interface ErrorBoundaryProps {
	children: ReactNode;
	/**
	 * Custom fallback component to render on error
	 */
	fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
	/**
	 * Component name for error tracking
	 */
	componentName?: string;
	/**
	 * Callback when error is caught
	 */
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	/**
	 * Whether to show retry button in default fallback
	 */
	showRetry?: boolean;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

// ============ Error Boundary Component ============

/**
 * Error boundary for catching and handling React errors gracefully
 *
 * @example
 * <ErrorBoundary componentName="RoutePreview" showRetry>
 *   <RoutePreviewScreen />
 * </ErrorBoundary>
 *
 * @example
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <CustomErrorUI error={error} onRetry={reset} />
 *   )}
 * >
 *   <SomeComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		const { componentName = "Unknown", onError } = this.props;

		// Track error in analytics
		Analytics.errorBoundaryTriggered(
			componentName,
			error.message || "Unknown error",
		);

		// Log to console in development
		if (__DEV__) {
			console.error(
				`[ErrorBoundary:${componentName}] Error caught:`,
				error,
				errorInfo,
			);
		}

		// Call custom error handler if provided
		onError?.(error, errorInfo);
	}

	resetError = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		const { children, fallback, showRetry = true } = this.props;
		const { hasError, error } = this.state;

		if (hasError && error) {
			// Custom fallback (function or component)
			if (typeof fallback === "function") {
				return fallback(error, this.resetError);
			}
			if (fallback) {
				return fallback;
			}

			// Default fallback UI
			return (
				<DefaultErrorFallback
					error={error}
					onRetry={showRetry ? this.resetError : undefined}
				/>
			);
		}

		return children;
	}
}

// ============ Default Fallback UI ============

interface DefaultErrorFallbackProps {
	error: Error;
	onRetry?: () => void;
}

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps) {
	return (
		<Animated.View entering={FadeIn.duration(300)} style={styles.container}>
			<View style={styles.iconContainer}>
				<Text style={styles.icon}>!</Text>
			</View>
			<Text style={styles.title}>Something went wrong</Text>
			<Text style={styles.message}>
				{__DEV__ ? error.message : "Please try again or restart the app."}
			</Text>
			{onRetry && (
				<Pressable
					onPress={onRetry}
					style={styles.retryButton}
					accessibilityLabel="Retry"
					accessibilityRole="button"
				>
					<Text style={styles.retryText}>Try Again</Text>
				</Pressable>
			)}
		</Animated.View>
	);
}

// ============ Specialized Error Boundaries ============

/**
 * Error boundary for route/navigation screens
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			componentName="RouteScreen"
			fallback={
				<View style={styles.routeErrorContainer}>
					<Text style={styles.routeErrorTitle}>Route unavailable</Text>
					<Text style={styles.routeErrorMessage}>
						We couldn't load this route. Check your connection and try again.
					</Text>
				</View>
			}
		>
			{children}
		</ErrorBoundary>
	);
}

/**
 * Error boundary for AI chat components
 */
export function ChatErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			componentName="AIChat"
			fallback={(_, reset) => (
				<View style={styles.chatErrorContainer}>
					<Text style={styles.chatErrorText}>
						Chat is temporarily unavailable
					</Text>
					<Pressable onPress={reset} style={styles.chatRetryButton}>
						<Text style={styles.chatRetryText}>Retry</Text>
					</Pressable>
				</View>
			)}
		>
			{children}
		</ErrorBoundary>
	);
}

/**
 * Error boundary for map components
 */
export function MapErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			componentName="Map"
			fallback={
				<View style={styles.mapErrorContainer}>
					<Text style={styles.mapErrorTitle}>Map unavailable</Text>
					<Text style={styles.mapErrorMessage}>
						Unable to load map. Please check your internet connection.
					</Text>
				</View>
			}
		>
			{children}
		</ErrorBoundary>
	);
}

/**
 * Error boundary for weather components
 */
export function WeatherErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			componentName="Weather"
			fallback={
				<View style={styles.weatherErrorContainer}>
					<Text style={styles.weatherErrorText}>Weather data unavailable</Text>
				</View>
			}
		>
			{children}
		</ErrorBoundary>
	);
}

// ============ Styles ============

const styles = StyleSheet.create({
	// Default fallback
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		backgroundColor: "#0a0a0a",
	},
	iconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: "rgba(239, 68, 68, 0.1)",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	icon: {
		fontSize: 32,
		fontWeight: "700",
		color: "#ef4444",
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		color: "#fafafa",
		marginBottom: 8,
	},
	message: {
		fontSize: 14,
		color: "#a1a1aa",
		textAlign: "center",
		marginBottom: 24,
		lineHeight: 20,
	},
	retryButton: {
		backgroundColor: "#14b8a6",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	retryText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ffffff",
	},

	// Route error
	routeErrorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		backgroundColor: "#0a0a0a",
	},
	routeErrorTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fafafa",
		marginBottom: 8,
	},
	routeErrorMessage: {
		fontSize: 14,
		color: "#a1a1aa",
		textAlign: "center",
		lineHeight: 20,
	},

	// Chat error
	chatErrorContainer: {
		padding: 16,
		alignItems: "center",
		gap: 8,
	},
	chatErrorText: {
		fontSize: 14,
		color: "#a1a1aa",
	},
	chatRetryButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: "rgba(20, 184, 166, 0.1)",
		borderRadius: 8,
	},
	chatRetryText: {
		fontSize: 14,
		color: "#14b8a6",
		fontWeight: "500",
	},

	// Map error
	mapErrorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#1a1a1a",
		padding: 24,
	},
	mapErrorTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fafafa",
		marginBottom: 4,
	},
	mapErrorMessage: {
		fontSize: 14,
		color: "#a1a1aa",
		textAlign: "center",
	},

	// Weather error
	weatherErrorContainer: {
		padding: 12,
		alignItems: "center",
	},
	weatherErrorText: {
		fontSize: 12,
		color: "#a1a1aa",
	},
});
