"use client";

import {
  TrendingUp, UserPlus, Heart, HandHeart, Sparkles, Bell,
  Workflow, CheckCircle2, AlertTriangle, Users, Calendar,
  MessageCircle, ArrowRight, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Shared mini card wrapper ──────────────────────────────
function MiniCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white p-2.5 dark:border-dark-600 dark:bg-dark-800", className)}>
      {children}
    </div>
  );
}

function MiniKpi({ icon: Icon, color, label, value, sub }: {
  icon: typeof TrendingUp; color: string; label: string; value: string; sub: string;
}) {
  return (
    <MiniCard>
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", color)}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <div>
          <p className="text-[9px] text-slate-500">{label}</p>
          <p className="text-sm font-bold text-slate-900 dark:text-dark-50">{value}</p>
        </div>
      </div>
      <p className="mt-1 text-[8px] text-slate-400">{sub}</p>
    </MiniCard>
  );
}

// ── Step 1: Dashboard Overview ────────────────────────────
export function PreviewDashboard() {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <MiniKpi icon={Users} color="bg-violet-500" label="Weekend Attendance" value="2,142" sub="+1.7% vs last week" />
        <MiniKpi icon={UserPlus} color="bg-blue-500" label="New Visitors" value="32" sub="This week" />
        <MiniKpi icon={HandHeart} color="bg-amber-500" label="Volunteers" value="92%" sub="Coverage filled" />
        <MiniKpi icon={Heart} color="bg-rose-500" label="At Risk" value="5" sub="Members need attention" />
      </div>
      {/* Mini attendance chart */}
      <MiniCard>
        <p className="mb-1.5 text-[9px] font-semibold text-slate-500">Attendance Trend</p>
        <div className="flex items-end gap-[3px] h-10">
          {[62, 65, 60, 68, 64, 70, 66, 72, 69, 74, 71, 78].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/40 to-violet-500"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </MiniCard>
    </div>
  );
}

// ── Step 2: Daily Briefing ────────────────────────────────
export function PreviewBriefing() {
  return (
    <div className="space-y-2.5">
      {/* Mini briefing card */}
      <div className="rounded-lg border border-violet-500/20 bg-white p-3 dark:bg-dark-800">
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-900 dark:text-dark-50">Today&apos;s Briefing</p>
            <p className="text-[8px] text-slate-500">Attendance up 1.7%. 32 visitors. 5 members need attention.</p>
          </div>
        </div>
        {/* Mini highlight cards */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Attendance", value: "+1.7%", color: "border-emerald-500/20 bg-emerald-500/5", textColor: "text-emerald-600" },
            { label: "Visitors", value: "32 guests", color: "border-blue-500/20 bg-blue-500/5", textColor: "text-blue-600" },
            { label: "Volunteers", value: "92% filled", color: "border-amber-500/20 bg-amber-500/5", textColor: "text-amber-600" },
            { label: "Alerts", value: "5 active", color: "border-rose-500/20 bg-rose-500/5", textColor: "text-rose-600" },
          ].map((h) => (
            <div key={h.label} className={cn("rounded-md border p-1.5", h.color)}>
              <p className="text-[7px] font-semibold uppercase tracking-wider text-slate-400">{h.label}</p>
              <p className={cn("text-xs font-bold", h.textColor)}>{h.value}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Mini trend card */}
      <MiniCard className="border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <div>
            <p className="text-[9px] font-semibold text-slate-700 dark:text-dark-200">Group Engagement +18%</p>
            <p className="text-[8px] text-slate-500">5 groups averaging 90%+ attendance</p>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

// ── Step 3: Insights Over Time ────────────────────────────
export function PreviewInsights() {
  return (
    <div className="space-y-2.5">
      <MiniCard className="border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-800 dark:text-dark-100">Volunteer gap detected</p>
            <p className="text-[8px] text-slate-500">Kids Ministry short 3 volunteers for Easter Sunday</p>
          </div>
        </div>
      </MiniCard>
      <MiniCard className="border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
            <Users className="h-3 w-3 text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-800 dark:text-dark-100">Suggested volunteers</p>
            <p className="text-[8px] text-slate-500">Rachel Davis, Chris Patterson, Natalie Chen</p>
            <p className="text-[7px] text-blue-500 mt-0.5">Based on serving history &amp; availability</p>
          </div>
        </div>
      </MiniCard>
      <MiniCard className="border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-800 dark:text-dark-100">Visitor retention improving</p>
            <p className="text-[8px] text-slate-500">Return rate 23% → 34% over 8 weeks</p>
          </div>
        </div>
      </MiniCard>
      <MiniCard className="border-violet-500/20 bg-violet-500/5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
            <Calendar className="h-3 w-3 text-violet-500" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-800 dark:text-dark-100">Easter attendance forecast</p>
            <p className="text-[8px] text-slate-500">Projected +40% vs normal Sunday</p>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

// ── Step 4: Care Pathways ─────────────────────────────────
export function PreviewPathways() {
  return (
    <div className="space-y-2.5">
      {/* Pathway notification card */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-dark-600 dark:bg-dark-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/10">
            <Workflow className="h-3 w-3 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[9px] font-bold text-slate-900 dark:text-dark-50">Pathway Triggered</p>
              <span className="rounded-full bg-violet-100 px-1 py-px text-[7px] font-bold text-violet-700">LIVE</span>
            </div>
            <p className="text-[8px] text-slate-500">Attendance Drop Response</p>
          </div>
        </div>
        <div className="rounded-md bg-slate-50 p-2 dark:bg-dark-700">
          <p className="text-[8px] text-slate-600 dark:text-dark-300">Missed 3 consecutive weeks</p>
          <p className="text-[9px] font-semibold text-slate-800 dark:text-dark-100 mt-0.5">Marcus &amp; Tanya Williams</p>
        </div>
      </div>

      {/* Steps timeline */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-dark-600 dark:bg-dark-800">
        <p className="text-[9px] font-semibold text-slate-500 mb-2">Care Pathway Progress</p>
        <div className="space-y-2">
          {[
            { step: "Care check-in email", status: "complete", time: "Sent 2 hours ago" },
            { step: "Wait 3 days for response", status: "active", time: "In progress" },
            { step: "Pastor follow-up call", status: "pending", time: "Scheduled Thursday" },
            { step: "Personal home visit", status: "pending", time: "If no response" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                s.status === "complete" ? "bg-emerald-500" : s.status === "active" ? "bg-violet-500 animate-pulse" : "bg-slate-200 dark:bg-dark-600"
              )}>
                {s.status === "complete" ? (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                ) : s.status === "active" ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : (
                  <span className="text-[7px] font-bold text-slate-400">{i + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[9px]", s.status === "complete" ? "text-emerald-600 font-medium" : s.status === "active" ? "text-violet-600 font-medium" : "text-slate-400")}>
                  {s.step}
                </p>
                <p className="text-[7px] text-slate-400">{s.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 5: Grace Chat ────────────────────────────────────
export function PreviewGrace() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-dark-600 dark:bg-dark-800 overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-dark-600">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600">
          <span className="text-[9px] font-bold text-white">G</span>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-900 dark:text-dark-50">Grace</p>
          <p className="text-[7px] text-emerald-500">Online</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-3 space-y-2.5">
        {/* User message */}
        <div className="flex justify-end">
          <div className="rounded-lg rounded-tr-sm bg-violet-600 px-2.5 py-1.5 max-w-[85%]">
            <p className="text-[9px] text-white">Who should I check in on this week?</p>
          </div>
        </div>

        {/* Grace response */}
        <div className="flex justify-start">
          <div className="rounded-lg rounded-tl-sm bg-slate-100 px-2.5 py-1.5 max-w-[90%] dark:bg-dark-700">
            <p className="text-[9px] text-slate-700 dark:text-dark-200 leading-relaxed">
              I&apos;d start with the <strong>Johnson family</strong>. They dropped from Engaged to At-Risk this month and haven&apos;t attended in 5 weeks. A personal call would mean a lot.
            </p>
            <p className="text-[9px] text-slate-700 dark:text-dark-200 leading-relaxed mt-1.5">
              <strong>Ashley Turner</strong> is also worth a check-in. She&apos;s been absent 7 weeks and her engagement score is at 22.
            </p>
            <p className="text-[9px] text-slate-700 dark:text-dark-200 leading-relaxed mt-1.5">
              Good news: the Williams family pathway already triggered a care email. You&apos;ll see a follow-up on your calendar Thursday.
            </p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1">
          {["How's our visitor retention?", "Volunteer burnout risk?"].map((q) => (
            <span key={q} className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[7px] font-medium text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400">
              {q}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
