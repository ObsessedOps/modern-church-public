"use client";

import {
  Users, TrendingDown, Search, Heart, PartyPopper,
  Lightbulb, Sparkles, MessageCircle,
} from "lucide-react";

type InsightItem = {
  id: string;
  type: string;
  source: string;
  priority: string;
  title: string;
  body: string;
  suggestion: string | null;
  isResolved: boolean;
  createdAt: string;
  author: { name: string; role: string } | null;
  readAt: string | null;
  reaction: string | null;
};

const typeConfig: Record<string, { Icon: typeof Users; color: string; bg: string; label: string }> = {
  STAFFING_GAP: { Icon: Users, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-600/10", label: "Staffing" },
  TREND_ALERT: { Icon: TrendingDown, color: "text-red-600 dark:text-red-400", bg: "bg-red-600/10", label: "Trend" },
  PATTERN_DETECTED: { Icon: Search, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-600/10", label: "Pattern" },
  MEMBER_CARE: { Icon: Heart, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-600/10", label: "Care" },
  CELEBRATION: { Icon: PartyPopper, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-600/10", label: "Win" },
  RECOMMENDATION: { Icon: Lightbulb, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-600/10", label: "Action" },
};

const priorityStyles: Record<string, string> = {
  FYI: "bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-dark-300",
  IMPORTANT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function InsightCard({ insight, compact = false, onClick }: {
  insight: InsightItem;
  compact?: boolean;
  onClick?: (insight: InsightItem) => void;
}) {
  const config = typeConfig[insight.type] ?? { Icon: Lightbulb, color: "text-slate-600", bg: "bg-slate-100", label: insight.type };
  const { Icon } = config;
  const isUnread = !insight.readAt;

  return (
    <button
      onClick={() => onClick?.(insight)}
      className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md ${
        isUnread
          ? "border-primary-200 bg-primary-50/30 dark:border-primary-900/30 dark:bg-primary-900/10"
          : "border-slate-200 bg-white dark:border-dark-600 dark:bg-dark-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${priorityStyles[insight.priority]}`}>
              {insight.priority}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-dark-400">{timeAgo(insight.createdAt)}</span>
            {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-dark-100 line-clamp-1">
            {insight.title}
          </p>
          {!compact && (
            <p className="mt-1 text-xs text-slate-500 dark:text-dark-400 line-clamp-2">
              {insight.body}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 dark:text-dark-400">
            {insight.source === "AI_GENERATED" ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Grace AI
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {insight.author?.name ?? "Leader"}
              </span>
            )}
            {insight.reaction && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-dark-700">
                {insight.reaction === "on-it" ? "On it" : insight.reaction === "thanks" ? "Thanks" : "Noted"}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
