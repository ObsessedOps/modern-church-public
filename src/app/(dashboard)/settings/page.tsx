import { getServerSession } from "@/lib/server-auth";
import { getChurchProfile, getStaff } from "@/lib/queries";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { Building2, Plug, Users, MapPin, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'settings:view')) return <AccessDenied />;

  const [profile, staff] = await Promise.all([
    getChurchProfile(session.churchId),
    getStaff(session.churchId),
  ]);

  const { church, campuses, integrations, userCount } = profile;

  // Role counts
  const roleCounts = new Map<string, number>();
  for (const s of staff) {
    roleCounts.set(s.role, (roleCounts.get(s.role) ?? 0) + 1);
  }

  const activeIntegrations = integrations.filter((i) => i.status === "CONNECTED").length;
  const errorIntegrations = integrations.filter((i) => i.status === "ERROR").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Configure your church profile, integrations, and system preferences.
        </p>
      </div>

      {/* Church Profile */}
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-violet-500" />
            Church Profile
          </div>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">Name</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-dark-50">{church?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">Plan</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-dark-50">{church?.plan ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">Timezone</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-dark-50">{church?.timezone ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">Created</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-dark-50" suppressHydrationWarning>{formatDate(church?.createdAt ?? null)}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">Staff Accounts</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-dark-50">{userCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">Campuses</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-dark-50">{campuses.length}</p>
          </div>
        </div>
      </div>

      {/* Campuses */}
      <div className="card overflow-hidden">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            Campuses
          </div>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-600">
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Name</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Location</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Status</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Main</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
              {campuses.map((campus) => (
                <tr key={campus.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-dark-50">{campus.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-dark-200">
                    {campus.city ? `${campus.city}, ${campus.state ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "badge text-[10px]",
                      campus.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300"
                    )}>{campus.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {campus.isMainCampus ? (
                      <span className="badge bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Main</span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-dark-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integrations + User Roles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Integrations */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-emerald-500" />
              Integrations
            </div>
          </h3>
          <div className="mb-4 flex gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <span className="text-xs text-emerald-600 dark:text-emerald-400">{activeIntegrations} Active</span>
            </div>
            {errorIntegrations > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 dark:border-rose-500/20 dark:bg-rose-500/10">
                <span className="text-xs text-rose-600 dark:text-rose-400">{errorIntegrations} Error</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 dark:border-dark-600">
                {integration.status === "CONNECTED" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : integration.status === "ERROR" ? (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-dark-200">{integration.type.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-slate-400 dark:text-dark-400" suppressHydrationWarning>
                    Last sync: {integration.lastSyncAt ? formatDate(integration.lastSyncAt) : "Never"}
                  </p>
                </div>
                <span className={cn(
                  "badge text-[10px]",
                  integration.status === "CONNECTED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  integration.status === "ERROR" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}>{integration.status}</span>
              </div>
            ))}
            {integrations.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-dark-400">No integrations configured yet</p>
            )}
          </div>
        </div>

        {/* User Roles */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              User Accounts &amp; Roles
            </div>
          </h3>
          <div className="space-y-3">
            {Array.from(roleCounts.entries()).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 dark:border-dark-600">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-dark-200">
                    {role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-dark-50">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 dark:bg-dark-700">
            <p className="text-xs text-slate-500 dark:text-dark-300">
              <span className="font-medium text-slate-700 dark:text-dark-200">{userCount}</span> total user accounts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
