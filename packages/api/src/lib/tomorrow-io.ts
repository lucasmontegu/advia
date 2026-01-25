// Re-export from new weather module for backwards compatibility
export {
	calculateRoadRisk,
	checkApiLimit as checkTomorrowApiLimit,
	getCacheTTL,
	tomorrowClient,
	tomorrowIoProvider,
} from "./weather";

// Legacy export
export const checkApiLimit = async () => {
	const { checkApiLimit } = await import("./weather");
	return checkApiLimit("tomorrow", 500);
};
