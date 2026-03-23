"use client";

import { Activity, LogIn, Eye, FileText, Download, Bell, Edit3, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  createdAt: Date;
  userName: string;
  userRole: string | null;
  resourceLabel: string | null;
}

interface ActivityFeedProps {
  entries: AuditLogEntry[];
}

const ACTION_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  login: { icon: LogIn, color: "text-emerald-500", label: "Signed in" },
  view_member: { icon: Eye, color: "text-blue-500", label: "Viewed" },
  update_notes: { icon: Edit3, color: "text-amber-500", label: "Updated notes for" },
  alert_reviewed: { icon: Bell, color: "text-violet-500", label: "Reviewed alert on" },
  export_members: { icon: Download, color: "text-cyan-500", label: "Exported" },
};

const DEFAULT_META = { icon: FileText, color: "text-slate-400", label: null };

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionKey(action: string): string {
  return action.toLowerCase().replace(/\s+/g, "_");
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
          {entries.map((entry) => {
            const key = getActionKey(entry.action);
            const meta = ACTION_META[key] ?? DEFAULT_META;
            const Icon = meta.icon;
            const actionLabel = meta.label ?? entry.action.replace(/_/g, " ").toLowerCase();

            // Build the description line
            const showResource =
              entry.resourceLabel &&
              entry.resourceLabel !== "Session" &&
              key !== "login";

            return (
              <div key={entry.id} className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                  {getInitials(entry.userName)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 dark:text-dark-200">
                    <span className="font-semibold text-slate-900 dark:text-dark-50">
                      {entry.userName}
                    </span>{" "}
                    <span className="text-slate-500 dark:text-dark-300">
                      {actionLabel}
                    </span>
                    {showResource && (
                      <>
                        {" "}
                        <span className="font-medium text-slate-800 dark:text-dark-100">
                          {entry.resourceLabel}
                        </span>
                      </>
                    )}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Icon className={cn("h-3 w-3", meta.color)} />
                    {entry.userRole && (
                      <span className="text-[10px] text-slate-400 dark:text-dark-400">
                        {formatRole(entry.userRole)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-dark-400" suppressHydrationWarning>
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
