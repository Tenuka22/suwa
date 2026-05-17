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

interface PackageScreenProps {
  item: WearablePackage;
}

const now = () => new Date().toLocaleTimeString();

let logSequence = 0;

const actionSummary = (action: WearableAction) =>
  action.description ? `${action.label} - ${action.description}` : action.label;

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

  const canConnect = true;

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
              Tap a sensor button to start the Samsung native stream.
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
