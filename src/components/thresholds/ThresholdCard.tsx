"use client";

import { useState } from "react";
import {
  Users, UsersRound, HandHeart, UserPlus, Heart,
  Footprints, Activity, Trash2,
} from "lucide-react";

type Threshold = {
  id: string;
  name: string;
  metric: string;
  operator: string;
  value: number;
  scope: string;
  severity: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
};

const metricConfig: Record<string, { label: string; Icon: typeof Users; unit: string }> = {
  ATTENDANCE_TOTAL: { label: "Weekend Attendance", Icon: Users, unit: "" },
  GROUP_ATTENDANCE: { label: "Group Attendance", Icon: UsersRound, unit: "" },
  VOLUNTEER_FILL_RATE: { label: "Volunteer Fill Rate", Icon: HandHeart, unit: "%" },
  VOLUNTEER_ABSENT_WEEKS: { label: "Volunteer Absent Weeks", Icon: HandHeart, unit: "wks" },
  GROUP_HEALTH_SCORE: { label: "Group Health Score", Icon: Activity, unit: "" },
  VISITOR_COUNT: { label: "Visitor Count", Icon: UserPlus, unit: "" },
  MEMBER_ENGAGEMENT_SCORE: { label: "Engagement Score", Icon: Heart, unit: "" },
  GROWTH_TRACK_STALL_DAYS: { label: "Growth Track Stall", Icon: Footprints, unit: "days" },
};

const severityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-dark-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ThresholdCard({ threshold, onToggle, onDelete }: {
  threshold: Threshold;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const config = metricConfig[threshold.metric] ?? { label: threshold.metric, Icon: Activity, unit: "" };
  const { Icon } = config;

  async function handleToggle() {
    setToggling(true);
    await onToggle(threshold.id, !threshold.isActive);
    setToggling(false);
  }

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      threshold.isActive
        ? "border-slate-200 bg-white dark:border-dark-600 dark:bg-dark-800"
        : "border-slate-100 bg-slate-50 opacity-60 dark:border-dark-700 dark:bg-dark-900"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/10">
            <Icon className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-dark-100">{threshold.name}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-dark-400">
              {config.label} {threshold.operator === "LESS_THAN" ? "<" : ">"} {threshold.value}{config.unit}
              {threshold.scope !== "CHURCH_WIDE" && ` · ${threshold.scope.toLowerCase()}-scoped`}
            </p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${severityColors[threshold.severity]}`}>
          {threshold.severity}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 dark:text-dark-400">
          {threshold.lastTriggeredAt
            ? `Last triggered ${new Date(threshold.lastTriggeredAt).toLocaleDateString()}`
            : "Never triggered"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              threshold.isActive ? "bg-primary-600" : "bg-slate-300 dark:bg-dark-600"
            }`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              threshold.isActive ? "left-[18px]" : "left-0.5"
            }`} />
          </button>
          <button
            onClick={() => onDelete(threshold.id)}
            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
