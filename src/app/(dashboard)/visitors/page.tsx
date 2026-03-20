import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getVisitors } from "@/lib/queries";
import { redirect } from "next/navigation";
import { UserPlus, Mail, CheckCircle2, Users } from "lucide-react";

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default async function VisitorsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'visitors:view')) return <AccessDenied />;
  const visitors = await getVisitors(session.churchId);

  const totalVisitors = visitors.length;
  const withGroups = visitors.filter((v) => v._count.groupMemberships > 0).length;
  const returning = visitors.filter((v) => v._count.attendanceRecords > 1).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Visitor Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Track first-time guests through your assimilation pathway.
        </p>
      </div>

      {/* Funnel KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Total Visitors</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{totalVisitors}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Returning Guests</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{returning}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Connected to Group</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{withGroups}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/20">
              <Mail className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Awaiting Follow-Up</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">
                {totalVisitors - withGroups - returning > 0 ? totalVisitors - withGroups - returning : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-600">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Visitor</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Campus</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">First Visit</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Visits</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Connected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {getInitials(visitor.firstName, visitor.lastName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-dark-50">
                          {visitor.firstName} {visitor.lastName}
                        </p>
                        {visitor.email && (
                          <p className="text-xs text-slate-400 dark:text-dark-400">{visitor.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-dark-200">
                    {visitor.primaryCampus?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-dark-200" suppressHydrationWarning>
                    {formatDate(visitor.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-dark-50">
                    {visitor._count.attendanceRecords || 1}
                  </td>
                  <td className="px-4 py-3">
                    {visitor._count.groupMemberships > 0 ? (
                      <span className="badge bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Yes
                      </span>
                    ) : (
                      <span className="badge bg-slate-100 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                        Not yet
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visitors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-slate-300 dark:text-dark-400" />
              <p className="mt-3 text-sm text-slate-500 dark:text-dark-300">No visitors recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
