import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Platform, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import type {
  WearableAction,
  WearablePackage,
} from "@/utils/wearable-packages";

interface PackageScreenProps {
  item: WearablePackage;
}

interface HealthKitModule {
  Constants: {
    Permissions: Record<string, string>;
  };
  getActiveEnergyBurned: (
    options: Record<string, unknown>,
    callback: (error: unknown, results: readonly { value?: number }[]) => void
  ) => void;
  getElectrocardiogramSamples: (
    options: Record<string, unknown>,
    callback: (error: unknown, results: readonly unknown[]) => void
  ) => void;
  getHeartRateSamples: (
    options: Record<string, unknown>,
    callback: (error: unknown, results: readonly unknown[]) => void
  ) => void;
  getHeartRateVariabilitySamples: (
    options: Record<string, unknown>,
    callback: (error: unknown, results: readonly unknown[]) => void
  ) => void;
  getLatestBmi: (
    callback: (error: unknown, result: { value?: number }) => void
  ) => void;
  getSleepSamples: (
    options: Record<string, unknown>,
    callback: (error: unknown, results: readonly unknown[]) => void
  ) => void;
  getStepCount: (
    options: Record<string, unknown>,
    callback: (error: unknown, result: { value?: number }) => void
  ) => void;
  getWeightSamples: (
    options: Record<string, unknown>,
    callback: (error: unknown, results: readonly unknown[]) => void
  ) => void;
  initHealthKit: (
    permissions: Record<string, unknown>,
    callback: (error: string | null) => void
  ) => void;
}

interface HealthConnectModule {
  initialize: () => Promise<unknown>;
  readRecords: (
    recordType: string,
    options: { timeRangeFilter: Record<string, string> }
  ) => Promise<{ records?: readonly unknown[]; result?: readonly unknown[] }>;
  requestPermission: (
    permissions: readonly {
      accessType: "read" | "write";
      recordType: string;
    }[]
  ) => Promise<unknown>;
}

interface SensorSubscription {
  unsubscribe: () => void;
}

interface SensorsModule {
  accelerometer: {
    subscribe: (
      next: (value: MotionSample) => void,
      error: (error: unknown) => void
    ) => SensorSubscription;
  };
  barometer: {
    subscribe: (
      next: (value: MotionSample) => void,
      error: (error: unknown) => void
    ) => SensorSubscription;
  };
  gyroscope: {
    subscribe: (
      next: (value: MotionSample) => void,
      error: (error: unknown) => void
    ) => SensorSubscription;
  };
  magnetometer: {
    subscribe: (
      next: (value: MotionSample) => void,
      error: (error: unknown) => void
    ) => SensorSubscription;
  };
  SensorTypes: Record<string, string>;
  setUpdateIntervalForType: (sensorType: string, interval: number) => void;
}

interface MotionSample {
  pressure?: number;
  x?: number;
  y?: number;
  z?: number;
}



const now = () => new Date().toLocaleTimeString();

let logSequence = 0;

const actionSummary = (action: WearableAction) =>
  action.description ? `${action.label} - ${action.description}` : action.label;

const getApplePermissions = (healthKit: HealthKitModule) => ({
  permissions: {
    read: [
      healthKit.Constants.Permissions.HeartRate,
      healthKit.Constants.Permissions.HeartRateVariability,
      healthKit.Constants.Permissions.Electrocardiogram,
      healthKit.Constants.Permissions.RespiratoryRate,
      healthKit.Constants.Permissions.OxygenSaturation,
      healthKit.Constants.Permissions.SleepAnalysis,
      healthKit.Constants.Permissions.StepCount,
      healthKit.Constants.Permissions.ActiveEnergyBurned,
      healthKit.Constants.Permissions.Weight,
      healthKit.Constants.Permissions.BodyMassIndex,
      healthKit.Constants.Permissions.MindfulSession,
      healthKit.Constants.Permissions.EnvironmentalAudioExposure,
    ],
  },
});

const getAppleOptions = () => ({
  ascending: false,
  endDate: new Date().toISOString(),
  limit: 10,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
});

const getAppleReadMethod = (healthKit: HealthKitModule, actionId: string) => {
  switch (actionId) {
    case "heart-rate":
      return healthKit.getHeartRateSamples;
    case "hrv":
      return healthKit.getHeartRateVariabilitySamples;
    case "ecg":
      return healthKit.getElectrocardiogramSamples;
    case "steps":
      return healthKit.getStepCount;
    case "sleep":
      return healthKit.getSleepSamples;
    case "energy":
      return healthKit.getActiveEnergyBurned;
    default:
      return healthKit.getWeightSamples;
  }
};

const getHealthConnectRecordType = (actionId: string) => {
  switch (actionId) {
    case "heart-rate":
      return "HeartRate";
    case "steps":
      return "Steps";
    case "sleep":
      return "SleepSession";
    case "energy":
      return "ActiveCaloriesBurned";
    case "body":
      return "Weight";
    case "workout":
      return "ExerciseSession";
    default:
      return "HeartRate";
  }
};

const getMotionStream = (sensors: SensorsModule, actionId: string) => {
  switch (actionId) {
    case "accelerometer":
      return sensors.accelerometer;
    case "gyroscope":
      return sensors.gyroscope;
    case "magnetometer":
      return sensors.magnetometer;
    default:
      return sensors.barometer;
  }
};

const getMotionReading = (value: MotionSample) => {
  if (value.x === undefined) {
    return `pressure=${value.pressure ?? "n/a"}`;
  }

  return `x=${value.x}, y=${value.y ?? "n/a"}, z=${value.z ?? "n/a"}`;
};

const nextLogEntry = (message: string): LogEntry => {
  logSequence += 1;
  return {
    id: `${Date.now()}-${logSequence}`,
    message: `${now()} · ${message}`,
  };
};



const startMotionConnection = (
  item: WearablePackage,
  pushLog: (message: string) => void,
  setConnectionStatus: (status: ConnectionStatus) => void,
  setActiveActionId: (value: string | null) => void,
  setLatestReading: (value: string | null) => void
) => {
  if (item.connectionMode === "stream") {
    setConnectionStatus("connected");
    setActiveActionId(null);
    setLatestReading("Tap a sensor button to see live readings.");
    pushLog("Motion stream is ready.");
    return;
  }

  throw new Error("This source is not a live stream.");
};

const showErrorAlert = (title: string, message: string) => {
  Alert.alert(title, message);
};

const getStatusLabel = (
  item: WearablePackage,
  connectionStatus: ConnectionStatus,
  activeActionId: string | null
) => {
  if (item.connectionMode === "stream") {
    return activeActionId ? item.readyStateLabel : item.idleStateLabel;
  }

  if (connectionStatus === "connected") {
    return item.readyStateLabel;
  }

  if (connectionStatus === "connecting") {
    return "connecting";
  }

  if (connectionStatus === "error" && item.connectionMode === "unsupported") {
    return item.idleStateLabel;
  }

  return item.idleStateLabel;
};

const runAppleAction = async (
  action: WearableAction,
  pushLog: (message: string) => void,
  setActiveActionId: (value: string) => void
) => {
  const healthKit = await loadHealthKit();
  const options = getAppleOptions();
  const readMethod = getAppleReadMethod(healthKit, action.id);

  const result = await new Promise<readonly unknown[] | { value?: number }>(
    (resolve, reject) => {
      readMethod(options, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      });
    }
  );

  if (action.id === "body") {
    const bmi = await new Promise<{ value?: number }>((resolve, reject) => {
      healthKit.getLatestBmi((error, response) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      });
    });

    const weightCount = Array.isArray(result) ? result.length : 0;
    pushLog(
      `${action.label}: ${weightCount} weight sample(s), BMI ${bmi.value ?? "n/a"}.`
    );
    setActiveActionId(action.id);
    return;
  }

  let count = 0;

  if (Array.isArray(result)) {
    count = result.length;
  } else {
    const scalarResult = result as { value?: number };

    if (typeof scalarResult.value === "number") {
      count = scalarResult.value;
    }
  }

  pushLog(`${action.label}: received ${count} sample(s).`);
  setActiveActionId(action.id);
};

const runHealthConnectAction = async (
  action: WearableAction,
  pushLog: (message: string) => void,
  setActiveActionId: (value: string) => void
) => {
  const healthConnect = await loadHealthConnect();
  const recordType = getHealthConnectRecordType(action.id);
  const result = await healthConnect.readRecords(recordType, {
    timeRangeFilter: {
      endTime: new Date().toISOString(),
      operator: "between",
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  const records = result.records ?? result.result ?? [];
  pushLog(`${action.label}: received ${records.length} record(s).`);
  setActiveActionId(action.id);
};

export const PackageScreen = ({ item }: PackageScreenProps) => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [latestReading, setLatestReading] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const sensorSubscriptionRef = useRef<SensorSubscription | null>(null);

  useEffect(
    () => () => {
      sensorSubscriptionRef.current?.unsubscribe();
    },
    []
  );

  const pushLog = (message: string) => {
    setLog((current) => [nextLogEntry(message), ...current].slice(0, 6));
  };

  const setConnectionError = (message: string) => {
    setConnectionStatus("error");
    pushLog(message);
  };

  const connectAppleHealth = async () => {
    if (Platform.OS !== "ios") {
      throw new Error("Apple HealthKit is only available on iOS.");
    }

    setConnectionStatus("connecting");

    try {
      const healthKit = await loadHealthKit();
      await new Promise<void>((resolve, reject) => {
        healthKit.initHealthKit(getApplePermissions(healthKit), (error) => {
          if (error) {
            reject(new Error(error));
            return;
          }

          resolve();
        });
      });

      setConnectionStatus("connected");
      pushLog("HealthKit authorization granted.");
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("HealthKit connection failed.");
    }
  };

  const connectHealthConnect = async () => {
    if (Platform.OS !== "android") {
      throw new Error("Health Connect is only available on Android.");
    }

    setConnectionStatus("connecting");

    try {
      const healthConnect = await loadHealthConnect();

      await healthConnect.initialize();
      await healthConnect.requestPermission([
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "SleepSession" },
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
        { accessType: "read", recordType: "Weight" },
        { accessType: "read", recordType: "BodyFat" },
        { accessType: "read", recordType: "ExerciseSession" },
      ]);

      setConnectionStatus("connected");
      pushLog("Health Connect authorization granted.");
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Health Connect connection failed.");
    }
  };

  const connectUnsupportedSource = () => {
    if (item.route === "/test/samsung-health-sensor") {
      throw new Error(
        "Samsung Health Sensor SDK needs a native bridge and is not wired in this build."
      );
    }

    if (item.route === "/test/fitbit-web-api") {
      throw new Error(
        "Fitbit OAuth is not configured in this build yet. Add the app client details before connecting."
      );
    }
  };

  const startMotionStream = async (action: WearableAction) => {
    if (Platform.OS === "web") {
      const started = await startWebMotionStream(
        action,
        pushLog,
        setConnectionStatus,
        setActiveActionId,
        setLatestReading,
        (message) => {
          setConnectionError(message);
        }
      );

      if (!started) {
        throw new Error("Motion sensors are not available on web.");
      }

      return;
    }

    try {
      const sensors = await loadSensors();
      sensorSubscriptionRef.current?.unsubscribe();

      const sensor = getMotionStream(sensors, action.id);
      const sensorType = sensors.SensorTypes[action.id];

      if (action.id !== "barometer") {
        sensors.setUpdateIntervalForType(sensorType, 100);
      }

      setConnectionStatus("connected");
      setActiveActionId(action.id);
      pushLog(`Started ${action.label.toLowerCase()}.`);

      sensorSubscriptionRef.current = sensor.subscribe(
        (value) => {
          pushLog(`${action.label}: ${getMotionReading(value)}`);
        },
        (error) => {
          setConnectionError(
            error instanceof Error
              ? error.message
              : `Failed to start ${action.label}.`
          );
        }
      );
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error(`Failed to start ${action.label}.`);
    }
  };

  const connectCurrentSource = async () => {
    if (item.connectionMode === "stream") {
      startMotionConnection(
        item,
        pushLog,
        setConnectionStatus,
        setActiveActionId,
        setLatestReading
      );
      return;
    }

    if (item.connectionMode === "unsupported") {
      connectUnsupportedSource();
      return;
    }

    if (item.route === "/test/apple-health") {
      await connectAppleHealth();
      return;
    }

    if (item.route === "/test/android-health-connect") {
      await connectHealthConnect();
    }
  };

  const runAction = async (action: WearableAction) => {
    if (item.connectionMode === "stream") {
      await startMotionStream(action);
      return;
    }

    if (connectionStatus !== "connected") {
      throw new Error(`Connect ${item.title} before running ${action.label}.`);
    }

    if (item.route === "/test/apple-health") {
      await runAppleAction(action, pushLog, setActiveActionId);
      return;
    }

    if (item.route === "/test/android-health-connect") {
      await runHealthConnectAction(action, pushLog, setActiveActionId);
      return;
    }

    throw new Error(`${action.label} is not wired in this build.`);
  };

  const canConnect = item.connectionMode !== "unsupported";

  return (
    <Screen contentClassName="gap-section px-page py-page">
      <Modal
        animationType="slide"
        onRequestClose={() => setIsConnectModalOpen(false)}
        transparent
        visible={isConnectModalOpen}
      >
        <View className="flex-1 justify-end bg-black/50 px-page pb-page">
          <Card>
            <View className="gap-chip">
              <Text className="font-medium font-sans text-2xl text-foreground">
                {item.connectTitle}
              </Text>
              <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
                {item.connectPrompt}
              </Text>
            </View>

            <View className="flex-row gap-chip">
              <Button
                className="flex-1"
                onPress={() => setIsConnectModalOpen(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onPress={async () => {
                  try {
                    await connectCurrentSource();
                    setIsConnectModalOpen(false);
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : "Connection failed.";

                    showErrorAlert("Connection failed", message);
                    setConnectionError(message);
                  }
                }}
              >
                Continue
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      <Card>
        <View className="gap-chip">
          <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
            {item.sourceLabel}
          </Text>
          <Text className="font-medium font-sans text-4xl text-foreground">
            {item.title}
          </Text>
          <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
            {item.docsSummary}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-chip">
          <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
            Status
          </Text>
          <Text className="font-medium font-sans text-primary text-sm">
            {getStatusLabel(item, connectionStatus, activeActionId)}
          </Text>
        </View>

        <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
          {item.emptyState}
        </Text>

        {canConnect ? (
          <Button
            onPress={() => setIsConnectModalOpen(true)}
            variant="secondary"
          >
            {item.connectLabel}
          </Button>
        ) : (
          <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
            {item.connectPrompt}
          </Text>
        )}

        {item.connectionMode === "stream" ? (
          <View className="gap-chip">
            <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
              Live sensors
            </Text>
            <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
              Tap a sensor button to subscribe to that live stream.
            </Text>
          </View>
        ) : null}

        {item.connectionMode === "stream" ? (
          <Card className="gap-chip border-primary/40 bg-muted">
            <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
              Latest reading
            </Text>
            <Text className="font-normal font-sans text-base text-foreground leading-6">
              {latestReading ?? "No readings yet."}
            </Text>
          </Card>
        ) : null}

        <View className="gap-chip">
          <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
            Actions
          </Text>
          {item.actions.map((action) => (
            <Button
              className="items-start"
              disabled={
                item.connectionMode !== "stream" &&
                connectionStatus !== "connected"
              }
              key={action.id}
              onPress={() => {
                runAction(action).catch((error: unknown) => {
                  const message =
                    error instanceof Error
                      ? error.message
                      : `Failed to run ${action.label}.`;

                  showErrorAlert("Action failed", message);
                  pushLog(message);
                });
              }}
              variant={activeActionId === action.id ? "primary" : "secondary"}
            >
              {actionSummary(action)}
            </Button>
          ))}
        </View>

        <View className="gap-chip">
          <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
            Recent events
          </Text>
          {log.length ? (
            log.map((entry) => (
              <Text
                className="font-normal font-sans text-muted-foreground text-sm leading-6"
                key={entry.id}
              >
                {entry.message}
              </Text>
            ))
          ) : (
            <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
              No actions yet.
            </Text>
          )}
        </View>

        <View className="gap-chip">
          <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
            Notes
          </Text>
          {item.caveats.map((caveat) => (
            <Text
              className="font-normal font-sans text-muted-foreground text-sm leading-6"
              key={caveat}
            >
              {caveat}
            </Text>
          ))}
        </View>

        <View className="flex-row gap-chip">
          <Button className="flex-1" href="/test" variant="secondary">
            Back to test list
          </Button>
          <Button className="flex-1" href="/">
            Home
          </Button>
        </View>
      </Card>
    </Screen>
  );
};
