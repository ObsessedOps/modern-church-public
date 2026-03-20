"use client";

import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  UserPlus,
  Heart,
  HandHeart,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Mail,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGracePanelStore } from "@/stores/grace-panel";

// Mock data matching what Grace AI would surface
const briefingData = {
  summary:
    "Strong week across the board. Attendance and giving both trending up, but 23 members need attention and Easter prep has a staffing gap at Westside.",
  highlights: [
    {
      icon: TrendingUp,
      label: "Attendance Momentum",
      value: "+3.2%",
      detail: "4,237 total — best week since January. Downtown led with +47 attendees.",
      color: "emerald",
    },
    {
      icon: Heart,
      label: "Giving Strong",
      value: "+8.1%",
      detail: "$127,450 this week. 4% over budget. YTD tracking 108% to goal.",
      color: "emerald",
    },
    {
      icon: UserPlus,
      label: "Visitor Pipeline",
      value: "43 guests",
      detail: "38 of 43 first-time visitors contacted within 48 hours. 5 still pending.",
      color: "blue",
    },
    {
      icon: HandHeart,
      label: "Volunteer Coverage",
      value: "91% filled",
      detail: "847 active volunteers. 12 new this month. 3 gaps for Easter at Westside Kids.",
      color: "amber",
    },
  ],
  actions: [
    {
      priority: "critical",
      title: "Westside Kids Ministry — Easter Staffing Gap",
      description:
        "3 volunteer positions unfilled for Easter Sunday. Grace AI identified 8 qualified members who haven't been asked yet.",
      cta: "View Qualified Members",
    },
    {
      priority: "warning",
      title: "23 Members Showing Disengagement",
      description:
        "Previously regular attenders (3x/month for 6+ months) who haven't been seen in 30+ days. Giving also declining for 15 of them.",
      cta: "View At-Risk Members",
    },
    {
      priority: "info",
      title: "5 First-Time Visitors Awaiting Follow-Up",
      description:
        "Guests from last Sunday who haven't received a personal outreach yet. Grace AI has draft messages ready.",
      cta: "Draft Messages",
    },
  ],
  disengaged: [
    { name: "David & Lisa Johnson", campus: "Downtown", weeks: 5, givingStopped: true },
    { name: "Carlos Martinez", campus: "Westside", weeks: 4, givingStopped: true },
    { name: "Rachel Kim", campus: "Downtown", weeks: 3, givingStopped: false },
    { name: "Tom & Sarah Williams", campus: "North", weeks: 6, givingStopped: true },
    { name: "Angela Davis", campus: "Westside", weeks: 3, givingStopped: false },
  ],
  easterReadiness: {
    percent: 78,
    complete: ["Sermon series finalized", "Worship sets planned", "Egg hunt logistics confirmed", "Invite campaign sent (67% open rate)"],
    pending: ["Westside Kids volunteers (3 needed)", "Parking team overflow plan", "Baptism candidate confirmations (14 registered, 11 confirmed)"],
  },
};

const priorityStyles = {
  critical: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    dot: "bg-rose-500",
    label: "CRITICAL",
    labelColor: "text-rose-600 dark:text-rose-400",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    dot: "bg-amber-500",
    label: "ACTION NEEDED",
    labelColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    dot: "bg-blue-500",
    label: "FOLLOW UP",
    labelColor: "text-blue-600 dark:text-blue-400",
  },
};

export function GraceBriefing() {
  const openGrace = useGracePanelStore((s) => s.open);

  return (
    <div className="space-y-4">
      {/* ── Briefing Header ── */}
      <div className="card relative overflow-hidden border border-violet-500/20">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />
        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-dark-50">
                Grace AI Daily Briefing
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-dark-200">
                {briefingData.summary}
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
          {briefingData.highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.label}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  h.color === "emerald" && "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
                  h.color === "blue" && "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
                  h.color === "amber" && "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      h.color === "emerald" && "text-emerald-500",
                      h.color === "blue" && "text-blue-500",
                      h.color === "amber" && "text-amber-500"
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
                    h.color === "amber" && "text-amber-600 dark:text-amber-400"
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

      {/* ── Action Items + Disengagement + Easter ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Action Items */}
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Action Items
            </h3>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              {briefingData.actions.length}
            </span>
          </div>
          <div className="space-y-3">
            {briefingData.actions.map((action) => {
              const style = priorityStyles[action.priority as keyof typeof priorityStyles];
              return (
                <div
                  key={action.title}
                  className={cn(
                    "rounded-lg border p-3",
                    style.border,
                    style.bg
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", style.dot)} />
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", style.labelColor)}>
                      {style.label}
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-xs font-semibold text-slate-900 dark:text-dark-50">
                    {action.title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-dark-200">
                    {action.description}
                  </p>
                  <button className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">
                    {action.cta}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* At-Risk Members */}
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Disengagement Watch
            </h3>
          </div>
          <p className="mb-3 text-[11px] text-slate-500 dark:text-dark-300">
            Previously regular members who&apos;ve gone quiet. Grace AI flagged these for pastoral follow-up.
          </p>
          <div className="space-y-2">
            {briefingData.disengaged.map((member) => (
              <div
                key={member.name}
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
                    <span className="text-[10px] text-rose-500">
                      {member.weeks}w absent
                    </span>
                    {member.givingStopped && (
                      <span className="text-[10px] text-amber-500">
                        Giving stopped
                      </span>
                    )}
                  </div>
                </div>
                <button className="rounded-lg p-1 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400">
                  <Mail className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={openGrace}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-dark-500 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10 dark:hover:text-violet-400"
          >
            Ask Grace to draft outreach
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Easter Readiness */}
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Easter Readiness
            </h3>
            <span className="ml-auto text-sm font-bold text-violet-600 dark:text-violet-400">
              {briefingData.easterReadiness.percent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-600">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all"
              style={{ width: `${briefingData.easterReadiness.percent}%` }}
            />
          </div>

          {/* Complete items */}
          <div className="mb-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Complete
            </p>
            <div className="space-y-1.5">
              {briefingData.easterReadiness.complete.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  <span className="text-[11px] text-slate-600 dark:text-dark-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending items */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Needs Attention
            </p>
            <div className="space-y-1.5">
              {briefingData.easterReadiness.pending.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  <span className="text-[11px] text-slate-600 dark:text-dark-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
