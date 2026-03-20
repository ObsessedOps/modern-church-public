"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightbulb, ChevronRight, Users, TrendingDown, Search,
  Heart, PartyPopper, Sparkles, MessageCircle,
} from "lucide-react";

type InsightItem = {
  id: string;
  type: string;
  source: string;
  priority: string;
  title: string;
  body: string;
  createdAt: string;
  author: { name: string; role: string } | null;
  readAt: string | null;
};

const typeConfig: Record<string, { Icon: typeof Users; color: string; bg: string }> = {
  STAFFING_GAP: { Icon: Users, color: "text-orange-600", bg: "bg-orange-600/10" },
  TREND_ALERT: { Icon: TrendingDown, color: "text-red-600", bg: "bg-red-600/10" },
  PATTERN_DETECTED: { Icon: Search, color: "text-violet-600", bg: "bg-violet-600/10" },
  MEMBER_CARE: { Icon: Heart, color: "text-pink-600", bg: "bg-pink-600/10" },
  CELEBRATION: { Icon: PartyPopper, color: "text-emerald-600", bg: "bg-emerald-600/10" },
  RECOMMENDATION: { Icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-600/10" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function InsightsFeed() {
  const [insights, setInsights] = useState<InsightItem[]>([]);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setInsights(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-dark-600 dark:bg-dark-800">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-dark-700">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-100">Latest Insights</h3>
        </div>
        <Link
          href="/insights"
          className="flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-dark-700">
        {insights.map((insight) => {
          const config = typeConfig[insight.type] ?? { Icon: Lightbulb, color: "text-slate-600", bg: "bg-slate-100" };
          const { Icon } = config;
          const isUnread = !insight.readAt;

          return (
            <Link
              key={insight.id}
              href="/insights"
              className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-dark-700/50 dark:active:bg-dark-700"
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-medium line-clamp-1 ${
                    isUnread ? "text-slate-800 dark:text-dark-100" : "text-slate-600 dark:text-dark-300"
                  }`}>
                    {insight.title}
                  </p>
                  {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 dark:text-dark-400">
                  {insight.source === "AI_GENERATED" ? (
                    <span className="flex items-center gap-0.5"><Sparkles className="h-2.5 w-2.5" /> Grace AI</span>
                  ) : (
                    <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" /> {insight.author?.name}</span>
                  )}
                  <span>{timeAgo(insight.createdAt)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
