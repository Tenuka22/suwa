"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DoctorAvailabilityChart({
  data,
}: {
  data: { day: string; hours: number }[];
}) {
  const chartData = data.map((d, i) => ({
    ...d,
    day: DAYS[i] ?? d.day,
  }));

  return (
    <div className="h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        height={300}
        margin={{ left: 8, right: 8, top: 20 }}
        width="100%"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="day"
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          axisLine={false}
          tickFormatter={(value: number) => `${value}h`}
          tickLine={false}
          tickMargin={10}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!(active && payload?.length)) {
              return null;
            }
            return (
              <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                <p className="text-sm">{`${Number(payload[0]?.value).toFixed(1)} hours`}</p>
              </div>
            );
          }}
          cursor={false}
        />
        <Bar
          dataKey="hours"
          fill="var(--primary)"
          fillOpacity={0.2}
          radius={[6, 6, 0, 0]}
          stroke="var(--primary)"
          strokeWidth={2}
        >
          <LabelList
            dataKey="hours"
            fill="var(--primary)"
            fontSize={11}
            offset={4}
            position="top"
          />
        </Bar>
      </BarChart>
    </div>
  );
}
