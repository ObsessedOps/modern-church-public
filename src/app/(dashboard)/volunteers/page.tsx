import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getVolunteerData } from "@/lib/queries";
import { redirect } from "next/navigation";
import { HandHeart, Users, AlertTriangle, CheckCircle2, Sparkles, TrendingUp, Heart, Shield } from "lucide-react";
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

  // Compute volunteer insight data
  const fillRate = data.totalPositions > 0 ? Math.round((data.activeCount / data.totalPositions) * 100) : 0;
  const teamsBySize = [...data.teams].sort((a, b) => b.positions.length - a.positions.length);
  const largestTeam = teamsBySize[0];
  const smallestTeam = teamsBySize[teamsBySize.length - 1];

  const highBurnoutVolunteers = data.teams
    .flatMap((t) => t.positions)
    .filter((p) => p.burnoutRisk === "HIGH" && p.member)
    .map((p) => `${p.member!.firstName} ${p.member!.lastName}`);

  const multiTeamMap = new Map<string, string[]>();
  data.teams.forEach((t) =>
    t.positions.forEach((p) => {
      if (p.member) {
        const name = `${p.member.firstName} ${p.member.lastName}`;
        if (!multiTeamMap.has(name)) multiTeamMap.set(name, []);
        multiTeamMap.get(name)!.push(t.name);
      }
    })
  );
  const multiTeamVolunteers = Array.from(multiTeamMap.entries()).filter(([, teams]) => teams.length > 1);

  const topByHours = data.teams
    .flatMap((t) => t.positions)
    .filter((p) => p.member)
    .sort((a, b) => b.hoursLogged - a.hoursLogged)
    .slice(0, 3)
    .map((p) => ({ name: `${p.member!.firstName} ${p.member!.lastName}`, hours: p.hoursLogged }));

  const understaffedTeams = data.teams
    .map((t) => ({ name: t.name, active: t.positions.filter((p) => p.status === "ACTIVE").length, total: t.positions.length }))
    .filter((t) => t.total > 0 && t.active / t.total < 0.75)
    .sort((a, b) => a.active / a.total - b.active / b.total);

  const newVolunteers = data.teams
    .flatMap((t) => t.positions)
    .filter((p) => p.member && p.hoursLogged < 10 && p.status === "ACTIVE")
    .map((p) => `${p.member!.firstName} ${p.member!.lastName}`);

  // Grace AI Volunteer Insights
  const volunteerInsights = [
    {
      icon: Shield,
      color: "emerald",
      title: `Coverage Health: ${fillRate}% Fill Rate`,
      detail: fillRate >= 85
        ? `Strong coverage overall at ${fillRate}%. ${understaffedTeams.length > 0 ? `However, ${understaffedTeams.map((t) => `${t.name} (${Math.round((t.active / t.total) * 100)}%)`).join(", ")} could use reinforcement.` : "All teams are well-staffed."}`
        : `Fill rate is at ${fillRate}% — below the 85% healthy threshold. ${understaffedTeams.length > 0 ? `Priority gaps: ${understaffedTeams.map((t) => `${t.name} (${Math.round((t.active / t.total) * 100)}%)`).join(", ")}.` : ""} Consider a volunteer recruitment push.`,
    },
    {
      icon: AlertTriangle,
      color: "amber",
      title: `${data.highBurnout} Volunteers at Burnout Risk`,
      detail: highBurnoutVolunteers.length > 0
        ? `${highBurnoutVolunteers.slice(0, 4).join(", ")}${highBurnoutVolunteers.length > 4 ? ` and ${highBurnoutVolunteers.length - 4} others` : ""} are flagged high-risk.${multiTeamVolunteers.length > 0 ? ` ${multiTeamVolunteers.slice(0, 2).map(([n, t]) => `${n} serves on ${t.length} teams`).join("; ")}.` : ""} Proactively schedule rest weeks before these key volunteers disengage.`
        : `No volunteers are currently flagged high-risk — great work! Keep monitoring ${multiTeamVolunteers.length > 0 ? `multi-team members like ${multiTeamVolunteers.slice(0, 2).map(([n]) => n).join(", ")}` : "workload distribution"} to stay ahead.`,
    },
    {
      icon: TrendingUp,
      color: "blue",
      title: `${newVolunteers.length} New Volunteers Getting Started`,
      detail: newVolunteers.length > 0
        ? `${newVolunteers.slice(0, 3).join(", ")}${newVolunteers.length > 3 ? ` and ${newVolunteers.length - 3} others` : ""} recently joined with under 10 hours logged. Assign mentors and check in after their first month to boost retention.`
        : `No brand-new volunteers placed recently. Consider promoting volunteer opportunities in connect cards and Sunday announcements to build the pipeline.`,
    },
    {
      icon: Users,
      color: "violet",
      title: "Team Balance Across Ministry Areas",
      detail: largestTeam && smallestTeam
        ? `${largestTeam.name} is your largest team with ${largestTeam.positions.length} positions, while ${smallestTeam.name} has just ${smallestTeam.positions.length}. ${understaffedTeams.length > 0 ? `Consider cross-training from larger teams to fill gaps in ${understaffedTeams[0].name}.` : "Balance looks healthy across ministry areas."}`
        : "Add teams and positions to see balance insights.",
    },
    {
      icon: Heart,
      color: "rose",
      title: "Volunteer Recognition Spotlight",
      detail: topByHours.length > 0
        ? `${topByHours.map((v) => `${v.name} (${v.hours}h)`).join(", ")} are your most dedicated servants by hours logged. A personal thank-you, public shout-out, or small gift card can go a long way — faithful volunteers who feel seen stay longer.`
        : "Start tracking volunteer hours to identify your most faithful servants for recognition.",
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

      {/* Grace AI Volunteer Insights */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Volunteer Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {volunteerInsights.map((insight) => {
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
