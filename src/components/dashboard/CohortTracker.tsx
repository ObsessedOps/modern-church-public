"use client";

import { Users, ChevronRight, UserPlus, UsersRound, HandHeart, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface CohortStage {
  label: string;
  count: number;
  icon: typeof Users;
  color: string;
}

interface CohortMonth {
  label: string;
  stages: CohortStage[];
}

// Simulated cohort data — tracks visitor journey over time
const COHORT_DATA: CohortMonth[] = [
  {
    label: "Jan Visitors",
    stages: [
      { label: "Visited", count: 12, icon: UserPlus, color: "blue" },
      { label: "Returned", count: 8, icon: Users, color: "violet" },
      { label: "Joined Group", count: 5, icon: UsersRound, color: "emerald" },
      { label: "Serving", count: 2, icon: HandHeart, color: "amber" },
    ],
  },
  {
    label: "Feb Visitors",
    stages: [
      { label: "Visited", count: 14, icon: UserPlus, color: "blue" },
      { label: "Returned", count: 9, icon: Users, color: "violet" },
      { label: "Joined Group", count: 4, icon: UsersRound, color: "emerald" },
      { label: "Serving", count: 0, icon: HandHeart, color: "amber" },
    ],
  },
  {
    label: "Mar Visitors",
    stages: [
      { label: "Visited", count: 18, icon: UserPlus, color: "blue" },
      { label: "Returned", count: 6, icon: Users, color: "violet" },
      { label: "Joined Group", count: 0, icon: UsersRound, color: "emerald" },
      { label: "Serving", count: 0, icon: HandHeart, color: "amber" },
    ],
  },
];

const barColors: Record<string, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

const textColors: Record<string, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  violet: "text-violet-600 dark:text-violet-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
};

export function CohortTracker() {
  // Find the max count across all cohorts for bar scaling
  const maxCount = Math.max(...COHORT_DATA.flatMap((c) => c.stages.map((s) => s.count)));

  // Calculate overall conversion rate
  const totalVisited = COHORT_DATA.reduce((sum, c) => sum + c.stages[0].count, 0);
  const totalReturned = COHORT_DATA.reduce((sum, c) => sum + c.stages[1].count, 0);
  const conversionRate = totalVisited > 0 ? Math.round((totalReturned / totalVisited) * 100) : 0;

  return (
    <div className="card">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Visitor Journey Tracker
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 dark:text-dark-300">Retention rate</span>
          <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
            {conversionRate}%
          </span>
        </div>
      </div>
      <p className="mb-4 text-[11px] text-slate-500 dark:text-dark-300">
        How visitors progress from first visit to active participation
      </p>

      {/* Stage labels */}
      <div className="mb-2 grid grid-cols-4 gap-2">
        {COHORT_DATA[0].stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="flex items-center gap-1">
              <Icon className={cn("h-3 w-3", textColors[stage.color])} />
              <span className="text-[10px] font-medium text-slate-500 dark:text-dark-300">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cohort rows */}
      <div className="space-y-3">
        {COHORT_DATA.map((cohort) => (
          <div key={cohort.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-dark-100">
                {cohort.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-dark-400">
                {cohort.stages[0].count > 0
                  ? `${Math.round((cohort.stages[1].count / cohort.stages[0].count) * 100)}% returned`
                  : "—"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {cohort.stages.map((stage) => (
                <div key={stage.label} className="flex flex-col items-center gap-1">
                  <div className="h-6 w-full overflow-hidden rounded bg-slate-100 dark:bg-dark-600">
                    <div
                      className={cn(
                        "h-full rounded transition-all duration-700",
                        barColors[stage.color],
                        stage.count === 0 && "opacity-20"
                      )}
                      style={{
                        width: stage.count > 0 ? `${Math.max((stage.count / maxCount) * 100, 8)}%` : "100%",
                        opacity: stage.count === 0 ? 0.1 : undefined,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      stage.count > 0 ? textColors[stage.color] : "text-slate-300 dark:text-dark-500"
                    )}
                  >
                    {stage.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Funnel summary */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-violet-500/5 p-2.5">
        <Users className="h-3.5 w-3.5 shrink-0 text-violet-500" />
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-dark-200">
          <span className="font-semibold text-violet-600 dark:text-violet-400">
            {totalVisited} visitors
          </span>{" "}
          → {totalReturned} returned → {COHORT_DATA.reduce((s, c) => s + c.stages[2].count, 0)} joined
          groups → {COHORT_DATA.reduce((s, c) => s + c.stages[3].count, 0)} now serving
        </p>
      </div>
    </div>
  );
}
