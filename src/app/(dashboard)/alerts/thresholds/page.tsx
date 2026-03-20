"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { ThresholdCard } from "@/components/thresholds/ThresholdCard";
import { ThresholdForm } from "@/components/thresholds/ThresholdForm";
import Link from "next/link";

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

export default function ThresholdsPage() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchThresholds = useCallback(async () => {
    const res = await fetch("/api/thresholds");
    if (res.ok) {
      setThresholds(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/thresholds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setThresholds((prev) => prev.map((t) => t.id === id ? { ...t, isActive } : t));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/thresholds/${id}`, { method: "DELETE" });
    setThresholds((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/10">
            <SlidersHorizontal className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50">My Thresholds</h1>
            <p className="text-sm text-slate-500 dark:text-dark-300">
              Set custom metrics that matter to you and get alerted when they&apos;re breached
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/alerts"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            Back to Alerts
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            New Threshold
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-700" />
          ))}
        </div>
      ) : thresholds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-dark-600">
          <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-300 dark:text-dark-500" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-dark-300">No thresholds set</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
            Create a threshold to get alerted when a metric crosses your target
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Create Your First Threshold
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {thresholds.map((threshold) => (
            <ThresholdCard
              key={threshold.id}
              threshold={threshold}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ThresholdForm
          onClose={() => setShowForm(false)}
          onCreated={fetchThresholds}
        />
      )}
    </div>
  );
}
