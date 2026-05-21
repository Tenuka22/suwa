import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { samsungSensorBridge } from "@/utils/samsung-health-sensor-bridge";
import type {
  WearableAction,
  WearablePackage,
} from "@/utils/wearable-packages";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

interface LogEntry {
  id: string;
  message: string;
}

interface PackageScreenProps {
  item: WearablePackage;
}

const now = () => new Date().toLocaleTimeString();

let logSequence = 0;

const nextLogEntry = (message: string): LogEntry => {
  logSequence += 1;
  return {
    id: `${Date.now()}-${logSequence}`,
    message: `${now()} · ${message}`,
  };
};

const startSamsungConnection = async (
  item: WearablePackage,
  pushLog: (message: string) => void,
  setConnectionStatus: (status: ConnectionStatus) => void,
  setActiveActionId: (value: string | null) => void,
  setLatestReading: (value: string | null) => void
) => {
  if (item.route !== "/test/samsung-health-sensor") {
    throw new Error("Only the Samsung sensor bridge is enabled in this build.");
  }

  const available = await samsungSensorBridge.isAvailable();

  if (!available) {
    throw new Error(
      "Samsung sensor bridge is not installed yet. Add the native module and Galaxy Watch SDK integration first."
    );
  }

  setConnectionStatus("connected");
  setActiveActionId(null);
  setLatestReading("Tap a sensor button to see live readings.");
  pushLog("Samsung sensor bridge is ready.");
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

  return item.idleStateLabel;
};

const getSamsungSensorType = (actionId: string) => {
  switch (actionId) {
    case "heart-rate":
      return "heart_rate";
    case "rr":
      return "rr_interval";
    case "ecg":
      return "ecg";
    case "ppg":
      return "ppg";
    default:
      return "accelerometer";
  }
};

const runSamsungAction = async (
  action: WearableAction,
  pushLog: (message: string) => void,
  setActiveActionId: (value: string) => void
) => {
  await samsungSensorBridge.startStreaming(getSamsungSensorType(action.id));
  pushLog(`${action.label}: native streaming started.`);
  setActiveActionId(action.id);
};

export const PackageScreen = ({ item }: PackageScreenProps) => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [latestReading, setLatestReading] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const sensorSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(
    () => () => {
      sensorSubscriptionRef.current?.remove();
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

  const connectCurrentSource = async () => {
    await startSamsungConnection(
      item,
      pushLog,
      setConnectionStatus,
      setActiveActionId,
      setLatestReading
    );

    sensorSubscriptionRef.current?.remove();
    sensorSubscriptionRef.current = samsungSensorBridge.addListener(
      "SamsungSensorSample",
      (sample) => {
        setLatestReading(
          `${sample.sensorType}: ${sample.values.join(", ")} @ ${sample.sampleRateHz ?? "n/a"}Hz`
        );
        pushLog(`${sample.sensorType} sample received.`);
      }
    );
  };

  const runAction = async (action: WearableAction) => {
    if (connectionStatus !== "connected") {
      throw new Error(`Connect ${item.title} before running ${action.label}.`);
    }

    if (item.route === "/test/samsung-health-sensor") {
      await runSamsungAction(action, pushLog, setActiveActionId);
      return;
    }

    throw new Error(`${action.label} is not wired in this build.`);
  };

  const renderStatusBadge = () => {
    let badgeColor = "bg-zinc-400";
    let textColor = "text-zinc-600 dark:text-zinc-400";
    const label = getStatusLabel(item, connectionStatus, activeActionId);

    if (activeActionId) {
      badgeColor = "bg-primary";
      textColor = "text-primary";
    } else if (connectionStatus === "connected") {
      badgeColor = "bg-emerald-500";
      textColor = "text-emerald-600 dark:text-emerald-400";
    } else if (connectionStatus === "connecting") {
      badgeColor = "bg-amber-500";
      textColor = "text-amber-600 dark:text-amber-400";
    } else if (connectionStatus === "error") {
      badgeColor = "bg-destructive";
      textColor = "text-destructive";
    }

    return (
      <View className="flex-row items-center gap-2 rounded-chip border border-border bg-card px-3 py-1">
        <View className={`h-2.5 w-2.5 rounded-full ${badgeColor}`} />
        <Text
          className={`font-bold font-sans text-xs uppercase tracking-wider ${textColor}`}
        >
          {label}
        </Text>
      </View>
    );
  };

  const canConnect = true;

  return (
    <Screen contentClassName="gap-section px-page py-page bg-background">
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

      {/* Intro Header Section (Flat, Editorial, Direct on Page Background) */}
      <View className="mb-2 gap-2">
        <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
          {item.sourceLabel}
        </Text>
        <Text className="font-black font-sans text-4xl text-foreground tracking-tight">
          {item.title}
        </Text>
        <Text className="mt-1 font-normal font-sans text-base text-muted-foreground leading-6">
          {item.docsSummary}
        </Text>
      </View>

      {/* Connection Status Card */}
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-[0.18em]">
            Connection Status
          </Text>
          {renderStatusBadge()}
        </View>

        <Text className="font-normal font-sans text-muted-foreground text-sm leading-6">
          {connectionStatus === "connected"
            ? "The Samsung sensor bridge is connected and active. You can start sensor streams below."
            : item.emptyState}
        </Text>

        {canConnect && connectionStatus !== "connected" ? (
          <Button
            className="w-full"
            onPress={() => setIsConnectModalOpen(true)}
            variant="secondary"
          >
            {item.connectLabel}
          </Button>
        ) : null}
      </Card>

      {/* Live Sensors & Readings Section */}
      {item.connectionMode === "stream" && connectionStatus === "connected" ? (
        <View className="gap-3">
          <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
            Live readings
          </Text>
          <Card className="gap-3 border-primary/20 bg-muted">
            <View className="flex-row items-center justify-between">
              <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.12em]">
                Latest sample
              </Text>
              {activeActionId ? (
                <View className="h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </View>
            <Text className="font-medium font-sans text-base text-foreground leading-6">
              {latestReading ?? "No sensor data active. Start a stream below."}
            </Text>
          </Card>
        </View>
      ) : null}

      {/* Sensor Stream Trigger Actions */}
      <View className="gap-2">
        <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
          Actions
        </Text>
        <View className="gap-3">
          {item.actions.map((action) => (
            <Button
              className="w-full"
              disabled={connectionStatus !== "connected"}
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
              <View className="w-full flex-col items-start gap-1 py-1">
                <Text
                  className={`font-bold font-sans text-base ${
                    activeActionId === action.id
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {action.label}
                </Text>
                {action.description ? (
                  <Text
                    className={`font-normal font-sans text-xs ${
                      activeActionId === action.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {action.description}
                  </Text>
                ) : null}
              </View>
            </Button>
          ))}
        </View>
      </View>

      {/* Debug Logs Section */}
      <View className="gap-2">
        <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
          Recent events log
        </Text>
        <Card className="gap-2 border-2 border-border bg-zinc-950 p-card">
          {log.length ? (
            log.map((entry) => (
              <Text
                className="font-mono text-xs text-zinc-400 leading-5"
                key={entry.id}
              >
                {entry.message}
              </Text>
            ))
          ) : (
            <Text className="font-mono text-xs text-zinc-500 leading-5">
              No events recorded. Actions will log here.
            </Text>
          )}
        </Card>
      </View>

      {/* Notes / Caveats Box */}
      <View className="gap-3">
        <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
          Notes & Caveats
        </Text>
        <View className="gap-3">
          {item.caveats.map((caveat) => (
            <Text
              className="border-primary border-l-2 pl-3 font-normal font-sans text-muted-foreground text-sm leading-5"
              key={caveat}
            >
              {caveat}
            </Text>
          ))}
        </View>
      </View>

      {/* Navigation Footer */}
      <View className="mt-2 flex-row gap-chip">
        <Button className="flex-1" href="/test" variant="secondary">
          Back to test list
        </Button>
        <Button className="flex-1" href="/">
          Home
        </Button>
      </View>
    </Screen>
  );
};
