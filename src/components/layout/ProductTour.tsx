"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight, X, Sparkles, BarChart3, Bell, Workflow, MessageCircle,
  Users, TrendingUp, Heart, HandHeart, UserPlus, Calendar, CheckCircle2,
  AlertTriangle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InterestModal } from "@/components/layout/InterestModal";

interface PreviewItem {
  icon: LucideIcon;
  color: string;
  label: string;
  detail: string;
}

interface TourStep {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  navHighlight?: string; // nav label to highlight
  preview: PreviewItem[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: BarChart3,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    title: "Welcome to Modern.Church",
    description:
      "Your church already generates incredible data every week. Attendance, groups, visitors, volunteers. Modern.Church connects it all and surfaces what matters so your whole team can act on it together.",
    preview: [
      { icon: TrendingUp, color: "text-emerald-500", label: "Attendance +4.2%", detail: "3 consecutive weeks of growth" },
      { icon: UserPlus, color: "text-blue-500", label: "32 new visitors", detail: "This week across all campuses" },
      { icon: Heart, color: "text-rose-500", label: "5 members need care", detail: "Flagged before they disengage" },
      { icon: HandHeart, color: "text-amber-500", label: "92% volunteer coverage", detail: "3 positions need filling" },
    ],
  },
  {
    id: "briefing",
    icon: Sparkles,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    title: "Your Daily Briefing",
    description:
      "Every time you open the dashboard, you see what matters most. Tailored to your role. The lead pastor sees the full picture. The campus pastor sees their campus. The youth pastor sees student engagement. No reports to assemble.",
    navHighlight: "Command Center",
    preview: [
      { icon: BarChart3, color: "text-violet-500", label: "Today's Briefing", detail: "Attendance up, 5 alerts, 32 visitors" },
      { icon: TrendingUp, color: "text-emerald-500", label: "Trend Insights", detail: "Group participation +18% this month" },
      { icon: Bell, color: "text-amber-500", label: "Recommended Actions", detail: "3 families to check in on this week" },
    ],
  },
  {
    id: "insights",
    icon: Bell,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Insights That Build Over Time",
    description:
      "The longer your data is connected, the smarter the platform gets. It spots patterns across weeks and months. When volunteer signups decline or scheduling conflicts arise, it identifies suggested replacements based on serving history and preferences.",
    navHighlight: "Insights",
    preview: [
      { icon: AlertTriangle, color: "text-amber-500", label: "Volunteer gap detected", detail: "Kids Ministry short 3 for Easter" },
      { icon: Users, color: "text-blue-500", label: "Suggested volunteers", detail: "Based on serving frequency & preferences" },
      { icon: TrendingUp, color: "text-emerald-500", label: "Retention improving", detail: "Visitor return rate 23% → 34% in 8 weeks" },
      { icon: Calendar, color: "text-violet-500", label: "Seasonal forecast", detail: "Easter attendance projected +40% vs normal" },
    ],
  },
  {
    id: "pathways",
    icon: Workflow,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Care That Runs Itself",
    description:
      "When someone misses three weeks, a care pathway triggers automatically. A check-in goes out, a follow-up gets scheduled, and if there's no response, it escalates to a pastor. Your heart for people, systematized so nothing gets missed.",
    navHighlight: "Pathways",
    preview: [
      { icon: Workflow, color: "text-emerald-500", label: "Attendance Drop Response", detail: "Triggered for Marcus & Tanya Williams" },
      { icon: CheckCircle2, color: "text-emerald-500", label: "Step 1: Care email sent", detail: "Automatically 2 hours ago" },
      { icon: Bell, color: "text-amber-500", label: "Step 2: Pastor follow-up", detail: "Scheduled for Thursday" },
    ],
  },
  {
    id: "grace",
    icon: MessageCircle,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Ask Anything About Your Church",
    description:
      "Grace knows your data. Ask \"who's at risk this week?\" or \"how's our visitor retention?\" and get a real answer with names, numbers, and next steps. Like having a team member who's read every report and connected every dot.",
    navHighlight: "Grace",
    preview: [
      { icon: MessageCircle, color: "text-blue-500", label: "\"Who should I check in on?\"", detail: "Johnson family missed 3 weeks, score dropped to 35" },
      { icon: MessageCircle, color: "text-violet-500", label: "\"How's our visitor retention?\"", detail: "34% return rate, up from 23% last quarter" },
      { icon: MessageCircle, color: "text-emerald-500", label: "\"Any volunteers at burnout risk?\"", detail: "Sarah Kim has served 14 straight weeks on 4 teams" },
    ],
  },
];

// Disable cookie for testing — set to true to always show tour
const TESTING_MODE = true;
const COOKIE_KEY = "mc-tour-completed";

export function ProductTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [interestOpen, setInterestOpen] = useState(false);

  useEffect(() => {
    if (TESTING_MODE) {
      setActive(true);
      return;
    }

    const completed = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${COOKIE_KEY}=`));
    if (!completed) {
      setActive(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setActive(false);
    if (!TESTING_MODE) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${COOKIE_KEY}=1;path=/;expires=${expires};SameSite=Lax`;
    }
  }, []);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
      setInterestOpen(true);
    }
  }, [step, dismiss]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  useEffect(() => {
    if (!active) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [active, dismiss, next, prev]);

  if (!active && !interestOpen) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const Icon = current?.icon;

  return (
    <>
      {active && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Two-card layout */}
          <div className="relative z-10 flex w-full max-w-4xl flex-col items-stretch gap-4 md:flex-row">
            {/* Main tour card */}
            <div className="w-full animate-in fade-in zoom-in-95 duration-300 md:w-1/2">
              <div className="h-full overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-800">
                <div className="h-1.5 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />

                <button
                  onClick={dismiss}
                  className="absolute right-4 top-5 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-dark-200 md:right-auto md:left-4"
                >
                  Skip Tour
                  <X className="h-3 w-3" />
                </button>

                <div className="px-6 pb-5 pt-5 sm:px-8 sm:pb-6 sm:pt-6">
                  <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", current.iconBg)}>
                    <Icon className={cn("h-6 w-6", current.iconColor)} />
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">
                    {current.title}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-dark-200">
                    {current.description}
                  </p>

                  {current.navHighlight && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-dark-400">Find it in:</span>
                      <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {current.navHighlight}
                      </span>
                    </div>
                  )}

                  {/* Progress + Nav */}
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {TOUR_STEPS.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => setStep(i)}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            i === step
                              ? "w-6 bg-violet-500"
                              : i < step
                                ? "w-2 bg-violet-300 dark:bg-violet-600"
                                : "w-2 bg-slate-200 dark:bg-dark-600"
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {step > 0 && (
                        <button
                          onClick={prev}
                          className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
                        >
                          Back
                        </button>
                      )}
                      <button
                        onClick={next}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
                      >
                        {isLast ? "See It For My Church" : "Next"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[10px] text-slate-400 dark:text-dark-500">
                    {step + 1} of {TOUR_STEPS.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview card */}
            <div className="hidden w-1/2 animate-in fade-in slide-in-from-right-4 duration-500 md:block">
              <div className="h-full overflow-hidden rounded-2xl border border-slate-200/50 bg-white/95 shadow-xl backdrop-blur-sm dark:border-dark-600 dark:bg-dark-800/95">
                <div className="px-6 py-5">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-400">
                    What you&apos;ll see
                  </p>
                  <div className="space-y-3">
                    {current.preview.map((item, i) => {
                      const PreviewIcon = item.icon;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all dark:border-dark-600 dark:bg-dark-700/50"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-dark-600">
                            <PreviewIcon className={cn("h-3.5 w-3.5", item.color)} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-dark-100">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-dark-300">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <InterestModal open={interestOpen} onClose={() => setInterestOpen(false)} />
    </>
  );
}
