"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar } from "lucide-react";

// Simulated year-over-year weekly attendance (same week range, two years)
const YOY_DATA = [
  { week: "Jan 5", thisYear: 412, lastYear: 365 },
  { week: "Jan 12", thisYear: 425, lastYear: 372 },
  { week: "Jan 19", thisYear: 418, lastYear: 380 },
  { week: "Jan 26", thisYear: 430, lastYear: 378 },
  { week: "Feb 2", thisYear: 445, lastYear: 385 },
  { week: "Feb 9", thisYear: 438, lastYear: 390 },
  { week: "Feb 16", thisYear: 452, lastYear: 388 },
  { week: "Feb 23", thisYear: 460, lastYear: 395 },
  { week: "Mar 2", thisYear: 468, lastYear: 392 },
  { week: "Mar 9", thisYear: 475, lastYear: 398 },
  { week: "Mar 16", thisYear: 482, lastYear: 402 },
  { week: "Mar 23", thisYear: 490, lastYear: 408 },
];

export function YoYAttendanceChart() {
  const latest = YOY_DATA[YOY_DATA.length - 1];
  const growthPct = Math.round(((latest.thisYear - latest.lastYear) / latest.lastYear) * 100);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Year-over-Year Attendance
          </h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          +{growthPct}% vs last year
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={YOY_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="yoyThisYear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="yoyLastYear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
            contentStyle={{
              backgroundColor: "rgba(30,31,35,0.95)",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value: unknown, name: unknown) => [
              Number(value).toLocaleString(),
              String(name) === "thisYear" ? "2026" : "2025",
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (value === "thisYear" ? "2026" : "2025")}
            wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="lastYear"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="url(#yoyLastYear)"
          />
          <Area
            type="monotone"
            dataKey="thisYear"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="url(#yoyThisYear)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
