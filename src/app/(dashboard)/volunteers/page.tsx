import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getVolunteerData } from "@/lib/queries";
import { redirect } from "next/navigation";
import { HandHeart, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BURNOUT_COLORS: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MODERATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default async function VolunteersPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'volunteers:view')) return <AccessDenied />;
  const data = await getVolunteerData(session.churchId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Volunteers &amp; Serving
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Team management, scheduling, burnout prevention, and recognition.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
              <HandHeart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Active Volunteers</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.activeCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Teams</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.teams.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">High Burnout Risk</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.highBurnout}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Fill Rate</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">
                {data.totalPositions > 0 ? Math.round((data.activeCount / data.totalPositions) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.teams.map((team) => {
          const activePositions = team.positions.filter((p) => p.status === "ACTIVE");
          const highRisk = team.positions.filter((p) => p.burnoutRisk === "HIGH").length;
          return (
            <div key={team.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">{team.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-dark-300">{team.ministryArea}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-dark-50">
                    {activePositions.length}/{team.positions.length}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-dark-400">filled</span>
                  {highRisk > 0 && (
                    <span className="badge bg-rose-100 text-[10px] text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                      {highRisk} high risk
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {team.positions.map((pos) => (
                  <div key={pos.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-dark-600">
                    <div className={cn("h-2 w-2 rounded-full", pos.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300")} />
                    <span className="flex-1 text-xs font-medium text-slate-700 dark:text-dark-200">
                      {pos.member ? `${pos.member.firstName} ${pos.member.lastName}` : "Unfilled"}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-dark-400">{pos.role}</span>
                    <span className={cn("badge text-[10px]", BURNOUT_COLORS[pos.burnoutRisk] ?? BURNOUT_COLORS.LOW)}>
                      {pos.burnoutRisk}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-dark-400">{pos.hoursLogged}h</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
