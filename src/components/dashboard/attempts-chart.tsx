"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function AttemptsChart({ data }: { data: { attempt: number; percentage: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-center text-muted-foreground">
        Play a practice quiz to see your progress here!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-surface-muted)" />
        <XAxis dataKey="attempt" tick={{ fontSize: 12 }} label={{ value: "Attempt", position: "insideBottom", offset: -2, fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "2px solid var(--color-border)" }}
          formatter={(value) => [`${value}%`, "Score"]}
          labelFormatter={(label) => `Attempt ${label}`}
        />
        <Area
          type="monotone"
          dataKey="percentage"
          stroke="var(--color-primary-600)"
          strokeWidth={3}
          fill="url(#scoreFill)"
          dot={{ r: 4, fill: "var(--color-primary-600)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
