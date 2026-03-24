import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getGrowthTrackData } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Footprints, Users, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_CONFIG = {
  CONNECT: { label: "Connect", color: "bg-blue-500", lightBg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", order: 1 },
  DISCOVER: { label: "Discover", color: "bg-violet-500", lightBg: "bg-violet-100 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", order: 2 },
  SERVE: { label: "Serve", color: "bg-emerald-500", lightBg: "bg-emerald-100 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", order: 3 },
  COMPLETED: { label: "Completed", color: "bg-teal-500", lightBg: "bg-teal-100 dark:bg-teal-900/20", text: "text-teal-600 dark:text-teal-400", order: 4 },
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  STALLED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DROPPED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function GrowthTrackPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, "growth-track:view")) return <AccessDenied />;

  const data = await getGrowthTrackData(session.churchId);

  // Compute Growth Track insights from pipeline data
  const completionRate = data.totalCount > 0 ? ((data.completedCount / data.totalCount) * 100).toFixed(1) : "0";
  const stalledMembers = data.tracks.filter((t) => t.status === "STALLED");
  const stalledNames = stalledMembers.slice(0, 3).map((t) => `${t.member.firstName} ${t.member.lastName}`);

  // Recent completions (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCompletions = data.tracks.filter(
    (t) => t.status === "COMPLETED" && t.serveCompletedAt && new Date(t.serveCompletedAt) >= thirtyDaysAgo
  );

  // Members close to completing next step (in Serve = one step from completion)
  const nearCompletion = data.tracks.filter((t) => t.currentStep === "SERVE" && t.status === "ACTIVE");
  const nearCompletionNames = nearCompletion.slice(0, 3).map((t) => `${t.member.firstName} ${t.member.lastName}`);

  // Bottleneck detection: which step has the most active people
  const stepEntries = [
    { step: "Connect", count: data.stepCounts.CONNECT },
    { step: "Discover", count: data.stepCounts.DISCOVER },
    { step: "Serve", count: data.stepCounts.SERVE },
  ];
  const bottleneck = stepEntries.reduce((a, b) => (b.count > a.count ? b : a), stepEntries[0]);

  const growthTrackInsights = [
    {
      icon: TrendingUp,
      color: "emerald",
      title: "Pipeline Health",
      detail: `${data.activeCount} active participant${data.activeCount !== 1 ? "s" : ""}, ${data.completedCount} completed, and ${data.stalledCount} stalled. ${data.activeCount > data.stalledCount ? "The pipeline is healthy with more active members than stalled." : "Stalled members are outpacing active — consider a re-engagement campaign."}`,
    },
    {
      icon: Sparkles,
      color: "violet",
      title: "Completion Momentum",
      detail: `${recentCompletions.length} member${recentCompletions.length !== 1 ? "s" : ""} completed the full growth track in the last 30 days. Overall completion rate is ${completionRate}% — ${Number(completionRate) >= 50 ? "strong follow-through across the pipeline." : "there's room to improve step-to-step progression."}`,
    },
    {
      icon: AlertTriangle,
      color: "amber",
      title: `${stalledMembers.length} Stalled Member${stalledMembers.length !== 1 ? "s" : ""} Need Attention`,
      detail: stalledNames.length > 0
        ? `${stalledNames.join(", ")}${stalledMembers.length > 3 ? ` and ${stalledMembers.length - 3} more` : ""} ha${stalledMembers.length === 1 ? "s" : "ve"} stalled in the pipeline. A personal check-in from their facilitator or campus pastor could re-ignite momentum.`
        : "No stalled members right now — great job keeping everyone moving forward!",
    },
    {
      icon: Footprints,
      color: "blue",
      title: `Step Progression — Bottleneck at ${bottleneck.step}`,
      detail: `${bottleneck.step} has ${bottleneck.count} active participant${bottleneck.count !== 1 ? "s" : ""}, the most of any step. ${bottleneck.step === "Connect" ? "Consider scheduling more Discover classes to move people forward." : bottleneck.step === "Discover" ? "Members are getting stuck before Serve — try pairing them with serving mentors." : "Members are in Serve but haven't completed yet — celebrate those close to finishing."}`,
    },
    {
      icon: Target,
      color: "rose",
      title: `${nearCompletion.length} Member${nearCompletion.length !== 1 ? "s" : ""} Near Completion`,
      detail: nearCompletionNames.length > 0
        ? `${nearCompletionNames.join(", ")}${nearCompletion.length > 3 ? ` and ${nearCompletion.length - 3} more` : ""} ${nearCompletion.length === 1 ? "is" : "are"} in the Serve step — one milestone from completing the full growth track. Consider recognizing them publicly when they finish.`
        : "No members currently in the Serve step. Focus on progressing Discover members forward.",
    },
  ];

  const insightColors: Record<string, { border: string; bg: string; iconBg: string; iconColor: string }> = {
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    blue: { border: "border-blue-500/20", bg: "bg-blue-500/5", iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
    amber: { border: "border-amber-500/20", bg: "bg-amber-500/5", iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
    violet: { border: "border-violet-500/20", bg: "bg-violet-500/5", iconBg: "bg-violet-500/10", iconColor: "text-violet-600 dark:text-violet-400" },
    rose: { border: "border-rose-500/20", bg: "bg-rose-500/5", iconBg: "bg-rose-500/10", iconColor: "text-rose-600 dark:text-rose-400" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Growth Track
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Three-step discipleship pipeline: Connect, Discover, Serve.
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["CONNECT", "DISCOVER", "SERVE", "COMPLETED"] as const).map((step, i) => {
          const config = STEP_CONFIG[step];
          const count = data.stepCounts[step];
          return (
            <div key={step} className="card-bordered relative p-5">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.lightBg)}>
                  {step === "COMPLETED" ? (
                    <CheckCircle2 className={cn("h-5 w-5", config.text)} />
                  ) : (
                    <span className={cn("text-sm font-bold", config.text)}>{config.order}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-dark-300">{config.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{count}</p>
                </div>
              </div>
              {i < 3 && (
                <ArrowRight className="absolute right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-300 dark:text-dark-500 lg:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/20">
              <Footprints className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Total Enrolled</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.totalCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Active</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.activeCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Stalled</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.stalledCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grace AI Growth Track Insights */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Growth Track Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {growthTrackInsights.map((insight) => {
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

      {/* Member Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 dark:border-dark-600">
          <h2 className="font-medium text-slate-800 dark:text-dark-100">All Participants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-dark-600 dark:text-dark-300">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Current Step</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Campus</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.tracks.map((track) => {
                const stepConfig = STEP_CONFIG[track.currentStep as keyof typeof STEP_CONFIG] ?? STEP_CONFIG.CONNECT;
                return (
                  <tr
                    key={track.id}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50 dark:border-dark-700 dark:hover:bg-dark-700/50"
                  >
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-dark-50">
                      {track.member.firstName} {track.member.lastName}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("badge text-[10px]", stepConfig.lightBg, stepConfig.text)}>
                        {stepConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("badge text-[10px]", STATUS_BADGE[track.status] ?? STATUS_BADGE.ACTIVE)}>
                        {track.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-dark-300">
                      {track.campus?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-dark-300">
                      {formatDate(track.connectStartedAt)}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-dark-300">
                      {formatDate(track.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.tracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Footprints className="h-12 w-12 text-slate-300 dark:text-dark-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-dark-300">No growth track participants yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
