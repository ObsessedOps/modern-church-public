import { getServerSession } from "@/lib/server-auth";
import { getAttendanceTrend, getGivingTrend, getDashboardData, getCampuses, getEngagementDistribution } from "@/lib/queries";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { BarChart3, TrendingUp, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceTrendChart } from "@/components/dashboard/AttendanceTrendChart";
import { GivingTrendChart } from "@/components/dashboard/GivingTrendChart";

const ENGAGEMENT_TIERS = [
  { tier: "CHAMPION", label: "Champion", color: "bg-violet-500", textColor: "text-violet-600 dark:text-violet-400" },
  { tier: "ENGAGED", label: "Engaged", color: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400" },
  { tier: "CASUAL", label: "Casual", color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400" },
  { tier: "AT_RISK", label: "At Risk", color: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400" },
  { tier: "DISENGAGED", label: "Disengaged", color: "bg-slate-400", textColor: "text-slate-600 dark:text-slate-400" },
];

export default async function AnalyticsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'analytics:view')) return <AccessDenied />;

  const [attendanceTrend, givingTrend, dashboard, campuses, engagementEntries] = await Promise.all([
    getAttendanceTrend(session.churchId),
    getGivingTrend(session.churchId),
    getDashboardData(session.churchId),
    getCampuses(session.churchId),
    getEngagementDistribution(session.churchId),
  ]);

  const totalEngaged = engagementEntries.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Analytics &amp; Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Deep-dive analytics, trends, and cross-campus performance metrics.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Total Members</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{dashboard.memberCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Active Members</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{dashboard.activeMemberCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Campuses</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{campuses.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Active Groups</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{dashboard.activeGroupCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttendanceTrendChart data={attendanceTrend} />
        <GivingTrendChart data={givingTrend} />
      </div>

      {/* Engagement Distribution + Campus Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engagement Distribution */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">Engagement Distribution</h3>
          {engagementEntries.length > 0 ? (
            <div className="space-y-3">
              {ENGAGEMENT_TIERS.map((tier) => {
                const entry = engagementEntries.find((e) => e.tier === tier.tier);
                const count = entry?.count ?? 0;
                const pct = totalEngaged > 0 ? (count / totalEngaged) * 100 : 0;
                return (
                  <div key={tier.tier}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("font-medium", tier.textColor)}>{tier.label}</span>
                      <span className="text-slate-500 dark:text-dark-300">{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-dark-600">
                      <div className={cn("h-2 rounded-full", tier.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-dark-400">Engagement data will appear as members interact with your church.</p>
          )}
        </div>

        {/* Campus Comparison */}
        <div className="card overflow-hidden">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">Campus Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-600">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Campus</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Status</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Avg Attendance</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Capacity</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
                {campuses.map((campus) => {
                  const utilization = campus.avgWeeklyAttendance && campus.seatingCapacity
                    ? Math.round((campus.avgWeeklyAttendance / campus.seatingCapacity) * 100)
                    : null;
                  return (
                    <tr key={campus.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-dark-50">{campus.name}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          "badge text-[10px]",
                          campus.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300"
                        )}>{campus.status}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-600 dark:text-dark-200">
                        {campus.avgWeeklyAttendance?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-600 dark:text-dark-200">
                        {campus.seatingCapacity?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {utilization !== null ? (
                          <span className={cn(
                            "text-sm font-medium",
                            utilization >= 80 ? "text-rose-600 dark:text-rose-400" :
                            utilization >= 60 ? "text-amber-600 dark:text-amber-400" :
                            "text-emerald-600 dark:text-emerald-400"
                          )}>{utilization}%</span>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-dark-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
