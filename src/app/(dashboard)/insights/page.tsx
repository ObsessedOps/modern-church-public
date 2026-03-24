"use client";

import { useState, useEffect, useCallback } from "react";
import { Lightbulb, Plus, Sparkles, MessageCircle, TrendingUp, Users, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
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
              Surfaced patterns and shared observations from your team
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

      {/* Grace AI Meta-Insights */}
      {!loading && insights.length > 0 && (() => {
        const totalInsights = insights.length;
        const unread = insights.filter((i) => !i.readAt).length;
        const readCount = totalInsights - unread;
        const readRate = totalInsights > 0 ? Math.round((readCount / totalInsights) * 100) : 0;

        const reactedInsights = insights.filter((i) => i.reaction !== null);
        const topReacted = reactedInsights.length;
        const engagementRate = totalInsights > 0 ? Math.round((topReacted / totalInsights) * 100) : 0;

        const aiGenerated = insights.filter((i) => i.source === "AI_GENERATED" || i.source === "GRACE_AI");
        const leaderShared = insights.filter((i) => i.source === "LEADER_SHARED");
        const aiPercent = totalInsights > 0 ? Math.round((aiGenerated.length / totalInsights) * 100) : 0;

        const actionable = insights.filter((i) => i.suggestion !== null);
        const resolved = insights.filter((i) => i.isResolved);
        const followUpRate = actionable.length > 0 ? Math.round((resolved.length / actionable.length) * 100) : 0;

        const typeMap = new Map<string, number>();
        insights.forEach((i) => {
          typeMap.set(i.type, (typeMap.get(i.type) || 0) + 1);
        });
        const coveredTypes = typeMap.size;
        const allKnownTypes = ["ATTENDANCE", "ENGAGEMENT", "VOLUNTEERS", "PASTORAL", "GROWTH"];
        const missingTypes = allKnownTypes.filter((t) => !typeMap.has(t));

        const metaInsights = [
          {
            icon: TrendingUp,
            color: "emerald",
            title: `${totalInsights} Insights Generated — ${readRate}% Read`,
            detail: `Your team has ${totalInsights} insights available with ${unread} still unread. ${readRate >= 80 ? "Great engagement — your team is staying on top of the data." : readRate >= 50 ? "Solid read rate, but some insights may be slipping through. Consider a weekly review huddle." : "Many insights are going unread. A brief daily check-in could surface valuable patterns before they go stale."}`,
          },
          {
            icon: Users,
            color: "blue",
            title: `${engagementRate}% Team Engagement Rate`,
            detail: `${topReacted} out of ${totalInsights} insights have received reactions from team members. ${engagementRate >= 60 ? "Your team is actively engaging with insights — this drives better decision-making." : "Encouraging team reactions helps surface which insights matter most. Consider asking staff to react to insights during team meetings."}`,
          },
          {
            icon: Sparkles,
            color: "violet",
            title: `Auto vs Leader Balance: ${aiPercent}% Auto-Generated`,
            detail: `${aiGenerated.length} insights surfaced automatically and ${leaderShared.length} shared by leaders. ${leaderShared.length >= aiGenerated.length ? "Great balance — leader observations complement automated analysis well." : leaderShared.length > 0 ? "Automated insights are doing the heavy lifting. Encourage more leaders to share their on-the-ground observations for a fuller picture." : "All insights are auto-generated. Leader-shared observations add valuable context — encourage your team to share."}`,
          },
          {
            icon: Eye,
            color: "amber",
            title: `${followUpRate}% Actionability Rate`,
            detail: `${actionable.length} insights included actionable suggestions and ${resolved.length} have been marked resolved. ${followUpRate >= 70 ? "Excellent follow-through — insights are driving real action." : followUpRate >= 40 ? "Moderate follow-through. Assigning owners to action items could boost completion." : "Most actionable insights haven't been resolved yet. Consider a weekly 'insight action review' to close the loop."}`,
          },
          {
            icon: Lightbulb,
            color: "rose",
            title: `${coveredTypes} Ministry Areas Covered${missingTypes.length > 0 ? ` — ${missingTypes.length} Gaps` : ""}`,
            detail: `Insights span ${coveredTypes} ministry categories${Array.from(typeMap.entries()).length > 0 ? ` (${Array.from(typeMap.entries()).map(([type, count]) => `${type.charAt(0) + type.slice(1).toLowerCase()}: ${count}`).join(", ")})` : ""}. ${missingTypes.length > 0 ? `No insights yet for ${missingTypes.map((t) => t.charAt(0) + t.slice(1).toLowerCase()).join(", ")} — consider adding data sources or check-ins in those areas.` : "All major ministry areas are covered — comprehensive insight coverage supports holistic leadership."}`,
          },
        ];

        const insightColors: Record<string, { border: string; bg: string; iconBg: string; iconColor: string }> = {
          emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
          blue: { border: "border-blue-500/20", bg: "bg-blue-500/5", iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
          violet: { border: "border-violet-500/20", bg: "bg-violet-500/5", iconBg: "bg-violet-500/10", iconColor: "text-violet-600 dark:text-violet-400" },
          amber: { border: "border-amber-500/20", bg: "bg-amber-500/5", iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
          rose: { border: "border-rose-500/20", bg: "bg-rose-500/5", iconBg: "bg-rose-500/10", iconColor: "text-rose-600 dark:text-rose-400" },
        };

        return (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600/10">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                Insights Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {metaInsights.map((insight) => {
                const Icon = insight.icon;
                const style = insightColors[insight.color];
                return (
                  <div
                    key={insight.title}
                    className={cn(
                      "rounded-xl border p-4 transition-colors",
                      style.border,
                      style.bg,
                      "bg-white dark:bg-dark-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.iconBg)}>
                        <Icon className={cn("h-4 w-4", style.iconColor)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-dark-50">
                          {insight.title}
                        </p>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-dark-200">
                          {insight.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
              : "Insights will surface as your church data is analyzed"}
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
