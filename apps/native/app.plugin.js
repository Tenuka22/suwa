const {
  withAndroidManifest,
  withMainApplication,
} = require("expo/config-plugins");

const addSamsungSensorPermission = (config) => {
  const manifestXml = config.modResults;
  const application = manifestXml.manifest.application?.[0];

  if (!application) {
    return config;
  }

  manifestXml.manifest["uses-permission"] =
    manifestXml.manifest["uses-permission"] ?? [];

  const permissions = new Set(
    manifestXml.manifest["uses-permission"].map((entry) => entry.$["android:name"])
  );

  for (const permission of [
    "android.permission.BODY_SENSORS",
    "android.permission.ACTIVITY_RECOGNITION",
    "com.samsung.android.hardware.sensormanager.permission.READ_ADDITIONAL_HEALTH_DATA",
  ]) {
    if (!permissions.has(permission)) {
      manifestXml.manifest["uses-permission"].push({
        $: { "android:name": permission },
      });
    }
  }

  return config;
};

module.exports = function withSamsungSensorBridge(config) {
  const nextConfig = withAndroidManifest(config, (manifestConfig) =>
    addSamsungSensorPermission(manifestConfig)
  );

  return withMainApplication(nextConfig, (appConfig) => {
    const imports = appConfig.modResults.contents;
    if (!imports.includes("SamsungSensorBridgePackage")) {
      appConfig.modResults.contents = imports.replace(
        "import com.facebook.react.ReactApplication;",
        "import com.facebook.react.ReactApplication;\nimport com.anonymous.mybettertapp.samsung.SamsungSensorBridgePackage;"
      );
    }

    if (
      !appConfig.modResults.contents.includes("SamsungSensorBridgePackage()")
    ) {
      appConfig.modResults.contents = appConfig.modResults.contents.replace(
        "packages.add(new MainReactPackage());",
        "packages.add(new MainReactPackage());\n    packages.add(new SamsungSensorBridgePackage());"
      );
    }

    return appConfig;
  });
};
