import { getServerSession } from "@/lib/server-auth";
import { getStaff } from "@/lib/queries";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { UserCog, Shield, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  SENIOR_PASTOR: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  EXECUTIVE_PASTOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CAMPUS_PASTOR: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  STAFF: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  READ_ONLY: "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300",
};

function formatRole(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default async function StaffPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'staff:view')) return <AccessDenied />;
  const staff = await getStaff(session.churchId);

  const roleCounts = new Map<string, number>();
  for (const s of staff) {
    roleCounts.set(s.role, (roleCounts.get(s.role) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Staff &amp; Team
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Manage staff accounts, roles, and permissions.
        </p>
      </div>

      {/* Role Summary */}
      <div className="flex flex-wrap gap-3">
        {Array.from(roleCounts.entries()).map(([role, count]) => (
          <div key={role} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 dark:border-dark-500 dark:bg-dark-700">
            <span className="text-xs text-slate-600 dark:text-dark-200">
              {count} {formatRole(role)}{count > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((user) => (
          <div key={user.id} className="card transition-shadow hover:shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">{user.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("badge text-[10px]", ROLE_COLORS[user.role] ?? ROLE_COLORS.STAFF)}>
                    {formatRole(user.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-dark-600">
              {user.email && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                  <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-dark-400" />
                  {user.email}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                <Shield className="h-3.5 w-3.5 text-slate-400 dark:text-dark-400" />
                {user.role === "SENIOR_PASTOR" || user.role === "EXECUTIVE_PASTOR" ? "Full access" : user.role === "CAMPUS_PASTOR" ? "Campus access" : user.role === "STAFF" ? "Staff access" : "Read-only"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
