"use client";

import { useState, useEffect } from "react";
import {
  Eye, Users, Cpu, Coins, TrendingUp, Monitor, Smartphone, Tablet,
  BarChart3, Sparkles, Activity, Loader2, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  pageViews: {
    total: number;
    today: number;
    last7d: number;
    last30d: number;
    uniqueVisitors7d: number;
    uniqueVisitors30d: number;
    topPages: { path: string; count: number }[];
    devices: { type: string; count: number }[];
    daily: { day: string; count: number }[];
  };
  ai: {
    totalRequests: number;
    requests7d: number;
    requests30d: number;
    totalTokens: number;
    totalCostCents: number;
    byModel: { model: string; count: number; tokens: number; costCents: number }[];
    byType: { type: string; count: number; tokens: number }[];
    daily: { day: string; count: number }[];
  };
  activity: {
    auditEvents7d: number;
  };
}

const MODEL_LABELS: Record<string, string> = {
  "claude-sonnet-4-20250514": "Sonnet 4",
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-haiku-4-5-20251001": "Haiku 4.5",
  "claude-opus-4-6": "Opus 4.6",
};

const TYPE_LABELS: Record<string, string> = {
  grace_chat: "Grace Chat",
  grace_insight: "Grace Insight",
  engagement_analysis: "Engagement",
  attendance_forecast: "Attendance",
  giving_analysis: "Giving",
  volunteer_optimization: "Volunteers",
  group_health_report: "Group Health",
  visitor_followup: "Visitor Follow-up",
};

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 0.01) return `$${dollars.toFixed(4)}`;
  return `$${dollars.toFixed(2)}`;
}

function MiniBar({ data, color }: { data: { day: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={cn("w-full min-w-[4px] rounded-t-sm transition-all", color)}
            style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
          />
          <span className="text-[8px] text-slate-400 hidden sm:block">
            {new Date(d.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Eye;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchStats(adminKey: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(adminKey)}`);
      if (!res.ok) throw new Error("Invalid key");
      const data = await res.json();
      setStats(data);
      setAuthed(true);
    } catch {
      setError("Invalid admin key");
    } finally {
      setLoading(false);
    }
  }

  // Check if key is in URL hash for bookmarking
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setKey(hash);
      fetchStats(hash);
    }
  }, []);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your admin key to continue</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStats(key);
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin key"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !key}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalDevices = stats.pageViews.devices.reduce((s, d) => s + d.count, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">Modern.Church Admin</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Site Analytics & AI Usage</p>
            </div>
          </div>
          <button
            onClick={() => fetchStats(key)}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* ── Site Traffic KPIs ─────────────────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Site Traffic
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard icon={Eye} label="Today" value={stats.pageViews.today} color="bg-blue-500" />
            <KpiCard icon={Eye} label="7 Days" value={stats.pageViews.last7d} color="bg-blue-500" />
            <KpiCard icon={Eye} label="30 Days" value={stats.pageViews.last30d} color="bg-blue-500" />
            <KpiCard icon={Users} label="Visitors 7d" value={stats.pageViews.uniqueVisitors7d} color="bg-violet-500" />
            <KpiCard icon={Users} label="Visitors 30d" value={stats.pageViews.uniqueVisitors30d} color="bg-violet-500" />
            <KpiCard icon={Eye} label="All Time" value={stats.pageViews.total} color="bg-slate-500" />
          </div>
        </div>

        {/* ── Page Views Chart + Top Pages + Devices ────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Daily chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <h3 className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Page Views (7d)</h3>
            {stats.pageViews.daily.length > 0 ? (
              <MiniBar data={stats.pageViews.daily} color="bg-blue-500" />
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No data yet</p>
            )}
          </div>

          {/* Top Pages */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <h3 className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Top Pages (7d)</h3>
            <div className="space-y-2">
              {stats.pageViews.topPages.slice(0, 8).map((p) => (
                <div key={p.path} className="flex items-center justify-between">
                  <span className="truncate text-xs text-slate-700 dark:text-slate-300 max-w-[180px]">
                    {p.path === "/" ? "Dashboard" : p.path.replace(/^\//, "")}
                  </span>
                  <span className="shrink-0 ml-2 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {p.count}
                  </span>
                </div>
              ))}
              {stats.pageViews.topPages.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">No data yet</p>
              )}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <h3 className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Devices (7d)</h3>
            <div className="space-y-3">
              {stats.pageViews.devices.map((d) => {
                const DeviceIcon = DEVICE_ICONS[d.type] ?? Monitor;
                const pct = totalDevices > 0 ? Math.round((d.count / totalDevices) * 100) : 0;
                return (
                  <div key={d.type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 capitalize">{d.type}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-violet-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.pageViews.devices.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Usage KPIs ────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Grace AI Usage
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard icon={Sparkles} label="Requests 7d" value={stats.ai.requests7d} color="bg-violet-500" />
            <KpiCard icon={Sparkles} label="Requests 30d" value={stats.ai.requests30d} color="bg-violet-500" />
            <KpiCard icon={Sparkles} label="All Time" value={stats.ai.totalRequests} color="bg-slate-500" />
            <KpiCard icon={Cpu} label="Total Tokens" value={formatTokens(stats.ai.totalTokens)} color="bg-emerald-500" />
            <KpiCard icon={Coins} label="Total Cost" value={formatCost(stats.ai.totalCostCents)} color="bg-amber-500" />
          </div>
        </div>

        {/* ── AI Chart + By Model + By Type ─────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Daily AI chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <h3 className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">AI Requests (7d)</h3>
            {stats.ai.daily.length > 0 ? (
              <MiniBar data={stats.ai.daily} color="bg-violet-500" />
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No data yet</p>
            )}
          </div>

          {/* By Model */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <h3 className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">By Model</h3>
            <div className="space-y-2.5">
              {stats.ai.byModel.map((m) => (
                <div key={m.model} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {MODEL_LABELS[m.model] ?? m.model}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatTokens(m.tokens)} tokens · {formatCost(m.costCents)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    {m.count}
                  </span>
                </div>
              ))}
              {stats.ai.byModel.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">No AI usage yet</p>
              )}
            </div>
          </div>

          {/* By Request Type */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <h3 className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">By Request Type</h3>
            <div className="space-y-2.5">
              {stats.ai.byType.map((t) => (
                <div key={t.type} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {TYPE_LABELS[t.type] ?? t.type}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatTokens(t.tokens)} tokens</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {t.count}
                  </span>
                </div>
              ))}
              {stats.ai.byType.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">No AI usage yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Activity ──────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {stats.activity.auditEvents7d} audit events in the last 7 days
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pb-4">
          Modern.Church Admin · Data refreshes on page load
        </p>
      </div>
    </div>
  );
}
