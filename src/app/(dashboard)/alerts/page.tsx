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
} from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Alerts &amp; Watchlist
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          AI-detected issues across attendance, giving, volunteers, and pastoral care.
        </p>
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
