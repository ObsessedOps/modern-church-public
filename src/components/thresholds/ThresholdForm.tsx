"use client";

import { useState } from "react";
import { X } from "lucide-react";

const METRICS = [
  { value: "ATTENDANCE_TOTAL", label: "Weekend Attendance", group: "Attendance" },
  { value: "GROUP_ATTENDANCE", label: "Group Attendance", group: "Attendance" },
  { value: "VISITOR_COUNT", label: "First-Time Visitors", group: "Attendance" },
  { value: "VOLUNTEER_FILL_RATE", label: "Volunteer Fill Rate (%)", group: "Volunteers" },
  { value: "VOLUNTEER_ABSENT_WEEKS", label: "Volunteer Absent Weeks", group: "Volunteers" },
  { value: "GROUP_HEALTH_SCORE", label: "Group Health Score", group: "Groups" },
  { value: "MEMBER_ENGAGEMENT_SCORE", label: "Member Engagement Score", group: "Members" },
  { value: "GROWTH_TRACK_STALL_DAYS", label: "Growth Track Stall Days", group: "Discipleship" },
];

const SCOPES = [
  { value: "CHURCH_WIDE", label: "Church-wide" },
  { value: "CAMPUS", label: "Specific Campus" },
  { value: "GROUP", label: "Specific Group" },
  { value: "TEAM", label: "Specific Team" },
  { value: "MEMBER", label: "Specific Member" },
];

export function ThresholdForm({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    metric: "ATTENDANCE_TOTAL",
    operator: "LESS_THAN",
    value: "",
    scope: "CHURCH_WIDE",
    scopeId: "",
    severity: "MEDIUM",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.value) return;

    setSaving(true);
    try {
      const res = await fetch("/api/thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          scopeId: form.scopeId || null,
        }),
      });

      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-dark-600 dark:bg-dark-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-100">
            New Threshold
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Threshold Name</label>
            <input
              type="text"
              placeholder="e.g., Youth attendance below 30"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Metric</label>
            <select
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            >
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Condition</label>
              <select
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
              >
                <option value="LESS_THAN">Less than</option>
                <option value="GREATER_THAN">Greater than</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Value</label>
              <input
                type="number"
                placeholder="30"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Scope</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
              >
                {SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name || !form.value}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Threshold"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
