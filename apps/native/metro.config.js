const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(import.meta.dirname);

module.exports = withNativewind(config);
