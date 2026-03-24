"use client";

import { useState } from "react";
import {
  Sparkles,
  Heart,
  Calendar,
  Users,
  HandHeart,
  Gift,
  ChevronRight,
  Flame,
  Star,
  Church,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Baby,
  Crosshair,
  BookOpen,
  Send,
  FileText,
} from "lucide-react";

/* ─── Mock Data ─────────────────────────────────────── */

const MEMBER = {
  name: "Sarah",
  fullName: "Sarah Mitchell",
  avatar: "SM",
  campus: "Downtown Campus",
  memberSince: "September 2023",
  engagementTier: "Engaged",
  engagementScore: 74,
};

const GROWTH_TRACK = [
  { step: "Salvation", completed: true, date: "Oct 2023" },
  { step: "Baptism", completed: true, date: "Dec 2023" },
  { step: "Membership", completed: true, date: "Feb 2024" },
  { step: "Serve Team", completed: false, current: true },
  { step: "Lead Team", completed: false },
];

// 12-week attendance: true = attended, false = missed
const ATTENDANCE = [
  true, true, false, true, true, true,
  true, true, true, false, true, true,
];

const GROUPS = [
  { name: "Young Adults", day: "Wednesdays", time: "7:00 PM", nextMeeting: "Mar 26", leader: "Pastor Mike" },
  { name: "Women's Bible Study", day: "Tuesdays", time: "10:00 AM", nextMeeting: "Mar 25", leader: "Rachel Kim" },
];

const SERVING = [
  { team: "Kids Ministry", role: "Small Group Leader", nextDate: "Mar 30" },
  { team: "Welcome Team", role: "Greeter", nextDate: "Apr 6" },
];

const GIVING = {
  ytd: "$2,450",
  lastGift: "$200",
  lastGiftDate: "Mar 10",
  lastGiftFund: "General Fund",
  recurring: true,
  recurringAmount: "$200/mo",
};

const LIFE_EVENTS = [
  { event: "First Visit", date: "Sep 10, 2023", icon: Church, color: "violet" },
  { event: "Gave Life to Christ", date: "Oct 15, 2023", icon: Star, color: "amber" },
  { event: "Water Baptism", date: "Dec 3, 2023", icon: Heart, color: "blue" },
  { event: "Joined Young Adults Group", date: "Jan 2024", icon: Users, color: "emerald" },
  { event: "Completed Membership Class", date: "Feb 2024", icon: BookOpen, color: "violet" },
  { event: "Started Serving — Kids Ministry", date: "Mar 2024", icon: HandHeart, color: "rose" },
];

const FAMILY = [
  { name: "Tom Mitchell", relation: "Spouse", initials: "TM" },
  { name: "Lily Mitchell", relation: "Child (age 7)", initials: "LM" },
];

const GRACE_INSIGHT = {
  title: "Keep it up, Sarah!",
  message:
    "You've attended 6 weeks in a row — your longest streak this year! Your Women's Bible Study meets tomorrow at 10 AM. Your consistency is making a real difference in your group.",
  actions: ["RSVP for Bible Study", "Explore Serve Team options"],
};

/* ─── Utility ───────────────────────────────────────── */

function getStreakCount(attendance: boolean[]): number {
  let streak = 0;
  for (let i = attendance.length - 1; i >= 0; i--) {
    if (attendance[i]) streak++;
    else break;
  }
  return streak;
}

const streak = getStreakCount(ATTENDANCE);

/* ─── Sub-components ────────────────────────────────── */

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/60 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-sm dark:border-white/10 dark:bg-slate-800/80 dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-slate-900">
      {message}
      <button onClick={onClose} className="ml-3 text-slate-400 hover:text-white dark:hover:text-slate-900">
        ×
      </button>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */

export default function MemberPortalPage() {
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 shadow-md shadow-violet-600/30">
              <Church className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Grace Community</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            {MEMBER.avatar}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-5 pb-28 pt-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good morning, {MEMBER.name}!
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {MEMBER.campus} · Member since {MEMBER.memberSince}
          </p>
        </div>

        {/* Grace AI Insight — Hero Card */}
        <GlassCard className="relative overflow-hidden border-violet-200/60 dark:border-violet-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 dark:from-violet-500/10 dark:to-purple-500/10" />
          <div className="relative p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/10 dark:bg-violet-500/20">
                <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Insight
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{GRACE_INSIGHT.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {GRACE_INSIGHT.message}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {GRACE_INSIGHT.actions.map((action) => (
                <button
                  key={action}
                  onClick={() => showToast(`"${action}" — coming soon in the full app`)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Attendance Streak */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Streak</h3>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
              {streak} weeks
            </span>
          </div>
          <div className="mt-3 grid grid-cols-12 gap-1.5">
            {ATTENDANCE.map((attended, i) => (
              <div
                key={i}
                className={`h-6 rounded-md transition-colors ${
                  attended
                    ? "bg-emerald-400 dark:bg-emerald-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
                title={`Week ${i + 1}: ${attended ? "Attended" : "Missed"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">Last 12 weeks</p>
        </GlassCard>

        {/* Growth Track */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Growth Track</h3>
            <span className="ml-auto text-xs font-semibold text-violet-600 dark:text-violet-400">
              {GROWTH_TRACK.filter((s) => s.completed).length}/{GROWTH_TRACK.length}
            </span>
          </div>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-[11px] top-3 h-[calc(100%-24px)] w-0.5 bg-slate-200 dark:bg-slate-700" />
            <div
              className="absolute left-[11px] top-3 w-0.5 bg-violet-500 transition-all"
              style={{
                height: `${((GROWTH_TRACK.filter((s) => s.completed).length - 0.5) / (GROWTH_TRACK.length - 1)) * 100}%`,
              }}
            />

            <div className="space-y-4">
              {GROWTH_TRACK.map((step) => (
                <div key={step.step} className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="relative z-10 h-6 w-6 shrink-0 text-violet-500" />
                  ) : step.current ? (
                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
                      <div className="absolute h-6 w-6 animate-ping rounded-full bg-violet-400/30" />
                      <Circle className="h-6 w-6 text-violet-500" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <Circle className="relative z-10 h-6 w-6 shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        step.completed
                          ? "text-slate-900 dark:text-white"
                          : step.current
                            ? "text-violet-700 dark:text-violet-300"
                            : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {step.step}
                    </p>
                    {step.date && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{step.date}</p>
                    )}
                    {step.current && (
                      <p className="text-[11px] font-medium text-violet-600 dark:text-violet-400">
                        Next step on your journey
                      </p>
                    )}
                  </div>
                  {step.completed && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Groups */}
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Groups</h3>
          </div>
          <div className="space-y-3">
            {GROUPS.map((group) => (
              <button
                key={group.name}
                onClick={() => showToast(`"${group.name}" details — coming soon`)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left transition-colors hover:bg-slate-100/80 dark:border-slate-700 dark:bg-slate-700/30 dark:hover:bg-slate-700/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{group.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {group.day} at {group.time} · {group.leader}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">Next</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{group.nextMeeting}</p>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Volunteering */}
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <HandHeart className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Serving</h3>
          </div>
          <div className="space-y-3">
            {SERVING.map((s) => (
              <div
                key={s.team}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-700/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/20">
                  <HandHeart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.team}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">Next</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{s.nextDate}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {false && (
        /* Giving Summary */
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Giving</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{GIVING.ytd}</p>
              <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500">YTD</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-700/40">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{GIVING.lastGift}</p>
              <p className="text-[10px] font-medium text-slate-500">{GIVING.lastGiftDate}</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-center dark:bg-violet-500/10">
              <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{GIVING.recurringAmount}</p>
              <p className="text-[10px] font-medium text-violet-600 dark:text-violet-500">Recurring</p>
            </div>
          </div>
          <button
            onClick={() => showToast("Online giving — coming soon in the full app")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
          >
            <Heart className="h-4 w-4" />
            Give Now
          </button>
        </GlassCard>
        )}

        {/* Family */}
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Baby className="h-4 w-4 text-pink-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Family</h3>
          </div>
          <div className="space-y-2">
            {FAMILY.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-700/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700 dark:bg-pink-500/20 dark:text-pink-400">
                  {f.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{f.relation}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Life Events Timeline */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Journey</h3>
          </div>
          <div className="relative">
            <div className="absolute left-[9px] top-2 h-[calc(100%-16px)] w-0.5 bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-4">
              {LIFE_EVENTS.map((event) => {
                const Icon = event.icon;
                const dotColors: Record<string, string> = {
                  violet: "bg-violet-500",
                  amber: "bg-amber-500",
                  blue: "bg-blue-500",
                  emerald: "bg-emerald-500",
                  rose: "bg-rose-500",
                };
                return (
                  <div key={event.event} className="flex items-start gap-3">
                    <div
                      className={`relative z-10 mt-0.5 h-5 w-5 shrink-0 rounded-full ${dotColors[event.color]} flex items-center justify-center`}
                    >
                      <Icon className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{event.event}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{event.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Demo Badge */}
        <div className="pt-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 dark:border-violet-500/30 dark:bg-violet-500/10">
            <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
            <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
              This is a demo of the member portal experience
            </span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Powered by Modern.Church
          </p>
        </div>
      </main>

      {/* Bottom Quick Actions Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/40 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {[
            { icon: Heart, label: "Give", color: "text-emerald-600 dark:text-emerald-400" },
            { icon: Calendar, label: "RSVP", color: "text-blue-600 dark:text-blue-400" },
            { icon: Send, label: "Prayer", color: "text-violet-600 dark:text-violet-400" },
            { icon: FileText, label: "Connect", color: "text-rose-600 dark:text-rose-400" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => showToast(`"${action.label}" — coming soon in the full app`)}
                className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
