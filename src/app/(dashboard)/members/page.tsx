import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getMembers } from "@/lib/queries";
import { Users, Search } from "lucide-react";
import Link from "next/link";

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
