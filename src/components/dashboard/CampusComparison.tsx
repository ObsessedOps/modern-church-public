"use client";

import { Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CampusRow {
  name: string;
  attendance: number;
  giving: number;
  volunteers: number;
  groups: number;
  trend: "up" | "flat" | "down";
}

// Mock data for initial build — will be replaced with real queries
const mockCampuses: CampusRow[] = [
  { name: "Downtown", attendance: 1240, giving: 28500, volunteers: 85, groups: 24, trend: "up" },
  { name: "Westside", attendance: 890, giving: 19200, volunteers: 62, groups: 18, trend: "up" },
  { name: "North Campus", attendance: 650, giving: 14800, volunteers: 41, groups: 12, trend: "flat" },
  { name: "Online", attendance: 420, giving: 8900, volunteers: 15, groups: 8, trend: "down" },
];

function TrendIcon({ trend }: { trend: CampusRow["trend"] }) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-rose-500" />;
    default:
      return <Minus className="h-4 w-4 text-slate-400" />;
  }
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

export function CampusComparison() {
  const campuses = mockCampuses;

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/20">
          <Building2 className="h-4 w-4 text-sky-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
          Campus Comparison
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-dark-500">
              <th className="pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-dark-300">
                Campus
              </th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-dark-300">
                Attendance
              </th>
              <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-dark-300">
                Giving
              </th>
              <th className="hidden pb-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-dark-300 sm:table-cell">
                Volunteers
              </th>
              <th className="hidden pb-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-dark-300 sm:table-cell">
                Groups
              </th>
              <th className="pb-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-dark-300">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {campuses.map((campus) => (
              <tr
                key={campus.name}
                className="border-b border-slate-50 last:border-b-0 cursor-pointer transition-colors hover:bg-slate-50 dark:border-dark-600 dark:hover:bg-dark-700"
              >
                <td className="py-2.5 text-xs font-medium text-slate-800 dark:text-dark-100">
                  {campus.name}
                </td>
                <td className="py-2.5 text-right font-mono text-xs text-slate-700 dark:text-dark-200">
                  {campus.attendance.toLocaleString()}
                </td>
                <td className="py-2.5 text-right font-mono text-xs text-slate-700 dark:text-dark-200">
                  {formatCurrency(campus.giving)}
                </td>
                <td className="hidden py-2.5 text-right font-mono text-xs text-slate-700 dark:text-dark-200 sm:table-cell">
                  {campus.volunteers}
                </td>
                <td className="hidden py-2.5 text-right font-mono text-xs text-slate-700 dark:text-dark-200 sm:table-cell">
                  {campus.groups}
                </td>
                <td className="py-2.5 text-center">
                  <div className="flex justify-center">
                    <TrendIcon trend={campus.trend} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals row */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-dark-500">
        <span className="text-xs font-semibold text-slate-700 dark:text-dark-100">
          All Campuses
        </span>
        <div className="flex gap-6">
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-dark-50">
            {campuses.reduce((sum, c) => sum + c.attendance, 0).toLocaleString()} total
          </span>
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(campuses.reduce((sum, c) => sum + c.giving, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
