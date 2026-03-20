"use client";

import { useState } from "react";
import { Filter, Users, Plus, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const FIELD_OPTIONS = [
  { value: "engagement_tier", label: "Engagement Tier" },
  { value: "campus", label: "Campus" },
  { value: "group_member", label: "In a Group" },
  { value: "volunteer", label: "Volunteering" },
  { value: "attendance_weeks", label: "Weeks Attended (last 12)" },
  { value: "last_attended", label: "Last Attended" },
  { value: "giving_status", label: "Giving Status" },
  { value: "growth_track", label: "Growth Track Step" },
  { value: "age_range", label: "Age Range" },
  { value: "joined_after", label: "Joined After" },
];

const VALUE_OPTIONS: Record<string, string[]> = {
  engagement_tier: ["Champion", "Engaged", "Casual", "At Risk", "Disengaged"],
  campus: ["Downtown", "North Side", "West Campus"],
  group_member: ["Yes", "No"],
  volunteer: ["Yes", "No"],
  attendance_weeks: ["0", "1-3", "4-6", "7-9", "10-12"],
  last_attended: ["This week", "Last 2 weeks", "Last month", "30+ days ago", "60+ days ago"],
  giving_status: ["Active recurring", "Occasional", "First-time", "Lapsed", "Non-giver"],
  growth_track: ["Not started", "Connect", "Discover", "Serve", "Completed"],
  age_range: ["18-25", "26-35", "36-45", "46-55", "56+"],
  joined_after: ["Last 30 days", "Last 90 days", "Last 6 months", "Last year"],
};

// Simulated audience size calculation
function estimateAudienceSize(rules: FilterRule[]): number {
  if (rules.length === 0) return 3247;
  // Simulate decreasing audience with more filters
  let base = 3247;
  for (const rule of rules) {
    if (rule.value) {
      const factor = rule.field === "campus" ? 0.35 : rule.field === "engagement_tier" ? 0.25 : 0.45;
      base = Math.round(base * factor);
    }
  }
  return Math.max(base, 12);
}

let nextId = 1;

export function AudienceBuilder() {
  const [rules, setRules] = useState<FilterRule[]>([
    { id: "1", field: "engagement_tier", operator: "is", value: "Engaged" },
    { id: "2", field: "campus", operator: "is", value: "Downtown" },
  ]);

  const audienceSize = estimateAudienceSize(rules);

  function addRule() {
    nextId++;
    setRules([...rules, { id: String(nextId), field: "", operator: "is", value: "" }]);
  }

  function removeRule(id: string) {
    setRules(rules.filter((r) => r.id !== id));
  }

  function updateRule(id: string, updates: Partial<FilterRule>) {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
          <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Audience Builder
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-dark-300">
            Build targeted segments for your campaigns
          </p>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={rule.id} className="flex items-center gap-2">
            {i > 0 && (
              <span className="w-8 shrink-0 text-center text-[10px] font-bold uppercase text-slate-400">
                AND
              </span>
            )}
            {i === 0 && <span className="w-8 shrink-0" />}
            <select
              value={rule.field}
              onChange={(e) => updateRule(rule.id, { field: e.target.value, value: "" })}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200"
            >
              <option value="">Select field...</option>
              {FIELD_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-[10px] font-medium text-slate-400">is</span>
            <select
              value={rule.value}
              onChange={(e) => updateRule(rule.id, { value: e.target.value })}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200"
              disabled={!rule.field}
            >
              <option value="">Select value...</option>
              {(VALUE_OPTIONS[rule.field] ?? []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeRule(rule.id)}
              className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRule}
        className="mt-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
      >
        <Plus className="h-3 w-3" />
        Add filter
      </button>

      {/* Audience Size Preview */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-dark-50">
              {audienceSize.toLocaleString()} members
            </p>
            <p className="text-[10px] text-slate-500 dark:text-dark-300">
              match your criteria
            </p>
          </div>
        </div>
        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
          Use Audience
        </button>
      </div>
    </div>
  );
}
