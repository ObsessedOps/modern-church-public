import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getGrowthTrackData } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Footprints, Users, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_CONFIG = {
  CONNECT: { label: "Connect", color: "bg-blue-500", lightBg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", order: 1 },
  DISCOVER: { label: "Discover", color: "bg-violet-500", lightBg: "bg-violet-100 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", order: 2 },
  SERVE: { label: "Serve", color: "bg-emerald-500", lightBg: "bg-emerald-100 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", order: 3 },
  COMPLETED: { label: "Completed", color: "bg-teal-500", lightBg: "bg-teal-100 dark:bg-teal-900/20", text: "text-teal-600 dark:text-teal-400", order: 4 },
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  STALLED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DROPPED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function GrowthTrackPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, "growth-track:view")) return <AccessDenied />;

  const data = await getGrowthTrackData(session.churchId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Growth Track
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Three-step discipleship pipeline: Connect, Discover, Serve.
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["CONNECT", "DISCOVER", "SERVE", "COMPLETED"] as const).map((step, i) => {
          const config = STEP_CONFIG[step];
          const count = data.stepCounts[step];
          return (
            <div key={step} className="card-bordered relative p-5">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.lightBg)}>
                  {step === "COMPLETED" ? (
                    <CheckCircle2 className={cn("h-5 w-5", config.text)} />
                  ) : (
                    <span className={cn("text-sm font-bold", config.text)}>{config.order}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-dark-300">{config.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{count}</p>
                </div>
              </div>
              {i < 3 && (
                <ArrowRight className="absolute right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-300 dark:text-dark-500 lg:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/20">
              <Footprints className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Total Enrolled</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.totalCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Active</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.activeCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Stalled</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{data.stalledCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 dark:border-dark-600">
          <h2 className="font-medium text-slate-800 dark:text-dark-100">All Participants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-dark-600 dark:text-dark-300">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Current Step</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Campus</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.tracks.map((track) => {
                const stepConfig = STEP_CONFIG[track.currentStep as keyof typeof STEP_CONFIG] ?? STEP_CONFIG.CONNECT;
                return (
                  <tr
                    key={track.id}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50 dark:border-dark-700 dark:hover:bg-dark-700/50"
                  >
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-dark-50">
                      {track.member.firstName} {track.member.lastName}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("badge text-[10px]", stepConfig.lightBg, stepConfig.text)}>
                        {stepConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("badge text-[10px]", STATUS_BADGE[track.status] ?? STATUS_BADGE.ACTIVE)}>
                        {track.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-dark-300">
                      {track.campus?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-dark-300">
                      {formatDate(track.connectStartedAt)}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-dark-300">
                      {formatDate(track.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.tracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Footprints className="h-12 w-12 text-slate-300 dark:text-dark-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-dark-300">No growth track participants yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
