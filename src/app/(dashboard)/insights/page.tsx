"use client";

import { useState, useEffect, useCallback } from "react";
import { Lightbulb, Plus, Sparkles, MessageCircle } from "lucide-react";
import { InsightCard } from "@/components/insights/InsightCard";
import { InsightDetail } from "@/components/insights/InsightDetail";
import { InsightComposer } from "@/components/insights/InsightComposer";

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

type StaffMember = {
  id: string;
  name: string;
  role: string;
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InsightItem | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [tab, setTab] = useState<"all" | "shared">("all");
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const fetchInsights = useCallback(async () => {
    const res = await fetch("/api/insights");
    if (res.ok) setInsights(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInsights();
    // Fetch staff for composer
    fetch("/api/staff")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setStaff(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [fetchInsights]);

  const filtered = tab === "shared"
    ? insights.filter((i) => i.source === "LEADER_SHARED")
    : insights;

  const unreadCount = insights.filter((i) => !i.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50">
              Insights
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-300">
              AI-generated intelligence and shared observations from your team
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Share Insight
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-dark-700">
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "all"
              ? "bg-white text-slate-800 shadow-sm dark:bg-dark-600 dark:text-dark-100"
              : "text-slate-500 hover:text-slate-700 dark:text-dark-400"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          All Insights
        </button>
        <button
          onClick={() => setTab("shared")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "shared"
              ? "bg-white text-slate-800 shadow-sm dark:bg-dark-600 dark:text-dark-100"
              : "text-slate-500 hover:text-slate-700 dark:text-dark-400"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Shared with Me
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-700" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-dark-600">
          <Lightbulb className="mx-auto h-8 w-8 text-slate-300 dark:text-dark-500" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-dark-300">
            {tab === "shared" ? "No shared insights yet" : "No insights yet"}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
            {tab === "shared"
              ? "When team members share insights with you, they'll appear here"
              : "Grace AI will surface insights as it analyzes your church data"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

      {selected && (
        <InsightDetail
          insight={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            fetchInsights();
            setSelected(null);
          }}
        />
      )}

      {showComposer && (
        <InsightComposer
          staff={staff}
          onClose={() => setShowComposer(false)}
          onCreated={fetchInsights}
        />
      )}
    </div>
  );
}
