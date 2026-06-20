const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/* eslint-disable @typescript-eslint/no-require-imports */
// biome-ignore: lint/suspicious/noGlobalIsNan — must use __dirname for CommonJS metro config
const projectRoot = import.meta.dirname;

const config = getDefaultConfig(projectRoot);

module.exports = withNativewind(config);
