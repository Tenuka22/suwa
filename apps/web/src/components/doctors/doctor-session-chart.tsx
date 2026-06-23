"use client";

import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DoctorSessionChart({
  data,
}: {
  data: { month: string; total: number }[];
}) {
  return (
    <div className="h-[340px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        height={340}
        margin={{ left: 8, right: 8 }}
        width="100%"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="month"
          tickFormatter={(value: string) => {
            const [year, month] = value.split("-");
            const date = new Date(Number(year), Number(month) - 1);
            return format(date, "MMM");
          }}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          axisLine={false}
          tickFormatter={(value: number) => value.toString()}
          tickLine={false}
          tickMargin={10}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!(active && payload?.length)) {
              return null;
            }
            const val = Number(payload[0]?.value);
            return (
              <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                <p className="text-sm">{`${val} session${val === 1 ? "" : "s"}`}</p>
              </div>
            );
          }}
          cursor={false}
        />
        <Area
          dataKey="total"
          fill="var(--primary)"
          fillOpacity={0.15}
          stroke="var(--primary)"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </div>
  );
}
