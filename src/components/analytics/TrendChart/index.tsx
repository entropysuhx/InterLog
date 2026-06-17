"use client";

import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendChartProps = {
  data: { date: string; seconds: number }[];
  period?: "weekly" | "monthly";
};

export default function TrendChart({ data, period = "weekly" }: TrendChartProps) {
  const chartData = data.map((item) => ({
    day: format(new Date(item.date), period === "weekly" ? "EEE" : "d MMM"),
    hours: Number((item.seconds / 3600).toFixed(1)),
  }));
  return (
    <div className="mt-ds-20 h-panel-sm" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="var(--ds-border)" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="var(--ds-text-muted)"
            fontSize={12}
            interval={period === "weekly" ? 0 : 4}
          />
          <YAxis stroke="var(--ds-text-muted)" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "var(--ds-surface-elevated)",
              border: "1px solid var(--ds-border)",
              borderRadius: "var(--radius-lg)",
            }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="var(--ds-interactive-primary)"
            strokeWidth={2}
            dot={{ fill: "var(--ds-interactive-primary)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
