"use client";

import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const mockInsights = [
  {
    icon: TrendingUp,
    text: "Weekend attendance up 3.2% across all campuses. Downtown led with 47 more attendees.",
    color: "text-emerald-500",
  },
  {
    icon: AlertTriangle,
    text: "23 members showing early disengagement \u2014 attendance and giving both declining.",
    color: "text-amber-500",
  },
  {
    icon: CheckCircle2,
    text: "Easter prep 78% complete. Westside Kids needs 3 more volunteers for the egg hunt.",
    color: "text-violet-500",
  },
];

export function GraceInsightCard() {
  return (
    <div className="card relative overflow-hidden border border-violet-500/20">
      {/* Purple gradient accent at top */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 to-purple-500" />

      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 dark:bg-violet-500/20">
          <Sparkles className="h-4 w-4 text-violet-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Insights
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-dark-300">
            Updated 2 hours ago
          </p>
        </div>
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {mockInsights.map((insight, i) => {
          const InsightIcon = insight.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-dark-500 dark:hover:bg-dark-600"
            >
              <InsightIcon
                className={`mt-0.5 h-4 w-4 shrink-0 ${insight.color}`}
              />
              <p className="text-xs leading-relaxed text-slate-700 dark:text-dark-100">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <Link
        href="/grace"
        className="btn btn-soft mt-4 w-full gap-2 text-xs"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Ask Grace
      </Link>
    </div>
  );
}
