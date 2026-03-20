"use client";

import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { AlertSeverity } from "@/generated/prisma/enums";

interface Alert {
  id: string;
  severity: AlertSeverity;
  headline: string;
  detectedAt: Date;
  dismissed: boolean;
}

interface AlertFeedProps {
  alerts: Alert[];
}

const severityColors: Record<string, { badge: string; dot: string }> = {
  CRITICAL: {
    badge: "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20",
    dot: "bg-rose-500",
  },
  HIGH: {
    badge: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20",
    dot: "bg-orange-500",
  },
  MEDIUM: {
    badge: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20",
    dot: "bg-amber-500",
  },
  LOW: {
    badge: "bg-sky-500/10 text-sky-500 dark:bg-sky-500/20",
    dot: "bg-sky-500",
  },
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  const displayed = alerts.slice(0, 5);

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/20">
            <Bell className="h-4 w-4 text-rose-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Active Alerts
          </h3>
        </div>
        {alerts.length > 0 && (
          <span className="badge bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
            {alerts.length}
          </span>
        )}
      </div>

      {/* Alerts list */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Bell className="mb-2 h-8 w-8 text-slate-300 dark:text-dark-400" />
          <p className="text-sm text-slate-500 dark:text-dark-300">
            No active alerts
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
            Everything looks good right now
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((alert) => {
            const sev = severityColors[alert.severity] ?? severityColors.LOW;
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-dark-500 dark:hover:bg-dark-600"
              >
                <div className={`h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-dark-100">
                    {alert.headline}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`badge text-[10px] ${sev.badge}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-dark-400" suppressHydrationWarning>
                      {timeAgo(alert.detectedAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-dark-400" />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {alerts.length > 5 && (
        <Link
          href="/alerts"
          className="mt-3 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10"
        >
          View all alerts
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
