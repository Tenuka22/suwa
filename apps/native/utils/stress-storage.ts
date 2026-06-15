"use client";

import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "stress-cache" });

const SIM_STATE_KEY = "stress:sim:state";
const BUNDLE_PREFIX = "stress:bundle:";
const TOTAL_KEY_SUFFIX = ":total";

export interface RawSample {
  sample: number[];
  timestamp: number;
}

export interface StoredPrediction {
  predictedClass: string;
  probabilities: number[];
  sampleCount: number;
  timestamp: number;
  windowStart: number;
}

export interface StressBundle {
  bundleId: string;
  createdAt: number;
  prediction: StoredPrediction | null;
  samples: RawSample[];
}

export function getSimulationState(): boolean {
  return storage.getBoolean(SIM_STATE_KEY) ?? false;
}

export function setSimulationState(active: boolean): void {
  storage.set(SIM_STATE_KEY, active);
}

export function appendBundles(userId: string, bundles: StressBundle[]): void {
  const existing = getBundles(userId);
  const merged = [...existing, ...bundles];
  storage.set(`${BUNDLE_PREFIX}${userId}`, JSON.stringify(merged));
  storage.set(`${BUNDLE_PREFIX}${userId}${TOTAL_KEY_SUFFIX}`, merged.length);
}

export function getBundles(userId: string): StressBundle[] {
  const raw = storage.getString(`${BUNDLE_PREFIX}${userId}`);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as StressBundle[];
  } catch {
    return [];
  }
}

export function getBundleCount(userId: string): number {
  return storage.getNumber(`${BUNDLE_PREFIX}${userId}${TOTAL_KEY_SUFFIX}`) ?? 0;
}

export function clearCachedStressData(userId: string): void {
  storage.remove(`${BUNDLE_PREFIX}${userId}`);
  storage.remove(`${BUNDLE_PREFIX}${userId}${TOTAL_KEY_SUFFIX}`);
}

export function clearAll(): void {
  storage.clearAll();
}
