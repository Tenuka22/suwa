import { NativeEventEmitter, NativeModules } from "react-native";

export type SamsungSensorType =
  | "heart_rate"
  | "rr_interval"
  | "ecg"
  | "ppg"
  | "accelerometer"
  | "gyroscope"
  | "eda"
  | "skin_temperature"
  | "spo2"
  | "bia";

export interface SamsungSensorSample {
  deviceModel?: string;
  sampleRateHz?: number;
  sensorType: SamsungSensorType;
  timestamp: number;
  values: readonly number[];
}

export interface SamsungSensorBridge {
  addListener: (
    eventName: "SamsungSensorSample",
    listener: (sample: SamsungSensorSample) => void
  ) => { remove: () => void };
  getLatestSample: () => Promise<SamsungSensorSample | null>;
  isAvailable: () => Promise<boolean>;
  startStreaming: (sensorType: SamsungSensorType) => Promise<void>;
  stopStreaming: () => Promise<void>;
}

const bridgeError = () =>
  new Error(
    "Samsung sensor bridge is not installed yet. Add the native Android module for Samsung Health Sensor SDK."
  );

interface NativeSamsungSensorBridge {
  addListener: (eventName: string) => void;
  getLatestSample: () => Promise<SamsungSensorSample | null>;
  isAvailable: () => Promise<boolean>;
  startStreaming: (sensorType: SamsungSensorType) => Promise<void>;
  stopStreaming: () => Promise<void>;
}

const nativeModule = NativeModules.SamsungSensorBridge as
  | NativeSamsungSensorBridge
  | undefined;

const eventEmitter = nativeModule
  ? new NativeEventEmitter(nativeModule as never)
  : null;

export const samsungSensorBridge: SamsungSensorBridge = {
  addListener(eventName, listener) {
    if (!(eventEmitter && nativeModule)) {
      throw bridgeError();
    }

    return {
      remove: eventEmitter.addListener(eventName, listener).remove,
    };
  },
  getLatestSample: () =>
    nativeModule?.getLatestSample() ?? Promise.reject(bridgeError()),
  isAvailable: () => nativeModule?.isAvailable() ?? Promise.resolve(false),
  startStreaming: (sensorType) =>
    nativeModule?.startStreaming(sensorType) ?? Promise.reject(bridgeError()),
  stopStreaming: () =>
    nativeModule?.stopStreaming() ?? Promise.reject(bridgeError()),
};
