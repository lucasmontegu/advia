/**
 * Expo Config Plugin to disable User Script Sandboxing
 *
 * This fixes the Xcode 15+ build issue where sandboxing blocks
 * script phases from writing files.
 *
 * Error it fixes:
 * Sandbox: bash deny(1) file-write-create .../Pods/resources-to-copy-*.txt
 *
 * @see https://github.com/facebook/react-native/issues/47228
 */
const { withXcodeProject } = require("expo/config-plugins");

const withDisableSandboxing = (config) => {
	return withXcodeProject(config, async (config) => {
		const xcodeProject = config.modResults;

		// Get all build configurations
		const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();

		// Disable sandboxing for all configurations
		for (const key in buildConfigurations) {
			const buildConfig = buildConfigurations[key];
			if (buildConfig.buildSettings) {
				buildConfig.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
			}
		}

		return config;
	});
};

module.exports = withDisableSandboxing;
