"use client";

import { useState } from "react";
import {
  Workflow,
  Play,
  Pause,
  Trash2,
  Plus,
  Mail,
  MessageSquare,
  Clock,
  Tag,
  Bell,
  Footprints,
  Users,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast";
import { WORKFLOW_TEMPLATES } from "@/lib/workflows";

// ─── Types ──────────────────────────────────────────────

interface WorkflowStep {
  id: string;
  sortOrder: number;
  type: string;
  config: Record<string, unknown>;
}

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  status: string;
  stepsCount: number;
  steps: WorkflowStep[];
  totalExecutions: number;
  executionStats: Record<string, number>;
  createdAt: string;
}

interface ExecutionData {
  id: string;
  workflowName: string;
  memberName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

interface AutomationClientProps {
  data: {
    workflows: WorkflowData[];
    recentExecutions: ExecutionData[];
    canManage: boolean;
  };
}

// ─── Constants ──────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  ALERT_ATTENDANCE_DROP: "Attendance Drop Alert",
  ALERT_GIVING_DECLINE: "Giving Decline Alert",
  ALERT_VOLUNTEER_BURNOUT: "Volunteer Burnout Alert",
  ALERT_VISITOR_FOLLOWUP_MISSED: "Visitor Follow-Up Missed",
  ALERT_GROUP_HEALTH_WARNING: "Group Health Warning",
  ALERT_BACKGROUND_CHECK_EXPIRING: "Background Check Expiring",
  ALERT_PASTORAL_CARE_OVERDUE: "Pastoral Care Overdue",
  ALERT_THRESHOLD_BREACH: "Threshold Breach",
  ENGAGEMENT_TIER_CHANGE: "Engagement Tier Change",
  LIFE_EVENT: "Life Event Recorded",
  VISITOR_FIRST_TIME: "First-Time Visitor",
  MEMBER_INACTIVE_30: "Inactive 30 Days",
  MEMBER_INACTIVE_60: "Inactive 60 Days",
  MEMBER_INACTIVE_90: "Inactive 90 Days",
  MANUAL: "Manual Trigger",
};

const STEP_META: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  SEND_EMAIL: { label: "Send Email", icon: Mail, color: "text-blue-500" },
  SEND_SMS: { label: "Send SMS", icon: MessageSquare, color: "text-green-500" },
  CREATE_TASK: { label: "Create Task", icon: ClipboardCheck, color: "text-amber-500" },
  WAIT_DAYS: { label: "Wait", icon: Clock, color: "text-slate-400" },
  UPDATE_TAG: { label: "Add Tag", icon: Tag, color: "text-purple-500" },
  NOTIFY_STAFF: { label: "Notify Staff", icon: Bell, color: "text-rose-500" },
  ENROLL_GROWTH_TRACK: { label: "Enroll Growth Track", icon: Footprints, color: "text-teal-500" },
  ADD_TO_GROUP: { label: "Add to Group", icon: Users, color: "text-cyan-500" },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PAUSED: { label: "Paused", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300" },
  ARCHIVED: { label: "Archived", className: "bg-slate-100 text-slate-400 dark:bg-dark-700 dark:text-dark-400" },
};

const EXEC_STATUS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  RUNNING: { icon: Loader2, color: "text-blue-500" },
  COMPLETED: { icon: CheckCircle2, color: "text-emerald-500" },
  FAILED: { icon: XCircle, color: "text-rose-500" },
  CANCELLED: { icon: XCircle, color: "text-slate-400" },
};

// ─── Component ──────────────────────────────────────────

export function AutomationClient({ data }: AutomationClientProps) {
  const [workflows, setWorkflows] = useState(data.workflows);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((s) => s.add);

  async function activateTemplate(index: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateIndex: index }),
      });
      if (!res.ok) throw new Error("Failed to create workflow");
      const workflow = await res.json();
      setWorkflows((prev) => [
        {
          ...workflow,
          stepsCount: workflow.steps?.length ?? 0,
          totalExecutions: 0,
          executionStats: {},
          createdAt: workflow.createdAt,
        },
        ...prev,
      ]);
      addToast("success", `Workflow "${workflow.name}" activated`);
      setShowTemplates(false);
    } catch {
      addToast("error", "Failed to activate workflow");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
      );
      addToast("success", `Workflow ${newStatus === "ACTIVE" ? "activated" : "paused"}`);
    } catch {
      addToast("error", "Failed to update workflow");
    }
  }

  async function deleteWorkflow(id: string) {
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      addToast("success", "Workflow deleted");
    } catch {
      addToast("error", "Failed to delete workflow");
    }
  }

  const activeCount = workflows.filter((w) => w.status === "ACTIVE").length;
  const totalExecutions = workflows.reduce((sum, w) => sum + w.totalExecutions, 0);
  const runningExecutions = data.recentExecutions.filter((e) => e.status === "RUNNING").length;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
            Care Automation
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
            AI-powered workflows that turn alerts into action
          </p>
        </div>
        {data.canManage && (
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn bg-violet-600 text-white hover:bg-violet-700 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Workflow
          </button>
        )}
      </div>

      {/* ── Stats Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <Workflow className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-dark-50">{activeCount}</p>
            <p className="text-xs text-slate-500 dark:text-dark-300">Active Workflows</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-dark-50">{totalExecutions}</p>
            <p className="text-xs text-slate-500 dark:text-dark-300">Total Executions</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-dark-50">{runningExecutions}</p>
            <p className="text-xs text-slate-500 dark:text-dark-300">Currently Running</p>
          </div>
        </div>
      </div>

      {/* ── Template Gallery ───────────────────────────── */}
      {showTemplates && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-dark-50">
              Workflow Templates
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-dark-300">
            Pre-built care workflows powered by Grace AI. Activate one to start automating.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW_TEMPLATES.map((template, i) => {
              const alreadyActive = workflows.some(
                (w) => w.name === template.name && w.status !== "ARCHIVED"
              );
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 p-4 transition-all hover:border-violet-300 hover:shadow-md dark:border-dark-600 dark:hover:border-violet-500/50"
                >
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-dark-300 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-dark-600 dark:text-dark-300">
                      {TRIGGER_LABELS[template.trigger] ?? template.trigger}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {template.steps.length} steps
                    </span>
                  </div>
                  <button
                    onClick={() => activateTemplate(i)}
                    disabled={loading || alreadyActive}
                    className={cn(
                      "mt-3 w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      alreadyActive
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-dark-700 dark:text-dark-400"
                        : "bg-violet-600 text-white hover:bg-violet-700"
                    )}
                  >
                    {alreadyActive ? "Already Active" : "Activate"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Workflow List ──────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
          Your Workflows
        </h2>

        {workflows.length === 0 ? (
          <div className="card py-12 text-center">
            <Workflow className="mx-auto h-12 w-12 text-slate-300 dark:text-dark-500" />
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-dark-200">
              No workflows yet
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
              Add a workflow from the templates above to get started
            </p>
          </div>
        ) : (
          workflows.map((workflow) => {
            const expanded = expandedId === workflow.id;
            const badge = STATUS_BADGE[workflow.status] ?? STATUS_BADGE.DRAFT;

            return (
              <div
                key={workflow.id}
                className="card overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  className="flex cursor-pointer items-center gap-3"
                  onClick={() => setExpandedId(expanded ? null : workflow.id)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <Workflow className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-dark-50">
                        {workflow.name}
                      </h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", badge.className)}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500 dark:text-dark-300">
                      <span>{TRIGGER_LABELS[workflow.trigger] ?? workflow.trigger}</span>
                      <span>·</span>
                      <span>{workflow.stepsCount} steps</span>
                      <span>·</span>
                      <span>{workflow.totalExecutions} runs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {data.canManage && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(workflow.id, workflow.status);
                          }}
                          title={workflow.status === "ACTIVE" ? "Pause" : "Activate"}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-dark-700"
                        >
                          {workflow.status === "ACTIVE" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWorkflow(workflow.id);
                          }}
                          title="Delete"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded: step timeline */}
                {expanded && (
                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-dark-600">
                    {workflow.description && (
                      <p className="mb-3 text-xs text-slate-500 dark:text-dark-300">
                        {workflow.description}
                      </p>
                    )}
                    <div className="space-y-0">
                      {workflow.steps.map((step, i) => {
                        const meta = STEP_META[step.type] ?? { label: step.type, icon: Zap, color: "text-slate-400" };
                        const StepIcon = meta.icon;
                        const isLast = i === workflow.steps.length - 1;

                        return (
                          <div key={step.id} className="flex gap-3">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white dark:border-dark-500 dark:bg-dark-800", meta.color)}>
                                <StepIcon className="h-3.5 w-3.5" />
                              </div>
                              {!isLast && (
                                <div className="w-px flex-1 bg-slate-200 dark:bg-dark-600" />
                              )}
                            </div>
                            {/* Step content */}
                            <div className={cn("pb-4", isLast && "pb-0")}>
                              <p className="text-xs font-semibold text-slate-700 dark:text-dark-100">
                                {meta.label}
                                {step.type === "WAIT_DAYS" && (
                                  <span className="ml-1 font-normal text-slate-400">
                                    — {(step.config.days as number) ?? 1} day{((step.config.days as number) ?? 1) !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </p>
                              {step.type === "SEND_EMAIL" && (
                                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-dark-400 line-clamp-1">
                                  Subject: {step.config.subject as string}
                                </p>
                              )}
                              {step.type === "SEND_SMS" && (
                                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-dark-400 line-clamp-1">
                                  {step.config.body as string}
                                </p>
                              )}
                              {step.type === "CREATE_TASK" && (
                                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-dark-400 line-clamp-1">
                                  → {step.config.assignTo as string}
                                </p>
                              )}
                              {step.type === "NOTIFY_STAFF" && (
                                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-dark-400 line-clamp-1">
                                  {step.config.title as string}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Execution stats */}
                    {workflow.totalExecutions > 0 && (
                      <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 dark:border-dark-600">
                        {Object.entries(workflow.executionStats).map(([status, count]) => {
                          const meta = EXEC_STATUS[status];
                          if (!meta) return null;
                          const Icon = meta.icon;
                          return (
                            <div key={status} className="flex items-center gap-1.5">
                              <Icon className={cn("h-3.5 w-3.5", meta.color, status === "RUNNING" && "animate-spin")} />
                              <span className="text-xs text-slate-600 dark:text-dark-200">
                                {count} {status.toLowerCase()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Recent Activity ────────────────────────────── */}
      {data.recentExecutions.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-dark-50">
            Recent Workflow Activity
          </h2>
          <div className="space-y-2">
            {data.recentExecutions.slice(0, 10).map((exec) => {
              const meta = EXEC_STATUS[exec.status] ?? EXEC_STATUS.RUNNING;
              const Icon = meta.icon;
              return (
                <div
                  key={exec.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-dark-700"
                >
                  <Icon className={cn("h-4 w-4 shrink-0", meta.color, exec.status === "RUNNING" && "animate-spin")} />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-700 dark:text-dark-100">
                      {exec.workflowName}
                    </span>
                    <span className="mx-1.5 text-slate-400">→</span>
                    <span className="text-slate-600 dark:text-dark-200">
                      {exec.memberName}
                    </span>
                  </div>
                  <span className="shrink-0 text-slate-400 dark:text-dark-400">
                    {new Date(exec.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
