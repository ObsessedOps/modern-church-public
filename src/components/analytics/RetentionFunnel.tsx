"use client";

import { Filter, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStage {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

const FUNNEL_STAGES: FunnelStage[] = [
  { label: "Visited", count: 142, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500" },
  { label: "Returned (2+ visits)", count: 68, color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-500" },
  { label: "Joined a Group", count: 34, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500" },
  { label: "Started Serving", count: 18, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500" },
  { label: "Became a Member", count: 12, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-500" },
];

const maxCount = FUNNEL_STAGES[0].count;

// Quarterly cohort data for the comparison table
const COHORT_DATA = [
  { cohort: "Q1 2025", visited: 38, returned: 16, grouped: 7, serving: 3, member: 2 },
  { cohort: "Q2 2025", visited: 42, returned: 20, grouped: 10, serving: 5, member: 4 },
  { cohort: "Q3 2025", visited: 30, returned: 14, grouped: 8, serving: 4, member: 3 },
  { cohort: "Q4 2025", visited: 32, returned: 18, grouped: 9, serving: 6, member: 3 },
];

export function RetentionFunnel() {
  const overallConversion = Math.round((FUNNEL_STAGES[FUNNEL_STAGES.length - 1].count / FUNNEL_STAGES[0].count) * 100);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Visitor → Member Funnel
          </h3>
        </div>
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
          {overallConversion}% conversion
        </span>
      </div>

      {/* Funnel Bars */}
      <div className="space-y-2.5">
        {FUNNEL_STAGES.map((stage, i) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 8);
          const dropoff = i > 0
            ? Math.round(((FUNNEL_STAGES[i - 1].count - stage.count) / FUNNEL_STAGES[i - 1].count) * 100)
            : null;
          return (
            <div key={stage.label}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", stage.color)}>{stage.label}</span>
                  {dropoff !== null && (
                    <span className="text-[10px] text-slate-400 dark:text-dark-400">
                      -{dropoff}% drop-off
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-dark-50">{stage.count}</span>
              </div>
              <div className="h-7 rounded-lg bg-slate-100 dark:bg-dark-600">
                <div
                  className={cn("flex h-7 items-center justify-end rounded-lg pr-2 transition-all duration-700", stage.bgColor)}
                  style={{ width: `${widthPct}%`, opacity: 0.85 }}
                >
                  {widthPct > 15 && (
                    <span className="text-[10px] font-bold text-white">
                      {Math.round((stage.count / maxCount) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chevron flow indicator */}
      <div className="mt-4 flex items-center justify-center gap-1 text-slate-300 dark:text-dark-500">
        {FUNNEL_STAGES.map((stage, i) => (
          <div key={stage.label} className="flex items-center">
            <div className={cn("h-2 w-2 rounded-full", stage.bgColor)} />
            {i < FUNNEL_STAGES.length - 1 && <ChevronRight className="h-3 w-3" />}
          </div>
        ))}
      </div>

      {/* Quarterly Cohort Table */}
      <div className="mt-5">
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
          Cohort Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-600">
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  Cohort
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                  Visited
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                  Returned
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                  Grouped
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                  Serving
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-rose-500">
                  Member
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
              {COHORT_DATA.map((row) => {
                const convRate = Math.round((row.member / row.visited) * 100);
                return (
                  <tr key={row.cohort} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                    <td className="px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-dark-200">
                      {row.cohort}
                    </td>
                    <td className="px-2 py-1.5 text-center text-xs text-slate-600 dark:text-dark-200">{row.visited}</td>
                    <td className="px-2 py-1.5 text-center text-xs text-slate-600 dark:text-dark-200">
                      {row.returned}
                      <span className="ml-0.5 text-[9px] text-slate-400">
                        ({Math.round((row.returned / row.visited) * 100)}%)
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center text-xs text-slate-600 dark:text-dark-200">
                      {row.grouped}
                    </td>
                    <td className="px-2 py-1.5 text-center text-xs text-slate-600 dark:text-dark-200">
                      {row.serving}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={cn(
                        "text-xs font-semibold",
                        convRate >= 8 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-dark-200"
                      )}>
                        {row.member}
                        <span className="ml-0.5 text-[9px]">({convRate}%)</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
