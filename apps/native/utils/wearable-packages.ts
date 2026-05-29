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
      "Real-time sensor data generation",
      "SQLite local storage",
      "LSTM Model Prediction",
    ],
    caveats: [
      "This is a testing platform for ML prediction algorithms.",
      "Data is stored in an in-app SQLite database.",
    ],
    connectLabel: "Open Stress Predictor",
    connectPrompt: "Stress Predictor testing platform initialized.",
    connectTitle: "Run Stress Predictor",
    connectionMode: "stream",
    emptyState: "Start the algorithm to begin real-time stress prediction.",
    idleStateLabel: "simulator closed",
    readyStateLabel: "simulator ready",
    actions: [
      {
        id: "start-simulation",
        label: "Start Simulation",
        description: "Generate semi-realistic sensor data.",
      },
    ],
    docsSummary: "Local-first stress prediction testing platform.",
    packageName: "Stress Predictor Platform",
    route: "/test/stress-predictor",
    sourceLabel: "ML Lab",
    title: "Stress Predictor",
  },
] as const satisfies readonly WearablePackage[];

export type WearablePackageRoute = (typeof wearablePackages)[number]["route"];

export const getWearablePackage = (route: string) =>
  wearablePackages.find((item) => item.route === route);
