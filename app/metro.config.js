const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "..")];

// Disable package.json "exports" field resolution to fix
// @react-navigation/core internal module resolution issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
