import { getServerSession } from "@/lib/server-auth";
import { getIntegrations } from "@/lib/queries";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { IntegrationsGrid } from "@/components/integrations/IntegrationsGrid";

export default async function IntegrationsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'integrations:view')) return <AccessDenied />;

  const integrations = await getIntegrations(session.churchId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Connect Modern.Church to your existing platforms. We pull data automatically — you never change your workflow.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            {integrations.filter((i) => i.status === "CONNECTED").length} Connected
          </span>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {integrations.filter((i) => i.status === "ERROR" || i.status === "SYNCING").length} Needs Attention
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 dark:border-dark-500 dark:bg-dark-700">
          <span className="text-xs text-slate-500 dark:text-dark-300">
            {integrations.filter((i) => i.status === "DISCONNECTED").length} Available
          </span>
        </div>
      </div>

      {/* Integrations Grid */}
      <IntegrationsGrid integrations={JSON.parse(JSON.stringify(integrations))} />
    </div>
  );
}
