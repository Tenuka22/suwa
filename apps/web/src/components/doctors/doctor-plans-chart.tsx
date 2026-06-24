"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

export function DoctorPlansChart({
  data,
  metric,
  title,
}: {
  data: { name: string; value: number }[];
  metric: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-foreground/60 text-xs">{title}</p>
      <div className="h-[180px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          height={180}
          margin={{ left: 0, right: 0, top: 8 }}
          width="100%"
        >
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="name"
            tick={{
              fill: "var(--foreground)",
              fontSize: 10,
              opacity: 0.6,
            }}
            tickLine={false}
            tickMargin={6}
          />
          <YAxis axisLine={false} tick={false} tickLine={false} width={0} />
          <Tooltip
            content={({ active, payload }) => {
              if (!(active && payload?.length)) {
                return null;
              }
              const val = payload[0]?.value;
              return (
                <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                  <p className="text-sm">{`${val} ${metric}`}</p>
                </div>
              );
            }}
            cursor={false}
          />
          <Bar
            dataKey="value"
            fill="var(--primary)"
            fillOpacity={0.25}
            radius={[4, 4, 0, 0]}
            stroke="var(--primary)"
            strokeWidth={1.5}
          />
        </BarChart>
      </div>
    </div>
  );
}
