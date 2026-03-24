import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getMembers } from "@/lib/queries";
import { Users, Search, Sparkles, TrendingUp, AlertTriangle, Heart, Footprints } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MessageActions } from "@/components/messaging/MessageActions";

const STATUS_COLORS: Record<string, string> = {
  VISITOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ATTENDEE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MEMBER:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  INACTIVE:
    "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300",
  TRANSFERRED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DECEASED:
    "bg-slate-200 text-slate-500 dark:bg-dark-700 dark:text-dark-400",
};

const TIER_COLORS: Record<string, string> = {
  CHAMPION:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ENGAGED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CASUAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AT_RISK:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DISENGAGED:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatTier(tier: string): string {
  return tier.replace("_", " ");
}

function formatDate(date: Date | string | null): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CongregationPage() {
  const session = await getServerSession();
  if (!can(session, 'members:view')) return <AccessDenied />;
  const members = await getMembers(session.churchId);

  // Compute member insights
  const champions = members.filter((m) => m.engagementTier === "CHAMPION");
  const engaged = members.filter((m) => m.engagementTier === "ENGAGED");
  const atRisk = members.filter((m) => m.engagementTier === "AT_RISK");
  const disengaged = members.filter((m) => m.engagementTier === "DISENGAGED");
  const healthyCount = champions.length + engaged.length;
  const concernCount = atRisk.length + disengaged.length;
  const healthyPct = members.length > 0 ? ((healthyCount / members.length) * 100).toFixed(0) : "0";

  // New member momentum — joined in last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const newMembers = members.filter((m) => m.memberSince && new Date(m.memberSince) >= ninetyDaysAgo);

  // At-risk names (up to 3)
  const atRiskNames = atRisk.slice(0, 3).map((m) => `${m.firstName} ${m.lastName}`);

  // Family connections
  const withFamily = members.filter((m) => m.familyUnitId != null);
  const soloMembers = members.filter((m) => m.familyUnitId == null);
  const familyPct = members.length > 0 ? ((withFamily.length / members.length) * 100).toFixed(0) : "0";

  // Growth track pipeline
  const inGrowthTrack = members.filter((m) => m._count.growthTracks > 0);

  const memberInsights = [
    {
      icon: TrendingUp,
      color: "emerald",
      title: `${healthyPct}% Engagement Health`,
      detail: `${healthyCount} members are Champions or Engaged, while ${concernCount} are At-Risk or Disengaged. ${healthyCount > concernCount ? "Your congregation is trending healthy — keep investing in connection points." : "Consider launching targeted re-engagement campaigns for the at-risk segment."}`,
    },
    {
      icon: Sparkles,
      color: "blue",
      title: `${newMembers.length} New Members in 90 Days`,
      detail: `${newMembers.length > 0 ? `${newMembers.slice(0, 3).map((m) => m.firstName).join(", ")}${newMembers.length > 3 ? ` and ${newMembers.length - 3} others` : ""} joined recently.` : "No new members in the last 90 days."} ${newMembers.length >= 5 ? "Momentum is strong — make sure your assimilation pathway is keeping up." : "Consider a guest follow-up campaign to boost new member conversion."}`,
    },
    {
      icon: AlertTriangle,
      color: "amber",
      title: `${atRisk.length} At-Risk Member${atRisk.length !== 1 ? "s" : ""} Need Attention`,
      detail: `${atRiskNames.length > 0 ? `${atRiskNames.join(", ")}${atRisk.length > 3 ? ` and ${atRisk.length - 3} more` : ""} show declining engagement.` : "No at-risk members detected."} ${atRisk.length > 0 ? "A personal phone call or coffee invite from a group leader could make the difference." : "Great job keeping everyone connected!"}`,
    },
    {
      icon: Heart,
      color: "rose",
      title: `${familyPct}% Connected to Family Units`,
      detail: `${withFamily.length} members belong to a family unit while ${soloMembers.length} are unlinked. ${soloMembers.length > 0 ? "Review solo records — some may be family members who haven't been connected yet, which affects household giving and communication accuracy." : "All members are linked to family units."}`,
    },
    {
      icon: Footprints,
      color: "violet",
      title: `${inGrowthTrack.length} in Growth Track Pipeline`,
      detail: `${inGrowthTrack.length > 0 ? `${inGrowthTrack.length} member${inGrowthTrack.length !== 1 ? "s are" : " is"} actively progressing through the discipleship pathway.` : "No members are currently in a growth track."} ${members.length > 0 && inGrowthTrack.length < members.length * 0.2 ? "Less than 20% of your congregation is in a growth track — consider promoting the next cohort from the pulpit." : "Healthy pipeline participation."}`,
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
            Congregation
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
            {members.length.toLocaleString()} members across all campuses
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="flex items-center gap-2 rounded-btn border border-slate-200 bg-slate-50 px-3 py-2 dark:border-dark-500 dark:bg-dark-700">
          <Search className="h-4 w-4 text-slate-400 dark:text-dark-300" />
          <input
            type="text"
            placeholder="Search members by name, email, or phone..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-dark-50 dark:placeholder:text-dark-400"
            disabled
          />
        </div>
        <p className="mt-1 px-1 text-xs text-slate-400 dark:text-dark-400">
          Client-side search will be enabled with a search component.
        </p>
      </div>

      {/* Grace AI Member Insights */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Member Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {memberInsights.map((insight) => {
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

      {/* Members Table */}
      {members.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-slate-300 dark:text-dark-400" />
            <h2 className="mt-4 text-sm font-semibold text-slate-500 dark:text-dark-300">
              No members yet
            </h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
              Members will appear here once imported or added.
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-600">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Campus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Groups
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Last Activity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/members/${member.id}`}
                        className="font-medium text-slate-900 hover:text-violet-600 dark:text-dark-50 dark:hover:text-violet-400"
                      >
                        {member.firstName} {member.lastName}
                      </Link>
                      {member.email && (
                        <p className="text-xs text-slate-500 dark:text-dark-300">
                          {member.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-dark-200">
                      {member.primaryCampusId ? "Campus" : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${STATUS_COLORS[member.membershipStatus] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {member.membershipStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${TIER_COLORS[member.engagementTier] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {formatTier(member.engagementTier)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-dark-200">
                      {member._count.groupMemberships}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-dark-300">
                      {formatDate(member.lastActivityAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MessageActions
                        name={`${member.firstName} ${member.lastName}`}
                        email={member.email}
                        phone={member.phone}
                        context={`Member: ${member.firstName} ${member.lastName}, Status: ${member.membershipStatus}, Engagement: ${member.engagementTier}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
