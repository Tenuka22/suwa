export interface WearablePackage {
  actions: readonly WearableAction[];
  capabilities: readonly string[];
  caveats: readonly string[];
  connectionMode: "stream";
  connectLabel: string;
  connectPrompt: string;
  connectTitle: string;
  docsSummary: string;
  emptyState: string;
  idleStateLabel: string;
  packageName: string;
  readyStateLabel: string;
  route: string;
  sourceLabel: string;
  title: string;
}

export interface WearableAction {
  description: string;
  id: string;
  label: string;
}

export const wearablePackages = [
  {
    capabilities: [
      "Raw sensor signal data",
      "Processed sensor data",
      "Galaxy Watch sensors",
      "Health data SDK suite",
    ],
    caveats: [
      "This is a native Samsung SDK, not a pure React Native package.",
      "Requires a native Android bridge and Samsung-supported devices.",
      "Best suited for research or ML workflows.",
    ],
    connectLabel: "Connect Samsung Health",
    connectPrompt:
      "Samsung Health Sensor SDK needs a native bridge on a supported device.",
    connectTitle: "Open Samsung sensor bridge",
    connectionMode: "stream",
    emptyState:
      "Open the Samsung bridge, then start a raw or processed sensor stream.",
    idleStateLabel: "bridge closed",
    readyStateLabel: "bridge ready",
    actions: [
      {
        id: "heart-rate",
        label: "Start heart rate stream",
        description: "Continuous heart rate samples.",
      },
      {
        id: "rr",
        label: "Start RR stream",
        description: "RR intervals for HRV work.",
      },
      {
        id: "ecg",
        label: "Start ECG stream",
        description: "Native ECG bridge.",
      },
      {
        id: "ppg",
        label: "Start PPG stream",
        description: "Optical raw signal.",
      },
      {
        id: "motion",
        label: "Start motion stream",
        description: "Accelerometer and gyroscope.",
      },
    ],
    docsSummary:
      "Samsung Health Sensor SDK for Galaxy Watch sensor data and processed metrics.",
    packageName: "Samsung Health Sensor SDK",
    route: "/test/samsung-health-sensor",
    sourceLabel: "Native SDK",
    title: "Samsung Health Sensor",
  },
] as const satisfies readonly WearablePackage[];

export type WearablePackageRoute = (typeof wearablePackages)[number]["route"];

export const getWearablePackage = (route: string) =>
  wearablePackages.find((item) => item.route === route);
