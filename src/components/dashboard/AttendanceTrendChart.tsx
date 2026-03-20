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

interface AttendanceDataPoint {
  week: string;
  adultCount: number;
  childCount: number;
  onlineCount: number;
  totalCount: number;
}

interface AttendanceTrendChartProps {
  data: AttendanceDataPoint[];
}

function formatWeekLabel(week: string) {
  const d = new Date(week + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatWeekLabel(d.week),
    inPerson: d.adultCount + d.childCount,
    online: d.onlineCount,
  }));

  if (chartData.length === 0) {
    return (
      <div className="card flex h-[360px] items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-dark-300">
          No attendance data available yet
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
        Attendance Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="colorInPerson" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(148,163,184,0.1)"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(30,31,35,0.95)",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value: unknown, name: unknown) => [
              Number(value).toLocaleString(),
              String(name) === "inPerson" ? "In-Person" : "Online",
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) =>
              value === "inPerson" ? "In-Person" : "Online"
            }
            wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="inPerson"
            stackId="1"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="url(#colorInPerson)"
          />
          <Area
            type="monotone"
            dataKey="online"
            stackId="1"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorOnline)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
