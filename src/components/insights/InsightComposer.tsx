"use client";

import { useState } from "react";
import { X } from "lucide-react";

const TYPES = [
  { value: "TREND_ALERT", label: "Trend" },
  { value: "MEMBER_CARE", label: "Care Need" },
  { value: "CELEBRATION", label: "Celebration" },
  { value: "RECOMMENDATION", label: "Recommendation" },
  { value: "STAFFING_GAP", label: "Staffing" },
];

export function InsightComposer({ staff, onClose, onCreated }: {
  staff: { id: string; name: string; role: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "RECOMMENDATION",
    priority: "FYI",
    title: "",
    bodyText: "",
    suggestion: "",
    recipientIds: [] as string[],
  });

  function toggleRecipient(id: string) {
    setForm((prev) => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(id)
        ? prev.recipientIds.filter((r) => r !== id)
        : [...prev.recipientIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.bodyText || form.recipientIds.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          suggestion: form.suggestion || null,
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
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-dark-600 dark:bg-dark-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-dark-100">Share Insight</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.type === t.value
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-dark-700 dark:text-dark-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <input
              type="text"
              placeholder="Insight title..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            />
          </div>

          <div>
            <textarea
              placeholder="What did you observe? Share the context..."
              rows={3}
              value={form.bodyText}
              onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Suggested action (optional)..."
              value={form.suggestion}
              onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
              >
                <option value="FYI">FYI</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-dark-300">Share with</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {staff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleRecipient(s.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    form.recipientIds.includes(s.id)
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-dark-700 dark:text-dark-300"
                  }`}
                >
                  {s.name}
                  <span className="ml-1 opacity-60">{s.role.replace(/_/g, " ").toLowerCase()}</span>
                </button>
              ))}
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
              disabled={saving || !form.title || !form.bodyText || form.recipientIds.length === 0}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Sharing..." : "Share Insight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
