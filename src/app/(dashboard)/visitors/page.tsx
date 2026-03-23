import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getVisitors } from "@/lib/queries";
import { redirect } from "next/navigation";
import {
  UserPlus,
  Mail,
  CheckCircle2,
  Users,
  Footprints,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Clock,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageActions } from "@/components/messaging/MessageActions";

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysAgo(d: Date | string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

type PipelineStage = "new" | "contacted" | "returning" | "connected" | "growing";

const STAGES: { key: PipelineStage; label: string; color: string; bgColor: string; icon: typeof UserPlus }[] = [
  { key: "new", label: "New Visitor", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/20", icon: UserPlus },
  { key: "contacted", label: "Contacted", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/20", icon: MessageSquare },
  { key: "returning", label: "Returning", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-100 dark:bg-violet-900/20", icon: Users },
  { key: "connected", label: "Connected", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/20", icon: CheckCircle2 },
  { key: "growing", label: "Growth Track", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/20", icon: Footprints },
];

function getStage(visitor: {
  _count: { attendanceRecords: number; groupMemberships: number; workflowExecutions: number };
  growthTracks: { id: string }[];
}): PipelineStage {
  if (visitor.growthTracks.length > 0) return "growing";
  if (visitor._count.groupMemberships > 0) return "connected";
  if (visitor._count.attendanceRecords > 1) return "returning";
  if (visitor._count.workflowExecutions > 0) return "contacted";
  return "new";
}

export default async function VisitorsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, "visitors:view")) return <AccessDenied />;
  const visitors = await getVisitors(session.churchId);

  // Compute pipeline stages
  const staged = visitors.map((v) => ({ ...v, stage: getStage(v) }));
  const stageCounts: Record<PipelineStage, number> = {
    new: 0,
    contacted: 0,
    returning: 0,
    connected: 0,
    growing: 0,
  };
  staged.forEach((v) => stageCounts[v.stage]++);

  const totalVisitors = visitors.length;
  const conversionRate =
    totalVisitors > 0
      ? Math.round(((stageCounts.connected + stageCounts.growing) / totalVisitors) * 100)
      : 0;

  // Compute visitor insight data
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const visitorsThisWeek = visitors.filter((v) => new Date(v.createdAt) >= oneWeekAgo).length;
  const visitorsThisMonth = visitors.filter((v) => new Date(v.createdAt) >= oneMonthAgo).length;

  const returningCount = staged.filter((v) => v._count.attendanceRecords > 1).length;
  const retentionRate = totalVisitors > 0 ? Math.round((returningCount / totalVisitors) * 100) : 0;

  const contactedCount = staged.filter((v) => v._count.workflowExecutions > 0).length;
  const notContactedCount = totalVisitors - contactedCount;

  // Campus distribution
  const campusCounts: Record<string, number> = {};
  visitors.forEach((v) => {
    const name = v.primaryCampus?.name ?? "Unassigned";
    campusCounts[name] = (campusCounts[name] ?? 0) + 1;
  });
  const topCampuses = Object.entries(campusCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const pipelineConnected = stageCounts.connected + stageCounts.growing;

  // Grace AI Visitor Insights
  const visitorInsights = [
    {
      icon: TrendingUp,
      color: "emerald",
      title: `${visitorsThisMonth} Visitors This Month`,
      detail: `${visitorsThisWeek} new visitors this week and ${visitorsThisMonth} over the past 30 days. ${visitorsThisWeek >= 3 ? "Visitor volume is trending up — great momentum from your invite culture." : "Consider a targeted invite initiative to boost first-time guest traffic."}`,
    },
    {
      icon: Users,
      color: "blue",
      title: `${retentionRate}% Visitor Retention`,
      detail: `${returningCount} of ${totalVisitors} visitors have returned at least once. ${retentionRate >= 30 ? "Strong retention signal — your follow-up process is working." : "Retention is below 30%. Consider a personal touch in the first 48 hours after a visit."}`,
    },
    {
      icon: Mail,
      color: notContactedCount > 0 ? "amber" : "emerald",
      title: notContactedCount > 0 ? `${notContactedCount} Visitors Need Follow-Up` : "All Visitors Contacted",
      detail: notContactedCount > 0
        ? `${contactedCount} of ${totalVisitors} visitors have been reached through a follow-up workflow. ${notContactedCount} still haven't been contacted — prioritize reaching out within 24-48 hours of their visit.`
        : `Every visitor has been contacted through a follow-up workflow. Excellent coverage — keep it up!`,
    },
    {
      icon: MapPin,
      color: "violet",
      title: `Top Campus: ${topCampuses.length > 0 ? topCampuses[0][0] : "N/A"}`,
      detail: topCampuses.length > 0
        ? `Campus breakdown: ${topCampuses.map(([name, count]) => `${name} (${count})`).join(", ")}. ${topCampuses.length > 1 && topCampuses[0][1] > topCampuses[1][1] * 2 ? "One campus is significantly outperforming — consider sharing their guest experience strategy." : "Visitor distribution is healthy across campuses."}`
        : "No campus data available yet. Assign campuses to visitors to unlock location insights.",
    },
    {
      icon: ArrowRight,
      color: "rose",
      title: `${conversionRate}% Connect-Card-to-Member Pipeline`,
      detail: `${pipelineConnected} of ${totalVisitors} visitors have progressed to Connected or Growth Track stages. ${conversionRate >= 20 ? "Your assimilation pathway is performing well." : "Consider adding a newcomer small group or connection event to accelerate the visitor-to-member journey."}`,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
            Follow-Up Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
            Track every visitor from first visit through connection
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 dark:bg-violet-900/20">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
            {conversionRate}% connection rate
          </span>
        </div>
      </div>

      {/* ── Pipeline Funnel ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-0">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const count = stageCounts[stage.key];
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.key} className="relative flex items-center">
              <div
                className={cn(
                  "flex w-full flex-col items-center rounded-xl px-3 py-4 transition-all sm:rounded-none sm:first:rounded-l-xl sm:last:rounded-r-xl",
                  count > 0 ? stage.bgColor : "bg-slate-50 dark:bg-dark-700"
                )}
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-dark-800/80", stage.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className={cn("mt-2 text-2xl font-bold", count > 0 ? "text-slate-900 dark:text-dark-50" : "text-slate-300 dark:text-dark-500")}>
                  {count}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  {stage.label}
                </p>
              </div>
              {!isLast && (
                <ArrowRight className="absolute -right-2 z-10 hidden h-4 w-4 text-slate-300 dark:text-dark-500 sm:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Grace AI Visitor Insights ─────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Grace AI Visitor Insights
          </h3>
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
            AI-POWERED
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visitorInsights.map((insight) => {
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

      {/* ── Visitor Cards ────────────────────────────────── */}
      {STAGES.map((stage) => {
        const stageVisitors = staged.filter((v) => v.stage === stage.key);
        if (stageVisitors.length === 0) return null;
        const Icon = stage.icon;

        return (
          <div key={stage.key}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className={cn("h-4 w-4", stage.color)} />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-dark-100">
                {stage.label}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                {stageVisitors.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stageVisitors.map((visitor) => {
                const days = daysAgo(visitor.createdAt);
                const execution = visitor.workflowExecutions[0];
                const growthTrack = visitor.growthTracks[0];

                return (
                  <div
                    key={visitor.id}
                    className="card flex items-start gap-3 transition-all hover:shadow-md"
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold", stage.bgColor, stage.color)}>
                      {getInitials(visitor.firstName, visitor.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                        {visitor.firstName} {visitor.lastName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-dark-300">
                        {visitor.primaryCampus && (
                          <span>{visitor.primaryCampus.name}</span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {days === 0 ? "Today" : `${days}d ago`}
                        </span>
                        <span>·</span>
                        <span>
                          {visitor._count.attendanceRecords}{" "}
                          visit{visitor._count.attendanceRecords !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Contact info + actions */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {visitor.email && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                              <Mail className="h-2.5 w-2.5" />
                              {visitor.email}
                            </span>
                          )}
                          {visitor.phone && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {visitor.phone}
                            </span>
                          )}
                        </div>
                        <MessageActions
                          name={`${visitor.firstName} ${visitor.lastName}`}
                          email={visitor.email}
                          phone={visitor.phone}
                          context={`Visitor: ${visitor.firstName} ${visitor.lastName}, Stage: ${stage.label}, Visits: ${visitor._count.attendanceRecords}`}
                        />
                      </div>

                      {/* Workflow status */}
                      {execution && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              execution.status === "RUNNING"
                                ? "bg-blue-500 animate-pulse"
                                : execution.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                            )}
                          />
                          <span className="text-[10px] text-slate-500 dark:text-dark-300">
                            {execution.workflow.name}
                            {execution.status === "RUNNING" && " — in progress"}
                            {execution.status === "COMPLETED" && " — done"}
                          </span>
                        </div>
                      )}

                      {/* Growth track badge */}
                      {growthTrack && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                          <Footprints className="h-3 w-3" />
                          Growth Track: {growthTrack.currentStep}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {visitors.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12">
          <UserPlus className="h-12 w-12 text-slate-300 dark:text-dark-400" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-dark-200">
            No visitors recorded yet
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
            Visitors will appear here as they're checked in at services
          </p>
        </div>
      )}
    </div>
  );
}
