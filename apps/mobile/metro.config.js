const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const path = require("path");

// Find the project root (monorepo root)
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(monorepoRoot, "node_modules"),
];

// 3. Force specific packages to resolve from the app's node_modules
// This prevents duplicate React instances
config.resolver.extraNodeModules = {
	react: path.resolve(projectRoot, "node_modules/react"),
	"react-native": path.resolve(projectRoot, "node_modules/react-native"),
	"react-i18next": path.resolve(projectRoot, "node_modules/react-i18next"),
	i18next: path.resolve(projectRoot, "node_modules/i18next"),
};

const uniwindConfig = withUniwindConfig(config, {
	cssEntryFile: "./global.css",
	dtsFile: "./uniwind-types.d.ts",
});

module.exports = uniwindConfig;
