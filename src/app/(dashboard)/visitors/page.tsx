import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getVisitors } from "@/lib/queries";
import { redirect } from "next/navigation";
import {
  UserPlus,
  Mail,
  CheckCircle2,
  Users,
  Footprints,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysAgo(d: Date | string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

type PipelineStage = "new" | "contacted" | "returning" | "connected" | "growing";

const STAGES: { key: PipelineStage; label: string; color: string; bgColor: string; icon: typeof UserPlus }[] = [
  { key: "new", label: "New Visitor", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/20", icon: UserPlus },
  { key: "contacted", label: "Contacted", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/20", icon: MessageSquare },
  { key: "returning", label: "Returning", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-100 dark:bg-violet-900/20", icon: Users },
  { key: "connected", label: "Connected", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/20", icon: CheckCircle2 },
  { key: "growing", label: "Growth Track", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/20", icon: Footprints },
];

function getStage(visitor: {
  _count: { attendanceRecords: number; groupMemberships: number; workflowExecutions: number };
  growthTracks: { id: string }[];
}): PipelineStage {
  if (visitor.growthTracks.length > 0) return "growing";
  if (visitor._count.groupMemberships > 0) return "connected";
  if (visitor._count.attendanceRecords > 1) return "returning";
  if (visitor._count.workflowExecutions > 0) return "contacted";
  return "new";
}

export default async function VisitorsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, "visitors:view")) return <AccessDenied />;
  const visitors = await getVisitors(session.churchId);

  // Compute pipeline stages
  const staged = visitors.map((v) => ({ ...v, stage: getStage(v) }));
  const stageCounts: Record<PipelineStage, number> = {
    new: 0,
    contacted: 0,
    returning: 0,
    connected: 0,
    growing: 0,
  };
  staged.forEach((v) => stageCounts[v.stage]++);

  const totalVisitors = visitors.length;
  const conversionRate =
    totalVisitors > 0
      ? Math.round(((stageCounts.connected + stageCounts.growing) / totalVisitors) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
            Follow-Up Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
            Track every visitor from first visit through connection
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 dark:bg-violet-900/20">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
            {conversionRate}% connection rate
          </span>
        </div>
      </div>

      {/* ── Pipeline Funnel ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-0">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const count = stageCounts[stage.key];
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.key} className="relative flex items-center">
              <div
                className={cn(
                  "flex w-full flex-col items-center rounded-xl px-3 py-4 transition-all sm:rounded-none sm:first:rounded-l-xl sm:last:rounded-r-xl",
                  count > 0 ? stage.bgColor : "bg-slate-50 dark:bg-dark-700"
                )}
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-dark-800/80", stage.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className={cn("mt-2 text-2xl font-bold", count > 0 ? "text-slate-900 dark:text-dark-50" : "text-slate-300 dark:text-dark-500")}>
                  {count}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  {stage.label}
                </p>
              </div>
              {!isLast && (
                <ArrowRight className="absolute -right-2 z-10 hidden h-4 w-4 text-slate-300 dark:text-dark-500 sm:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Visitor Cards ────────────────────────────────── */}
      {STAGES.map((stage) => {
        const stageVisitors = staged.filter((v) => v.stage === stage.key);
        if (stageVisitors.length === 0) return null;
        const Icon = stage.icon;

        return (
          <div key={stage.key}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className={cn("h-4 w-4", stage.color)} />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-dark-100">
                {stage.label}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                {stageVisitors.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stageVisitors.map((visitor) => {
                const days = daysAgo(visitor.createdAt);
                const execution = visitor.workflowExecutions[0];
                const growthTrack = visitor.growthTracks[0];

                return (
                  <div
                    key={visitor.id}
                    className="card flex items-start gap-3 transition-all hover:shadow-md"
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold", stage.bgColor, stage.color)}>
                      {getInitials(visitor.firstName, visitor.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                        {visitor.firstName} {visitor.lastName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-dark-300">
                        {visitor.primaryCampus && (
                          <span>{visitor.primaryCampus.name}</span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {days === 0 ? "Today" : `${days}d ago`}
                        </span>
                        <span>·</span>
                        <span>
                          {visitor._count.attendanceRecords}{" "}
                          visit{visitor._count.attendanceRecords !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Contact info */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {visitor.email && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                            <Mail className="h-2.5 w-2.5" />
                            {visitor.email}
                          </span>
                        )}
                        {visitor.phone && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {visitor.phone}
                          </span>
                        )}
                      </div>

                      {/* Workflow status */}
                      {execution && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              execution.status === "RUNNING"
                                ? "bg-blue-500 animate-pulse"
                                : execution.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                            )}
                          />
                          <span className="text-[10px] text-slate-500 dark:text-dark-300">
                            {execution.workflow.name}
                            {execution.status === "RUNNING" && " — in progress"}
                            {execution.status === "COMPLETED" && " — done"}
                          </span>
                        </div>
                      )}

                      {/* Growth track badge */}
                      {growthTrack && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                          <Footprints className="h-3 w-3" />
                          Growth Track: {growthTrack.currentStep}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {visitors.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-12">
          <UserPlus className="h-12 w-12 text-slate-300 dark:text-dark-400" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-dark-200">
            No visitors recorded yet
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
            Visitors will appear here as they're checked in at services
          </p>
        </div>
      )}
    </div>
  );
}
