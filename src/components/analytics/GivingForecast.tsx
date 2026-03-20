"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { TrendingUp, Target } from "lucide-react";

// Monthly giving totals (actual + forecast)
const GIVING_DATA = [
  { month: "Jan", actual: 48200, forecast: null },
  { month: "Feb", actual: 52100, forecast: null },
  { month: "Mar", actual: 49800, forecast: null },
  { month: "Apr", actual: null, forecast: 51400 },
  { month: "May", actual: null, forecast: 53200 },
  { month: "Jun", actual: null, forecast: 50800 },
  { month: "Jul", actual: null, forecast: 47200 },
  { month: "Aug", actual: null, forecast: 49600 },
  { month: "Sep", actual: null, forecast: 55400 },
  { month: "Oct", actual: null, forecast: 54200 },
  { month: "Nov", actual: null, forecast: 56800 },
  { month: "Dec", actual: null, forecast: 62400 },
];

const ytdActual = GIVING_DATA.filter((d) => d.actual !== null).reduce(
  (sum, d) => sum + (d.actual ?? 0),
  0
);
const forecastTotal =
  ytdActual +
  GIVING_DATA.filter((d) => d.forecast !== null).reduce(
    (sum, d) => sum + (d.forecast ?? 0),
    0
  );

function formatCurrency(val: number) {
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
}

export function GivingForecast() {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Giving Forecast
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="h-3 w-3 text-violet-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-dark-200">
            EOY: ${(forecastTotal / 1000).toFixed(0)}k projected
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={GIVING_DATA}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="forecastActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(148,163,184,0.1)"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
            contentStyle={{
              backgroundColor: "rgba(30,31,35,0.95)",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value: unknown, name: unknown) => {
              const val = Number(value);
              return [
                `$${val.toLocaleString()}`,
                String(name) === "actual" ? "Actual" : "Forecast",
              ];
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) =>
              value === "actual" ? "Actual" : "Forecast"
            }
            wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
          />
          <ReferenceLine
            x="Mar"
            stroke="rgba(148,163,184,0.3)"
            strokeDasharray="3 3"
            label={{
              value: "Today",
              position: "top",
              fill: "#94a3b8",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#forecastActual)"
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#7C3AED"
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#forecastProjected)"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-50 p-2.5 text-center dark:bg-emerald-900/10">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            ${(ytdActual / 1000).toFixed(0)}k
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
            YTD Actual
          </p>
        </div>
        <div className="rounded-lg bg-violet-50 p-2.5 text-center dark:bg-violet-900/10">
          <p className="text-xs font-bold text-violet-700 dark:text-violet-400">
            ${(forecastTotal / 1000).toFixed(0)}k
          </p>
          <p className="text-[10px] text-violet-600 dark:text-violet-500">
            EOY Projected
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 p-2.5 text-center dark:bg-amber-900/10">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
            Jul
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500">
            Lowest Month
          </p>
        </div>
      </div>
    </div>
  );
}
