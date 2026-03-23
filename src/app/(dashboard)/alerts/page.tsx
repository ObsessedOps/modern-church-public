import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getAlerts } from "@/lib/queries";
import { redirect } from "next/navigation";
import {
  Bell,
  TrendingDown,
  HeartOff,
  UserMinus,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  LOW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const TYPE_META: Record<string, { label: string; icon: typeof Bell; color: string; bgColor: string }> = {
  ATTENDANCE_DROP: { label: "Attendance Drop", icon: TrendingDown, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/20" },
  GIVING_DECLINE: { label: "Giving Decline", icon: HeartOff, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/20" },
  VOLUNTEER_BURNOUT: { label: "Volunteer Burnout", icon: UserMinus, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
  VISITOR_FOLLOWUP_MISSED: { label: "Follow-Up Missed", icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
  GROUP_HEALTH_WARNING: { label: "Group Health", icon: Users, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
  BUDGET_VARIANCE: { label: "Budget Variance", icon: AlertTriangle, color: "text-rose-500", bgColor: "bg-rose-100 dark:bg-rose-900/20" },
  BACKGROUND_CHECK_EXPIRING: { label: "Background Check", icon: AlertTriangle, color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-700" },
  PASTORAL_CARE_OVERDUE: { label: "Pastoral Care", icon: Bell, color: "text-violet-500", bgColor: "bg-violet-100 dark:bg-violet-900/20" },
  SYNC_FAILURE: { label: "Sync Failure", icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/20" },
  THRESHOLD_BREACH: { label: "Threshold Breach", icon: AlertTriangle, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/20" },
};

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AlertsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'alerts:view')) return <AccessDenied />;
  const alerts = await getAlerts(session.churchId);

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const dismissedAlerts = alerts.filter((a) => a.dismissed);

  // Count by type
  const typeCounts = new Map<string, number>();
  for (const a of activeAlerts) {
    typeCounts.set(a.eventType, (typeCounts.get(a.eventType) ?? 0) + 1);
  }

  // Severity distribution
  const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const a of activeAlerts) {
    severityCounts[a.severity] = (severityCounts[a.severity] ?? 0) + 1;
  }

  // Unique members impacted across active alerts
  const impactedMemberIds = new Set<string>();
  for (const a of activeAlerts) {
    for (const impact of a.memberImpacts) {
      impactedMemberIds.add(impact.memberId);
    }
  }

  // Average response time for dismissed alerts (detected → latest action log)
  const responseTimes: number[] = [];
  for (const a of dismissedAlerts) {
    if (a.actionLogs.length > 0 && a.detectedAt) {
      const latestLog = a.actionLogs.reduce((latest, log) =>
        new Date(log.loggedAt).getTime() > new Date(latest.loggedAt).getTime() ? log : latest
      , a.actionLogs[0]);
      const hours = (new Date(latestLog.loggedAt).getTime() - new Date(a.detectedAt).getTime()) / (1000 * 60 * 60);
      if (hours > 0) responseTimes.push(hours);
    }
  }
  const avgResponseHours = responseTimes.length > 0 ? Math.round(responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length) : 0;

  // Most recurring alert types
  const sortedTypes = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);
  const topRecurring = sortedTypes.length > 0 ? sortedTypes[0] : null;
  const topRecurringLabel = topRecurring ? (TYPE_META[topRecurring[0]]?.label ?? topRecurring[0]) : "None";
  const topRecurringCount = topRecurring ? topRecurring[1] : 0;

  // Resolution momentum — use latest action log timestamp as proxy for resolution time
  const recentlyResolved = dismissedAlerts.filter((a) => {
    if (a.actionLogs.length === 0) return false;
    const latestLog = a.actionLogs.reduce((latest, log) =>
      new Date(log.loggedAt).getTime() > new Date(latest.loggedAt).getTime() ? log : latest
    , a.actionLogs[0]);
    const daysSince = (Date.now() - new Date(latestLog.loggedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  const insightColors: Record<string, { border: string; bg: string; iconBg: string; iconColor: string }> = {
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    blue: { border: "border-blue-500/20", bg: "bg-blue-500/5", iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
    amber: { border: "border-amber-500/20", bg: "bg-amber-500/5", iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
    violet: { border: "border-violet-500/20", bg: "bg-violet-500/5", iconBg: "bg-violet-500/10", iconColor: "text-violet-600 dark:text-violet-400" },
    rose: { border: "border-rose-500/20", bg: "bg-rose-500/5", iconBg: "bg-rose-500/10", iconColor: "text-rose-600 dark:text-rose-400" },
  };

  const alertInsights = [
    {
      icon: TrendingUp,
      color: "amber",
      title: `${activeAlerts.length} Active Alert${activeAlerts.length !== 1 ? "s" : ""} Right Now`,
      detail: `Severity breakdown: ${severityCounts.CRITICAL} critical, ${severityCounts.HIGH} high, ${severityCounts.MEDIUM} medium, ${severityCounts.LOW} low. ${severityCounts.CRITICAL > 0 ? "Critical alerts need immediate attention." : "No critical-severity alerts at this time."}`,
    },
    {
      icon: Clock,
      color: "blue",
      title: avgResponseHours > 0 ? `Avg Response Time: ${avgResponseHours}h` : "Response Time Tracking",
      detail: avgResponseHours > 0
        ? `Your team is addressing alerts in an average of ${avgResponseHours} hours from detection to resolution.${avgResponseHours > 48 ? " Consider triaging critical alerts faster to keep this under 24 hours." : " Great job keeping response times tight."}`
        : "No resolved alerts with timing data yet. As your team addresses alerts, Grace will track how quickly issues are handled.",
    },
    {
      icon: AlertTriangle,
      color: "rose",
      title: topRecurring ? `"${topRecurringLabel}" Keeps Recurring` : "No Recurring Patterns Yet",
      detail: topRecurring
        ? `${topRecurringLabel} alerts have fired ${topRecurringCount} time${topRecurringCount !== 1 ? "s" : ""} and account for the largest share of active alerts. Consider adjusting thresholds or addressing the root cause to reduce alert fatigue.`
        : "Alert types are evenly distributed — no single category is dominating. This is a healthy sign of balanced monitoring.",
    },
    {
      icon: Users,
      color: "violet",
      title: `${impactedMemberIds.size} Member${impactedMemberIds.size !== 1 ? "s" : ""} Affected`,
      detail: impactedMemberIds.size > 0
        ? `Active alerts are linked to ${impactedMemberIds.size} unique member${impactedMemberIds.size !== 1 ? "s" : ""}. Pastoral follow-up on these individuals could prevent disengagement before it becomes permanent.`
        : "No individual members are currently flagged in active alerts. Your congregation appears stable across tracked metrics.",
    },
    {
      icon: Shield,
      color: "emerald",
      title: `${recentlyResolved.length} Alert${recentlyResolved.length !== 1 ? "s" : ""} Resolved This Week`,
      detail: recentlyResolved.length > 0
        ? `Your team resolved ${recentlyResolved.length} alert${recentlyResolved.length !== 1 ? "s" : ""} in the past 7 days out of ${dismissedAlerts.length} total resolved. ${recentlyResolved.length >= 3 ? "Strong momentum — keep it up." : "Consider scheduling a weekly alert-triage meeting to accelerate resolutions."}`
        : "No alerts were resolved in the last 7 days. A quick weekly review can help keep the backlog from growing.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
            Alerts &amp; Watchlist
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
            AI-detected issues across attendance, giving, volunteers, and pastoral care.
          </p>
        </div>
        {can(session, 'thresholds:view') && (
          <Link
            href="/alerts/thresholds"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            My Thresholds
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Object.entries(TYPE_META).slice(0, 6).map(([type, meta]) => {
          const Icon = meta.icon;
          const count = typeCounts.get(type) ?? 0;
          return (
            <div key={type} className="card-bordered p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", meta.bgColor)}>
                  <Icon className={cn("h-4 w-4", meta.color)} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-dark-300">{meta.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grace AI Alert Insights */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Grace AI Alert Insights
          </h3>
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
            AI-POWERED
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alertInsights.map((insight) => {
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

      {/* Active Alerts */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-rose-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Active Alerts</h2>
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            {activeAlerts.length}
          </span>
        </div>
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-emerald-300 dark:text-emerald-500/40" />
            <p className="mt-3 text-sm text-slate-500 dark:text-dark-300">All clear — no active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const meta = TYPE_META[alert.eventType] ?? TYPE_META.THRESHOLD_BREACH;
              const Icon = meta.icon;
              return (
                <div key={alert.id} className="rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-dark-600 dark:hover:bg-dark-600">
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.bgColor)}>
                      <Icon className={cn("h-4 w-4", meta.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">{alert.headline}</h3>
                        <span className={cn("badge text-[10px]", SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.MEDIUM)}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-dark-300">{alert.summary}</p>
                      {alert.memberImpacts.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {alert.memberImpacts.map((impact) => (
                            <span key={impact.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-dark-600 dark:text-dark-200">
                              {impact.member.firstName} {impact.member.lastName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-dark-400" suppressHydrationWarning>
                      {formatDate(alert.detectedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved Alerts */}
      {dismissedAlerts.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Resolved</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              {dismissedAlerts.length}
            </span>
          </div>
          <div className="space-y-2">
            {dismissedAlerts.map((alert) => {
              const meta = TYPE_META[alert.eventType] ?? TYPE_META.THRESHOLD_BREACH;
              return (
                <div key={alert.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-dark-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="flex-1 text-sm text-slate-500 dark:text-dark-300">{alert.headline}</span>
                  <span className="text-[10px] text-slate-400 dark:text-dark-400">{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
