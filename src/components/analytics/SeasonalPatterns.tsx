"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Monthly averages over the past 2 years
const SEASONAL_DATA = [
  { month: "Jan", attendance: 395, giving: 48500, highlight: false },
  { month: "Feb", attendance: 388, giving: 46200, highlight: false },
  { month: "Mar", attendance: 420, giving: 49800, highlight: false },
  { month: "Apr", attendance: 485, giving: 58200, highlight: true }, // Easter
  { month: "May", attendance: 410, giving: 47300, highlight: false },
  { month: "Jun", attendance: 375, giving: 44800, highlight: false },
  { month: "Jul", attendance: 348, giving: 41200, highlight: false }, // Summer low
  { month: "Aug", attendance: 365, giving: 43600, highlight: false },
  { month: "Sep", attendance: 432, giving: 52100, highlight: true }, // Fall kickoff
  { month: "Oct", attendance: 425, giving: 50400, highlight: false },
  { month: "Nov", attendance: 415, giving: 49200, highlight: false },
  { month: "Dec", attendance: 465, giving: 62400, highlight: true }, // Christmas
];

const avgAttendance = Math.round(
  SEASONAL_DATA.reduce((s, d) => s + d.attendance, 0) / SEASONAL_DATA.length
);

const insights = [
  {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    text: "Easter and Christmas drive 15-25% attendance spikes. Plan connection events around these peaks.",
  },
  {
    icon: TrendingDown,
    color: "text-amber-600 dark:text-amber-400",
    text: "July is historically your lowest month (348 avg). Consider a summer series to maintain engagement.",
  },
  {
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    text: "September kickoff consistently brings a 24% jump. Launch groups and serving sign-ups in late August.",
  },
];

export function SeasonalPatterns() {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Seasonal Patterns
          </h3>
        </div>
        <span className="text-[10px] font-medium text-slate-400 dark:text-dark-400">
          2-year monthly averages
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={SEASONAL_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[300, "auto"]} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
            contentStyle={{
              backgroundColor: "rgba(30,31,35,0.95)",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value: unknown) => [Number(value).toLocaleString(), "Avg Attendance"]}
          />
          <Bar dataKey="attendance" radius={[4, 4, 0, 0]}>
            {SEASONAL_DATA.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.highlight
                    ? "#7C3AED"
                    : entry.attendance < avgAttendance
                      ? "#f59e0b"
                      : "#10b981"
                }
                fillOpacity={entry.highlight ? 0.9 : 0.65}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* AI-Powered Seasonal Insights */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-violet-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Grace AI Seasonal Insights
          </span>
        </div>
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-dark-600 dark:bg-dark-700/50">
              <Icon className={cn("mt-0.5 h-3 w-3 shrink-0", insight.color)} />
              <p className="text-xs leading-relaxed text-slate-600 dark:text-dark-200">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
