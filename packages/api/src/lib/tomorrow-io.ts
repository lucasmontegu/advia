// Re-export from new weather module for backwards compatibility
export {
  tomorrowClient,
  tomorrowIoProvider,
  calculateRoadRisk,
  getCacheTTL,
  checkApiLimit as checkTomorrowApiLimit,
} from "./weather";

// Legacy export
export const checkApiLimit = async () => {
  const { checkApiLimit } = await import("./weather");
  return checkApiLimit("tomorrow", 500);
};
