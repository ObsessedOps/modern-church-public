"use client";

import { Activity } from "lucide-react";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  createdAt: Date;
}

interface ActivityFeedProps {
  entries: AuditLogEntry[];
}

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

function getInitial(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatResource(resource: string): string {
  return resource
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <div className="card">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 dark:bg-slate-500/20">
          <Activity className="h-4 w-4 text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
          Recent Activity
        </h3>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Activity className="mb-2 h-8 w-8 text-slate-300 dark:text-dark-400" />
          <p className="text-sm text-slate-500 dark:text-dark-300">
            No recent activity
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                {getInitial(entry.userId)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-700 dark:text-dark-200">
                  <span className="font-medium text-slate-900 dark:text-dark-50">
                    {entry.userId ?? "System"}
                  </span>{" "}
                  {formatAction(entry.action).toLowerCase()}{" "}
                  <span className="font-medium text-slate-700 dark:text-dark-100">
                    {entry.resource ? formatResource(entry.resource) : ""}
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-dark-400" suppressHydrationWarning>
                  {timeAgo(entry.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
