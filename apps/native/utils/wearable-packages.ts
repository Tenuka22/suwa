export interface WearablePackage {
  actions: readonly WearableAction[];
  capabilities: readonly string[];
  caveats: readonly string[];
  connectionMode: "permission" | "stream" | "unsupported";
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
      "Heart rate",
      "HRV",
      "ECG",
      "Respiratory rate",
      "SpO2",
      "Sleep stages",
      "Steps",
      "Energy burned",
      "Weight / BMI",
      "Mindfulness / audio exposure",
    ],
    caveats: [
      "Structured HealthKit data, not raw continuous biosignal streams.",
      "ECG is sample-based with voltage measurements.",
      "Motion sensors are not exposed by HealthKit.",
    ],
    connectLabel: "Connect HealthKit",
    connectPrompt:
      "HealthKit requires a system permission flow before reading samples.",
    connectTitle: "Grant HealthKit access",
    connectionMode: "permission",
    emptyState:
      "Connect to HealthKit, then tap an action to run a read request.",
    idleStateLabel: "not authorized",
    readyStateLabel: "authorized",
    actions: [
      {
        id: "heart-rate",
        label: "Read heart rate",
        description: "Fetch samples.",
      },
      {
        id: "hrv",
        label: "Read HRV",
        description: "Fetch variability samples.",
      },
      { id: "ecg", label: "Read ECG", description: "Fetch ECG samples." },
      { id: "steps", label: "Read steps", description: "Fetch step samples." },
      { id: "sleep", label: "Read sleep", description: "Fetch sleep samples." },
      {
        id: "energy",
        label: "Read energy",
        description: "Fetch active energy.",
      },
      {
        id: "body",
        label: "Read weight / BMI",
        description: "Fetch body metrics.",
      },
    ],
    docsSummary:
      "Apple HealthKit bridge for iOS health and fitness data via React Native.",
    packageName: "react-native-health",
    route: "/test/apple-health",
    sourceLabel: "HealthKit bridge",
    title: "Apple HealthKit",
  },
  {
    capabilities: [
      "Structured health records",
      "Activity and calories",
      "Steps",
      "Sleep",
      "Heart rate records",
      "Body metrics",
    ],
    caveats: [
      "Health Connect is an Android aggregation layer, not a raw sensor API.",
      "Requires Health Connect / Android 14+ framework support and a custom build.",
      "Package docs show record-based reads and writes, not sensor streams.",
    ],
    connectLabel: "Connect Health Connect",
    connectPrompt:
      "Health Connect must be initialized before reading structured records.",
    connectTitle: "Grant Health Connect access",
    connectionMode: "permission",
    emptyState:
      "Initialize Health Connect, then request access and read a record.",
    idleStateLabel: "not authorized",
    readyStateLabel: "authorized",
    actions: [
      {
        id: "heart-rate",
        label: "Read heart rate",
        description: "Read record data.",
      },
      {
        id: "steps",
        label: "Read steps",
        description: "Read activity totals.",
      },
      { id: "sleep", label: "Read sleep", description: "Read sleep sessions." },
      {
        id: "energy",
        label: "Read calories",
        description: "Read burned energy.",
      },
      {
        id: "body",
        label: "Read body metrics",
        description: "Read weight and BMI.",
      },
      {
        id: "workout",
        label: "Read workouts",
        description: "Read workout sessions.",
      },
    ],
    docsSummary:
      "Android Health Connect wrapper for reading and writing structured records.",
    packageName: "react-native-health-connect",
    route: "/test/android-health-connect",
    sourceLabel: "Health Connect wrapper",
    title: "Android Health Connect",
  },
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
    connectionMode: "unsupported",
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
  {
    capabilities: [
      "Heart rate time series",
      "HRV",
      "ECG",
      "Sleep",
      "SpO2",
      "Temperature",
      "Body metrics",
      "Activity",
    ],
    caveats: [
      "Cloud-based Fitbit Web API, not a local sensor bridge.",
      "Legacy Fitbit Web API is being deprecated in September 2026.",
      "Requires user consent and OAuth integration.",
    ],
    connectLabel: "Connect Fitbit",
    connectPrompt:
      "Fitbit data requires OAuth authorization before any data can be read.",
    connectTitle: "Link Fitbit account",
    connectionMode: "unsupported",
    emptyState:
      "Connect through Fitbit OAuth, then run a timeline or log read action.",
    idleStateLabel: "not linked",
    readyStateLabel: "linked",
    actions: [
      {
        id: "heart-rate",
        label: "Read heart rate timeline",
        description: "Fetch time series.",
      },
      {
        id: "sleep",
        label: "Read sleep logs",
        description: "Fetch sleep records.",
      },
      {
        id: "spo2",
        label: "Read SpO2",
        description: "Fetch blood oxygen trend.",
      },
      {
        id: "temperature",
        label: "Read temperature",
        description: "Fetch core/skin temperature.",
      },
      {
        id: "activity",
        label: "Read activity",
        description: "Fetch activity history.",
      },
    ],
    docsSummary: "Fitbit Web API for historical cloud health and fitness data.",
    packageName: "Fitbit Web API",
    route: "/test/fitbit-web-api",
    sourceLabel: "Cloud API",
    title: "Fitbit",
  },
] as const satisfies readonly WearablePackage[];

export type WearablePackageRoute = (typeof wearablePackages)[number]["route"];

export const getWearablePackage = (route: string) =>
  wearablePackages.find((item) => item.route === route);
