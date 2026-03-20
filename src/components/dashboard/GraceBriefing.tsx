"use client";

import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  UserPlus,
  HandHeart,
  ArrowRight,
  ChevronRight,
  Mail,
  Calendar,
  CheckCircle2,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGracePanelStore } from "@/stores/grace-panel";

interface BriefingAlert {
  id: string;
  eventType: string;
  headline: string;
  summary: string | null;
  severity: string;
  memberNames: string[];
}

interface AtRiskMember {
  id: string;
  name: string;
  campus: string;
  tier: string;
  weeksAbsent: number | null;
}

interface BriefingData {
  attendance: { current: number; delta: number };
  giving: number;
  visitors: number;
  volunteerFillRate: number;
  filledPositions: number;
  totalPositions: number;
  alerts: BriefingAlert[];
  atRiskMembers: AtRiskMember[];
  pathways: { active: number; executionsThisWeek: number };
}

const severityStyles: Record<string, { border: string; bg: string; dot: string; label: string; labelColor: string }> = {
  CRITICAL: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    dot: "bg-rose-500",
    label: "CRITICAL",
    labelColor: "text-rose-600 dark:text-rose-400",
  },
  HIGH: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    dot: "bg-amber-500",
    label: "ACTION NEEDED",
    labelColor: "text-amber-600 dark:text-amber-400",
  },
  MEDIUM: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    dot: "bg-blue-500",
    label: "MONITOR",
    labelColor: "text-blue-600 dark:text-blue-400",
  },
  LOW: {
    border: "border-slate-500/30",
    bg: "bg-slate-500/5",
    dot: "bg-slate-400",
    label: "INFO",
    labelColor: "text-slate-600 dark:text-slate-400",
  },
};

const alertHrefMap: Record<string, string> = {
  ATTENDANCE_DROP: "/members",
  GIVING_DECLINE: "/giving",
  VOLUNTEER_BURNOUT: "/volunteers",
  VISITOR_FOLLOWUP_MISSED: "/visitors",
  GROUP_HEALTH_WARNING: "/groups",
  THRESHOLD_BREACH: "/growth-track",
};

// Easter readiness stays as seasonal mock data (would be a future feature)
const easterReadiness = {
  percent: 78,
  complete: ["Sermon series finalized", "Worship sets planned", "Egg hunt logistics confirmed", "Invite campaign sent (67% open rate)"],
  pending: ["Westside Kids volunteers (3 needed)", "Parking team overflow plan", "Baptism candidate confirmations (14 registered, 11 confirmed)"],
};

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${n.toLocaleString()}`;
}

// Role-specific briefing titles and focus areas
const ROLE_BRIEFING: Record<string, { title: string; focus: string }> = {
  SENIOR_PASTOR: { title: "Grace AI Daily Briefing", focus: "Full church health overview" },
  CAMPUS_PASTOR: { title: "Campus Briefing", focus: "Your campus at a glance" },
  YOUTH_PASTOR: { title: "Youth Ministry Briefing", focus: "Student engagement & growth" },
  KIDS_PASTOR: { title: "Kids Ministry Briefing", focus: "Children's ministry health" },
  WORSHIP_LEADER: { title: "Worship Team Briefing", focus: "Service planning & team readiness" },
  GROUPS_DIRECTOR: { title: "Groups Briefing", focus: "Small group health & engagement" },
  OUTREACH_DIRECTOR: { title: "Outreach Briefing", focus: "Visitor pipeline & follow-up" },
  ACCOUNTING: { title: "Finance Briefing", focus: "Giving trends & stewardship" },
  VOLUNTEER_LEADER: { title: "Volunteer Briefing", focus: "Team coverage & burnout risk" },
  READ_ONLY: { title: "Church Overview", focus: "Key metrics at a glance" },
};

// Which highlight card IDs each role sees
const ROLE_HIGHLIGHTS: Record<string, string[]> = {
  SENIOR_PASTOR: ["attendance", "visitors", "volunteers", "alerts", "pathways"],
  CAMPUS_PASTOR: ["attendance", "visitors", "volunteers", "alerts", "pathways"],
  YOUTH_PASTOR: ["attendance", "visitors", "volunteers", "pathways"],
  KIDS_PASTOR: ["attendance", "volunteers", "pathways"],
  WORSHIP_LEADER: ["attendance", "volunteers"],
  GROUPS_DIRECTOR: ["attendance", "visitors", "alerts"],
  OUTREACH_DIRECTOR: ["visitors", "attendance", "pathways", "alerts"],
  ACCOUNTING: ["attendance", "alerts"],
  VOLUNTEER_LEADER: ["volunteers", "attendance", "alerts"],
  READ_ONLY: ["attendance", "visitors"],
};

export function GraceBriefingSummary({ data, role = "SENIOR_PASTOR" }: { data: BriefingData; role?: string }) {
  const openGrace = useGracePanelStore((s) => s.open);

  const summary = buildSummary(data, role);
  const briefingMeta = ROLE_BRIEFING[role] ?? ROLE_BRIEFING.SENIOR_PASTOR;
  const visibleIds = ROLE_HIGHLIGHTS[role] ?? ROLE_HIGHLIGHTS.SENIOR_PASTOR;

  const allHighlights = [
    {
      id: "attendance",
      icon: data.attendance.delta >= 0 ? TrendingUp : TrendingDown,
      label: "Attendance",
      value: data.attendance.current > 0 ? `${data.attendance.delta >= 0 ? "+" : ""}${data.attendance.delta}%` : "—",
      detail: `${data.attendance.current.toLocaleString()} total this week`,
      color: data.attendance.delta >= 0 ? "emerald" : "rose",
    },
    {
      id: "visitors",
      icon: UserPlus,
      label: "Visitor Pipeline",
      value: `${data.visitors} guests`,
      detail: `New visitors this week`,
      color: "blue",
    },
    {
      id: "volunteers",
      icon: HandHeart,
      label: "Volunteer Coverage",
      value: `${data.volunteerFillRate}% filled`,
      detail: `${data.filledPositions} of ${data.totalPositions} positions active`,
      color: data.volunteerFillRate >= 85 ? "emerald" : "amber",
    },
    {
      id: "alerts",
      icon: AlertTriangle,
      label: "Active Alerts",
      value: String(data.alerts.length),
      detail: data.alerts.length > 0 ? `Highest: ${data.alerts[0].headline.slice(0, 50)}` : "No alerts — all clear",
      color: data.alerts.length >= 3 ? "rose" : data.alerts.length > 0 ? "amber" : "emerald",
    },
    {
      id: "pathways",
      icon: Workflow,
      label: "Pathways",
      value: `${data.pathways.active} active`,
      detail: `${data.pathways.executionsThisWeek} triggered this week`,
      color: data.pathways.executionsThisWeek > 0 ? "violet" : "blue",
    },
  ];

  const highlights = allHighlights.filter((h) => visibleIds.includes(h.id));

  return (
    <div className="card relative overflow-hidden border border-violet-500/20">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />
      <div className="flex items-start justify-between gap-4 pt-1">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-dark-50">
              {briefingMeta.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-dark-200">
              {summary}
            </p>
          </div>
        </div>
        <button
          onClick={openGrace}
          className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
        >
          Ask Grace
        </button>
      </div>

      {/* Highlight Cards */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {highlights.map((h) => {
          const Icon = h.icon;
          return (
            <div
              key={h.label}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                h.color === "emerald" && "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
                h.color === "blue" && "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
                h.color === "amber" && "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10",
                h.color === "rose" && "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10",
                h.color === "violet" && "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    h.color === "emerald" && "text-emerald-500",
                    h.color === "blue" && "text-blue-500",
                    h.color === "amber" && "text-amber-500",
                    h.color === "rose" && "text-rose-500",
                    h.color === "violet" && "text-violet-500"
                  )}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  {h.label}
                </span>
              </div>
              <p
                className={cn(
                  "mt-1.5 text-xl font-bold",
                  h.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                  h.color === "blue" && "text-blue-600 dark:text-blue-400",
                  h.color === "amber" && "text-amber-600 dark:text-amber-400",
                  h.color === "rose" && "text-rose-600 dark:text-rose-400",
                  h.color === "violet" && "text-violet-600 dark:text-violet-400"
                )}
              >
                {h.value}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-dark-200">
                {h.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GraceBriefingDetails({ data }: { data: BriefingData }) {
  const openGrace = useGracePanelStore((s) => s.open);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Action Items (from real alerts) */}
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Action Items
            </h3>
            {data.alerts.length > 0 && (
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                {data.alerts.length}
              </span>
            )}
          </div>
          {data.alerts.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm text-slate-500 dark:text-dark-300">All clear — no action items</p>
            </div>
          ) : (
            <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {data.alerts.map((alert) => {
                const style = severityStyles[alert.severity] ?? severityStyles.LOW;
                const href = alertHrefMap[alert.eventType] ?? "/alerts";
                return (
                  <div
                    key={alert.id}
                    className={cn("rounded-lg border p-3", style.border, style.bg)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", style.dot)} />
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", style.labelColor)}>
                        {style.label}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-xs font-semibold text-slate-900 dark:text-dark-50">
                      {alert.headline}
                    </h4>
                    {alert.summary && (
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-dark-200">
                        {alert.summary.length > 120 ? `${alert.summary.slice(0, 120)}...` : alert.summary}
                      </p>
                    )}
                    <Link href={href} className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">
                      View Details
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* At-Risk Members (from real engagement scores) */}
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Disengagement Watch
            </h3>
          </div>
          <p className="mb-3 text-[11px] text-slate-500 dark:text-dark-300">
            Members flagged as at-risk or disengaged by Grace AI&apos;s engagement scoring.
          </p>
          {data.atRiskMembers.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm text-slate-500 dark:text-dark-300">No at-risk members</p>
            </div>
          ) : (
            <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {data.atRiskMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 transition-colors hover:bg-slate-50 dark:border-dark-600 dark:hover:bg-dark-600"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-900 dark:text-dark-50">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 dark:text-dark-300">
                        {member.campus}
                      </span>
                      {member.weeksAbsent != null && member.weeksAbsent > 0 && (
                        <span className="text-[10px] text-rose-500">
                          {member.weeksAbsent}w absent
                        </span>
                      )}
                      <span className={cn(
                        "text-[10px]",
                        member.tier === "DISENGAGED" ? "text-rose-500" : "text-amber-500"
                      )}>
                        {member.tier === "DISENGAGED" ? "Disengaged" : "At Risk"}
                      </span>
                    </div>
                  </div>
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          )}
          <button
            onClick={openGrace}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-dark-500 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10 dark:hover:text-violet-400"
          >
            Ask Grace to draft outreach
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Easter Readiness (seasonal mock - future feature) */}
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Easter Readiness
            </h3>
            <span className="ml-auto text-sm font-bold text-violet-600 dark:text-violet-400">
              {easterReadiness.percent}%
            </span>
          </div>

          <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-600">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all"
              style={{ width: `${easterReadiness.percent}%` }}
            />
          </div>

          <div className="mb-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Complete
            </p>
            <div className="space-y-1.5">
              {easterReadiness.complete.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  <span className="text-[11px] text-slate-600 dark:text-dark-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Needs Attention
            </p>
            <div className="space-y-1.5">
              {easterReadiness.pending.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  <span className="text-[11px] text-slate-600 dark:text-dark-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}

/** @deprecated Use GraceBriefingSummary + GraceBriefingDetails instead */
export function GraceBriefing({ data }: { data: BriefingData }) {
  return (
    <div className="space-y-4">
      <GraceBriefingSummary data={data} />
      <GraceBriefingDetails data={data} />
    </div>
  );
}

function buildSummary(data: BriefingData, role: string): string {
  const parts: string[] = [];

  // Role-specific lead-ins
  const roleIntros: Record<string, string> = {
    YOUTH_PASTOR: "Here's what's happening with your students",
    KIDS_PASTOR: "Kids ministry update",
    WORSHIP_LEADER: "Worship team status",
    GROUPS_DIRECTOR: "Small groups pulse",
    OUTREACH_DIRECTOR: "Outreach & visitor update",
    ACCOUNTING: "Financial snapshot",
    VOLUNTEER_LEADER: "Volunteer team status",
  };

  if (roleIntros[role]) {
    parts.push(roleIntros[role]);
  }

  if (data.attendance.current > 0) {
    if (data.attendance.delta > 0) {
      parts.push(`Attendance is up ${data.attendance.delta}% with ${data.attendance.current.toLocaleString()} total`);
    } else if (data.attendance.delta < 0) {
      parts.push(`Attendance dipped ${Math.abs(data.attendance.delta)}% to ${data.attendance.current.toLocaleString()}`);
    } else {
      parts.push(`${data.attendance.current.toLocaleString()} in attendance this week`);
    }
  }

  if (data.visitors > 0 && ["SENIOR_PASTOR", "CAMPUS_PASTOR", "OUTREACH_DIRECTOR", "GROUPS_DIRECTOR"].includes(role)) {
    parts.push(`${data.visitors} new visitors`);
  }

  if (data.atRiskMembers.length > 0 && role !== "ACCOUNTING" && role !== "WORSHIP_LEADER") {
    parts.push(`${data.atRiskMembers.length} members need attention`);
  }

  if (data.alerts.length > 0) {
    parts.push(`${data.alerts.length} active alert${data.alerts.length > 1 ? "s" : ""}`);
  }

  if (data.volunteerFillRate < 90 && ["SENIOR_PASTOR", "CAMPUS_PASTOR", "VOLUNTEER_LEADER", "KIDS_PASTOR", "YOUTH_PASTOR", "WORSHIP_LEADER"].includes(role)) {
    parts.push(`volunteer coverage at ${data.volunteerFillRate}%`);
  }

  if (data.pathways.executionsThisWeek > 0 && role !== "ACCOUNTING" && role !== "WORSHIP_LEADER" && role !== "READ_ONLY") {
    parts.push(`${data.pathways.active} care pathways triggered ${data.pathways.executionsThisWeek} follow-ups this week`);
  } else if (data.pathways.active > 0 && ["SENIOR_PASTOR", "CAMPUS_PASTOR", "OUTREACH_DIRECTOR"].includes(role)) {
    parts.push(`${data.pathways.active} care pathways active and monitoring`);
  }

  return parts.length > 0
    ? parts.join(". ") + "."
    : "All systems looking healthy this week.";
}
