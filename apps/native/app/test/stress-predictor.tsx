"use client";

import { useState } from "react";
import { Text, View, type ViewStyle } from "react-native";

import { Button } from "@/components/design/ui/button";
import { Card } from "@/components/design/ui/card";
import { Screen } from "@/components/design/ui/screen";
import { orpc } from "@/utils/orpc";
import type { TestSequence } from "@/utils/test-sequences";
import { TEST_SEQUENCES } from "@/utils/test-sequences";

const CLASS_LABELS = ["Baseline", "Amusement", "Stress"];

const CHART_HEIGHT = 24;
const BAR_WIDTH = 2;

function MiniChart({ samples }: { samples: number[][] }) {
  const features = [
    { key: 6, label: "HR", color: "#ef4444" },
    { key: 2, label: "SDRR", color: "#3b82f6" },
    { key: 7, label: "pNN25", color: "#22c55e" },
  ];

  const step = Math.max(1, Math.floor(360 / 60));

  return (
    <View className="gap-1 pt-1">
      <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-[0.12em]">
        Signal ({360} pts)
      </Text>
      <View className="gap-1">
        {features.map(({ key, label, color }) => {
          const vals: number[] = [];
          for (let i = 0; i < 360; i += step) {
            vals.push(samples[i][key]);
          }
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          const range = max - min || 1;

          return (
            <View className="flex-row items-center gap-1.5" key={key}>
              <Text className="w-9 text-right font-mono text-[9px] text-muted-foreground">
                {label}
              </Text>
              <View
                className="flex-row items-end"
                style={{ height: CHART_HEIGHT, flex: 1 }}
              >
                {vals.map((v, i) => {
                  const pct = (v - min) / range;
                  const barH = Math.max(Math.round(pct * CHART_HEIGHT), 1);
                  return (
                    <View
                      key={i}
                      style={{
                        width: BAR_WIDTH,
                        height: barH,
                        marginRight: 1,
                        backgroundColor: color,
                        opacity: 0.5 + pct * 0.5,
                        borderTopLeftRadius: 1,
                        borderTopRightRadius: 1,
                      }}
                    />
                  );
                })}
              </View>
              <Text className="w-9 text-right font-mono text-[9px] text-muted-foreground">
                {vals[0].toFixed(1)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CheckBadge({ correct }: { correct: boolean }) {
  return (
    <View
      className={`rounded-full px-2 py-0.5 ${correct ? "bg-success" : "bg-destructive"}`}
    >
      <Text className="font-bold font-sans text-[10px] text-success-foreground">
        {correct ? "✓" : "✗"}
      </Text>
    </View>
  );
}

function ProbabilityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Text className="w-16 text-right font-sans text-[10px] text-muted-foreground">
        {label}
      </Text>
      <View className="h-2 flex-1 overflow-hidden rounded-full bg-muted/30">
        <View
          className="h-full rounded-full"
          style={
            {
              width: `${(value * 100).toFixed(0)}%` as const,
              backgroundColor: color,
            } as ViewStyle
          }
        />
      </View>
      <Text className="w-10 text-right font-mono text-[10px] text-muted-foreground">
        {(value * 100).toFixed(1)}%
      </Text>
    </View>
  );
}

function ResultCard({
  title,
  prediction,
  probabilities,
  expected,
  time,
}: {
  title: string;
  prediction: string;
  probabilities: number[];
  expected?: string;
  time?: number;
}) {
  const idx = CLASS_LABELS.map((l) => l.toLowerCase()).indexOf(
    prediction.toLowerCase()
  );
  const barColors = ["#3b82f6", "#22c55e", "#ef4444"];
  const correct = expected
    ? prediction.toLowerCase() === expected.toLowerCase()
    : undefined;

  return (
    <Card
      className={`gap-2 ${title === "Combined" ? "border-primary/20 bg-muted" : ""}`}
    >
      {expected && correct !== undefined && (
        <View className="flex-row items-center justify-between">
          <Text className="font-bold font-sans text-foreground text-xs">
            Expected:{" "}
            <Text className={correct ? "text-success" : "text-destructive"}>
              {expected}
            </Text>
          </Text>
          <CheckBadge correct={correct} />
        </View>
      )}
      <View className="flex-row items-center justify-between">
        <Text
          className={`font-bold font-sans ${title === "Combined" ? "text-base text-foreground" : "text-foreground text-sm"}`}
        >
          {title}
        </Text>
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: idx >= 0 ? `${barColors[idx]}22` : "#666" }}
        >
          <Text
            className="font-bold font-sans text-xs"
            style={{ color: idx >= 0 ? barColors[idx] : "#666" }}
          >
            {prediction}
          </Text>
        </View>
      </View>
      {probabilities.map((prob, i) => (
        <ProbabilityBar
          color={barColors[i]}
          key={CLASS_LABELS[i]}
          label={CLASS_LABELS[i]}
          value={prob}
        />
      ))}
      {time !== undefined && (
        <Text className="font-sans text-[10px] text-muted-foreground">
          {time}ms
        </Text>
      )}
    </Card>
  );
}

function expectedColor(expected: string): string {
  if (expected === "stress") {
    return "text-destructive";
  }
  if (expected === "amusement") {
    return "text-success";
  }
  return "text-primary";
}

function buttonLabel(isPredicting: boolean, hasResult: boolean): string {
  if (isPredicting) {
    return "Predicting...";
  }
  if (hasResult) {
    return "Re-run";
  }
  return "Predict";
}

type PredictionResponse = Record<
  string,
  { prediction: string; probabilities: number[] }
>;

export default function StressPredictorScreen() {
  const [results, setResults] = useState<
    Record<string, { result: PredictionResponse; time: number } | null>
  >({});
  const [predictingId, setPredictingId] = useState<string | null>(null);

  const doPredict = async (seq: TestSequence, idx: number) => {
    const key = `${seq.name}-${idx}`;
    setPredictingId(key);
    const startTime = Date.now();
    try {
      const result = (await orpc.predictStress.call({
        windowSamples: seq.samples,
      })) as unknown as PredictionResponse;
      setResults((prev) => ({
        ...prev,
        [key]: { result, time: Date.now() - startTime },
      }));
    } finally {
      setPredictingId(null);
    }
  };

  return (
    <Screen contentClassName="gap-section px-page py-page bg-background">
      <View className="mb-2 gap-1.5">
        <Text className="font-bold font-sans text-primary text-xs uppercase tracking-[0.25em]">
          Stress Predictor
        </Text>
        <Text className="font-black font-sans text-3xl text-foreground tracking-tight">
          WESAD Tests
        </Text>
        <Text className="font-normal font-sans text-muted-foreground text-sm leading-5">
          {TEST_SEQUENCES.length} sequences (
          {TEST_SEQUENCES.filter((s) => s.expected === "baseline").length}B /{" "}
          {TEST_SEQUENCES.filter((s) => s.expected === "amusement").length}A /{" "}
          {TEST_SEQUENCES.filter((s) => s.expected === "stress").length}S)
        </Text>
      </View>

      {TEST_SEQUENCES.map((seq, idx) => {
        const key = `${seq.name}-${idx}`;
        const scenarioResult = results[key];
        const isPredicting = predictingId === key;
        const allMatch = scenarioResult?.result
          ? ["0", "120", "240", "360"].every((k) => {
              const data = scenarioResult.result[k];
              return (
                data &&
                data.prediction.toLowerCase() === seq.expected.toLowerCase()
              );
            })
          : false;

        return (
          <View key={key}>
            <Card className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold font-sans text-foreground text-sm">
                    {seq.name}
                  </Text>
                  {scenarioResult?.result && <CheckBadge correct={allMatch} />}
                </View>
                <Text
                  className={`font-bold font-sans text-xs ${expectedColor(seq.expected)}`}
                >
                  {seq.expected}
                </Text>
              </View>

              <Button
                className="w-full"
                disabled={isPredicting}
                onPress={() => doPredict(seq, idx)}
                size="sm"
              >
                {buttonLabel(isPredicting, !!scenarioResult?.result)}
              </Button>

              <MiniChart samples={seq.samples} />
            </Card>

            {scenarioResult?.result && (
              <View className="ml-3 gap-2">
                {scenarioResult.result["0"] && (
                  <ResultCard
                    expected={seq.expected}
                    prediction={scenarioResult.result["0"].prediction}
                    probabilities={scenarioResult.result["0"].probabilities}
                    time={scenarioResult.time}
                    title="Combined"
                  />
                )}
                {([120, 240, 360] as const).map((len) => {
                  const data = scenarioResult.result[String(len)];
                  if (!data) {
                    return null;
                  }
                  return (
                    <ResultCard
                      expected={seq.expected}
                      key={len}
                      prediction={data.prediction}
                      probabilities={data.probabilities}
                      title={`${len}w`}
                    />
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </Screen>
  );
}
