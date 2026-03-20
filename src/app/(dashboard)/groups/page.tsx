import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getGroups } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Users, Heart, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  SMALL_GROUP: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  BIBLE_STUDY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MINISTRY_TEAM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SUPPORT_GROUP: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  CLASS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMMUNITY_GROUP: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function GroupsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'groups:view')) return <AccessDenied />;
  const groups = await getGroups(session.churchId);

  const totalMembers = groups.reduce((sum, g) => sum + g._count.memberships, 0);
  const avgHealth = groups.length > 0
    ? Math.round((groups.reduce((sum, g) => sum + g.healthScore, 0) / groups.length) * 10) / 10
    : 0;
  const needsAttention = groups.filter((g) => g.healthScore < 50 && g.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Groups &amp; Discipleship
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Manage small groups, Bible studies, classes, and discipleship pathways.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Total Groups</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{groups.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Total in Groups</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{totalMembers}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Avg Health Score</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{avgHealth}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Needs Attention</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{needsAttention}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const healthPct = Math.min(100, Math.max(0, group.healthScore));
          const healthColor = healthPct >= 70 ? "bg-emerald-500" : healthPct >= 40 ? "bg-amber-500" : "bg-rose-500";
          return (
            <div key={group.id} className="card transition-shadow hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">{group.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn("badge text-[10px]", TYPE_COLORS[group.type] ?? TYPE_COLORS.SMALL_GROUP)}>
                      {formatType(group.type)}
                    </span>
                    {!group.isActive && (
                      <span className="badge bg-slate-100 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">Inactive</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-dark-50">{group._count.memberships}</p>
                  <p className="text-[10px] text-slate-400 dark:text-dark-400">members</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {/* Health Score Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-dark-300">Health Score</span>
                    <span className="font-medium text-slate-700 dark:text-dark-200">{healthPct}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-dark-600">
                    <div className={cn("h-1.5 rounded-full", healthColor)} style={{ width: `${healthPct}%` }} />
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-dark-400">
                  {group.meetingDay && <span>{group.meetingDay}{group.meetingTime ? ` ${group.meetingTime}` : ""}</span>}
                  {group.category && <span>{group.category}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-slate-300 dark:text-dark-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-dark-300">No groups created yet</p>
          </div>
        </div>
      )}
    </div>
  );
}
