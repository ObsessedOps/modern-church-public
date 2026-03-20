import { getServerSession } from "@/lib/server-auth";
import { getCampuses } from "@/lib/queries";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { Building2, MapPin, Phone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300",
  LAUNCHING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default async function CampusesPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'campuses:view')) return <AccessDenied />;
  const campuses = await getCampuses(session.churchId);
  const activeCampuses = campuses.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Multi-Site Operations
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Campus profiles, performance metrics, and cross-site analytics.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <span className="text-xs text-emerald-600 dark:text-emerald-400">{activeCampuses} Active</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 dark:border-dark-500 dark:bg-dark-700">
          <span className="text-xs text-slate-500 dark:text-dark-300">{campuses.length} Total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {campuses.map((campus) => (
          <div key={campus.id} className="card relative overflow-hidden transition-shadow hover:shadow-lg">
            {campus.isMainCampus && (
              <div className="absolute right-4 top-4">
                <span className="badge bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  Main Campus
                </span>
              </div>
            )}
            <div className="absolute left-0 right-0 top-0 h-1 bg-violet-500" />

            <div className="flex items-start gap-4 pt-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/20">
                <Building2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-dark-50">{campus.name}</h3>
                <span className={cn("badge mt-1 text-[10px]", STATUS_COLORS[campus.status] ?? STATUS_COLORS.ACTIVE)}>
                  {campus.status}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {campus.address && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-dark-400" />
                  {campus.address}{campus.city ? `, ${campus.city}` : ""}{campus.state ? `, ${campus.state}` : ""} {campus.zip}
                </div>
              )}
              {campus.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                  <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-dark-400" />
                  {campus.phone}
                </div>
              )}
              {campus.pastorName && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                  <Users className="h-3.5 w-3.5 text-slate-400 dark:text-dark-400" />
                  Campus Pastor: <span className="font-medium text-slate-700 dark:text-dark-100">{campus.pastorName}</span>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-dark-600">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-dark-50">{campus.avgWeeklyAttendance ?? "—"}</p>
                <p className="text-[10px] text-slate-400 dark:text-dark-400">Avg Attendance</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-dark-50">{campus.seatingCapacity ?? "—"}</p>
                <p className="text-[10px] text-slate-400 dark:text-dark-400">Capacity</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-dark-50">
                  {campus.avgWeeklyAttendance && campus.seatingCapacity
                    ? `${Math.round((campus.avgWeeklyAttendance / campus.seatingCapacity) * 100)}%`
                    : "—"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-dark-400">Utilization</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
