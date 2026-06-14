'use client';

import { AlertTriangle, Brain, TrendingDown } from "lucide-react-native";

export interface StoredPrediction {
  predictedClass: string;
  probabilities: number[];
  sampleCount?: number;
  timestamp?: number;
  windowStart?: number;
}

export interface RawSample {
  sample: number[];
  timestamp: number;
}

export interface StressBundle {
  bundleId?: string;
  createdAt: number;
  prediction: StoredPrediction | null;
  samples: RawSample[];
}

export interface StressData {
  bundles: StressBundle[];
  fetchedAt?: number;
  totalSamples: number;
}

export const CLASS_LABELS = ["Baseline", "Amusement", "Stress"] as const;
export const CLASS_COLORS = ["#3b82f6", "#22c55e", "#ef4444"] as const;

export function statusFromPrediction(predictedClass: string): {
  label: string;
  color: string;
  bg: string;
  icon: typeof Brain;
} {
  switch (predictedClass.toLowerCase()) {
    case "stress":
      return {
        label: "High Stress",
        color: "text-destructive",
        bg: "bg-destructive/15",
        icon: AlertTriangle,
      };
    case "amusement":
      return {
        label: "Relaxed",
        color: "text-success",
        bg: "bg-success/15",
        icon: TrendingDown,
      };
    default:
      return {
        label: "Baseline",
        color: "text-primary",
        bg: "bg-primary/15",
        icon: Brain,
      };
  }
}

export function classIndex(predictedClass: string): number {
  return Math.max(
    0,
    CLASS_LABELS.findIndex(
      (l) => l.toLowerCase() === predictedClass.toLowerCase()
    )
  );
}

export function formatStressTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) {
    return "just now";
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatStressDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export interface StressEmergence {
  firstStressAgo: string;
  firstStressAt: number;
  stressEpisodeActive: boolean;
  stressEpisodeDuration: number;
  stressPeriodCount: number;
  totalStressBundles: number;
}

export function computeStressEmergence(
  bundles: StressBundle[]
): StressEmergence | null {
  const stressBundles = bundles.filter(
    (b) => b.prediction?.predictedClass.toLowerCase() === "stress"
  );
  if (stressBundles.length === 0) {
    return null;
  }

  const firstStress = stressBundles[0];
  const lastBundle = bundles[bundles.length - 1];
  const inStress =
    lastBundle.prediction?.predictedClass.toLowerCase() === "stress";

  let episodeDuration = 0;
  if (inStress) {
    let periodStart = lastBundle.createdAt;
    for (let i = bundles.length - 2; i >= 0; i--) {
      if (bundles[i].prediction?.predictedClass.toLowerCase() === "stress") {
        periodStart = bundles[i].createdAt;
      } else {
        break;
      }
    }
    episodeDuration = Math.round((lastBundle.createdAt - periodStart) / 60_000);
  }

  let periodCount = 0;
  let inPeriod = false;
  for (const b of bundles) {
    const isStress = b.prediction?.predictedClass.toLowerCase() === "stress";
    if (isStress && !inPeriod) {
      periodCount++;
      inPeriod = true;
    } else if (!isStress && inPeriod) {
      inPeriod = false;
    }
  }

  return {
    firstStressAt: firstStress.createdAt,
    firstStressAgo: formatStressTime(firstStress.createdAt),
    stressEpisodeActive: inStress,
    stressEpisodeDuration: episodeDuration,
    totalStressBundles: stressBundles.length,
    stressPeriodCount: periodCount,
  };
}

export interface Insights {
  averageConfidence: number;
  currentStreak: number;
  dominantLabel: string;
  dominantState: number;
  sessionMinutes: number;
  stateCounts: [number, number, number];
  streakColor: string;
  streakLabel: string;
  stressRatio: number;
  trendDirection: "up" | "down" | "stable";
  trendLabel: string;
}

export function computeInsights(bundles: StressBundle[]): Insights | null {
  const withPrediction = bundles.filter((b) => b.prediction);
  if (withPrediction.length === 0) {
    return null;
  }

  const counts: [number, number, number] = [0, 0, 0];
  let totalConfidence = 0;

  for (const b of withPrediction) {
    const idx = classIndex(b.prediction!.predictedClass);
    counts[idx]++;
    totalConfidence += b.prediction!.probabilities[idx] ?? 0;
  }

  const dominantState = counts.indexOf(Math.max(...counts));
  const stressRatio =
    withPrediction.length > 0 ? (counts[2] / withPrediction.length) * 100 : 0;

  let streak = 1;
  for (let i = withPrediction.length - 2; i >= 0; i--) {
    if (
      withPrediction[i].prediction!.predictedClass.toLowerCase() ===
      withPrediction[i + 1].prediction!.predictedClass.toLowerCase()
    ) {
      streak++;
    } else {
      break;
    }
  }

  const lastIdx = classIndex(
    withPrediction[withPrediction.length - 1].prediction!.predictedClass
  );
  const streakColor = CLASS_COLORS[lastIdx];

  const recent = withPrediction.slice(-6);
  const recentStress = recent.filter(
    (b) => b.prediction!.predictedClass.toLowerCase() === "stress"
  ).length;
  const earlier = withPrediction.slice(-12, -6);
  const earlierStress = earlier.filter(
    (b) => b.prediction!.predictedClass.toLowerCase() === "stress"
  ).length;

  const trendDirection =
    recentStress > earlierStress + 1
      ? "up"
      : recentStress < earlierStress - 1
        ? "down"
        : "stable";

  const sessionMinutes =
    bundles.length > 1
      ? Math.round(
          (bundles[bundles.length - 1].createdAt - bundles[0].createdAt) /
            60_000
        )
      : 0;

  return {
    stateCounts: counts,
    dominantState,
    dominantLabel: CLASS_LABELS[dominantState],
    stressRatio: Math.round(stressRatio),
    currentStreak: streak,
    streakLabel: CLASS_LABELS[lastIdx],
    streakColor,
    trendDirection,
    trendLabel:
      trendDirection === "up"
        ? "Stress up"
        : trendDirection === "down"
          ? "Stress down"
          : "Stable",
    averageConfidence: Math.round(
      (totalConfidence / withPrediction.length) * 100
    ),
    sessionMinutes,
  };
}
