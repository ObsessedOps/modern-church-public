"use client";

import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MomentumData {
  attendanceTrend: number; // % change over 90 days
  givingTrend: number;
  groupTrend: number;
  volunteerTrend: number;
  overallScore: number; // 0-100
}

// Simulated 90-day momentum data (would come from real analytics in production)
const MOCK_MOMENTUM: MomentumData = {
  attendanceTrend: 11.2,
  givingTrend: 8.4,
  groupTrend: 15.0,
  volunteerTrend: -2.3,
  overallScore: 78,
};

// 12-week sparkline data (simulated weekly engagement scores)
const SPARKLINE_DATA = [62, 65, 63, 68, 70, 67, 72, 74, 71, 76, 78, 78];

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (value < 0) return <TrendingDown className="h-3 w-3 text-rose-500" />;
  return <Minus className="h-3 w-3 text-slate-400" />;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 160;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparklineGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="rgb(139,92,246)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill="rgb(139,92,246)"
      />
    </svg>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";
  const strokeColor =
    score >= 75 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-rose-500";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Steady" : "Declining";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-slate-100 dark:text-dark-600"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-1000", strokeColor)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-lg font-bold", color)}>{score}</span>
        </div>
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", color)}>
        {label}
      </span>
    </div>
  );
}

const metrics = [
  { label: "Attendance", key: "attendanceTrend" as const },
  { label: "Giving", key: "givingTrend" as const },
  { label: "Groups", key: "groupTrend" as const },
  { label: "Volunteers", key: "volunteerTrend" as const },
];

export function EngagementMomentum() {
  const data = MOCK_MOMENTUM;

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
          Engagement Momentum
        </h3>
        <span className="ml-auto text-[10px] font-medium text-slate-400 dark:text-dark-400">
          90-day trend
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge */}
        <ScoreGauge score={data.overallScore} />

        {/* Sparkline + Metrics */}
        <div className="min-w-0 flex-1">
          <Sparkline data={SPARKLINE_DATA} />

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {metrics.map((m) => {
              const value = data[m.key];
              return (
                <div key={m.key} className="flex items-center gap-1.5">
                  <TrendIcon value={value} />
                  <span className="text-[11px] text-slate-600 dark:text-dark-200">
                    {m.label}
                  </span>
                  <span
                    className={cn(
                      "ml-auto text-[11px] font-semibold",
                      value > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : value < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-500"
                    )}
                  >
                    {value > 0 ? "+" : ""}
                    {value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
