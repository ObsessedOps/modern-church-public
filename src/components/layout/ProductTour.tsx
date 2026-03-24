"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  ArrowRight, X, Sparkles, BarChart3, Bell, Workflow, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InterestModal } from "@/components/layout/InterestModal";
import {
  PreviewDashboard,
  PreviewBriefing,
  PreviewInsights,
  PreviewPathways,
  PreviewGrace,
} from "./TourPreviews";

interface TourStep {
  id: string;
  icon: typeof Sparkles;
  iconColor: string;
  iconBg: string;
  title: string;
  hook: string; // the emotional pain/scenario
  description: string;
  navHighlight?: string;
  previewLabel: string;
  preview: ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: BarChart3,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    title: "Welcome to Modern.Church",
    hook: "Your team already tracks attendance, groups, visitors, and volunteers. What if all of it worked together?",
    description:
      "Modern.Church connects your platforms and surfaces what matters so your whole team can act on it.",
    previewLabel: "Your dashboard at a glance",
    preview: <PreviewDashboard />,
  },
  {
    id: "briefing",
    icon: Sparkles,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    title: "Your Daily Briefing",
    hook: "Monday morning. Staff meeting in 10 minutes. How did last weekend go?",
    description:
      "You already know. The briefing is tailored to your role. The lead pastor sees the full picture. The campus pastor sees their campus. No reports to pull.",
    navHighlight: "Command Center",
    previewLabel: "On your dashboard",
    preview: <PreviewBriefing />,
  },
  {
    id: "insights",
    icon: Bell,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Insights That Build Over Time",
    hook: "Easter is two weeks out and Kids Ministry is short 3 volunteers. Who do you call?",
    description:
      "The platform spots gaps before you do. When volunteers decline or have conflicts, it suggests replacements based on serving frequency and preferences. The longer your data is connected, the sharper the insights get.",
    navHighlight: "Insights",
    previewLabel: "Working behind the scenes",
    preview: <PreviewInsights />,
  },
  {
    id: "pathways",
    icon: Workflow,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Care That Runs Itself",
    hook: "A family misses three Sundays and nobody notices until it's too late.",
    description:
      "With Modern.Church, a care pathway triggers automatically. A check-in goes out, a follow-up gets scheduled, and if there's no response, it escalates. Your heart for people, systematized so nothing gets missed.",
    navHighlight: "Pathways",
    previewLabel: "Happening automatically",
    preview: <PreviewPathways />,
  },
  {
    id: "grace",
    icon: MessageCircle,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Ask Anything About Your Church",
    hook: "\"Who should I check in on this week?\"",
    description:
      "Grace knows your data. Ask in plain language and get a real answer with names, context, and next steps. Like having a team member who's read every report and connected every dot.",
    navHighlight: "Grace",
    previewLabel: "Try asking Grace",
    preview: <PreviewGrace />,
  },
];

// Disable cookie for testing
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
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {active && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Two-card layout */}
          <div className="relative z-10 flex w-full max-w-5xl flex-col items-stretch gap-4 md:flex-row">
            {/* Main tour card */}
            <div className="w-full md:w-[45%]" key={`tour-${step}`}>
              <div className="h-full overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-800">
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-100 dark:bg-dark-700">
                  <div
                    className="h-full rounded-r-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Skip button */}
                <button
                  onClick={dismiss}
                  className="absolute left-4 top-5 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-dark-200 z-10"
                >
                  Skip Tour
                  <X className="h-3 w-3" />
                </button>

                <div className="px-6 pb-5 pt-10 sm:px-8 sm:pb-6">
                  {/* Icon */}
                  <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", current.iconBg)}>
                    <Icon className={cn("h-5 w-5", current.iconColor)} />
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">
                    {current.title}
                  </h2>

                  {/* Hook — the emotional scenario */}
                  <p className="mt-3 text-sm font-medium italic text-slate-700 dark:text-dark-100">
                    {current.hook}
                  </p>

                  {/* Description */}
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-dark-300">
                    {current.description}
                  </p>

                  {current.navHighlight && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-400">Find it in:</span>
                      <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {current.navHighlight}
                      </span>
                    </div>
                  )}

                  {/* Keyboard hint on first step */}
                  {step === 0 && (
                    <p className="mt-3 text-[10px] text-slate-400 dark:text-dark-500">
                      Tip: Use arrow keys to navigate
                    </p>
                  )}

                  {/* Progress dots + Nav */}
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
                </div>
              </div>
            </div>

            {/* Preview card — mini UI render */}
            <div className="hidden w-[55%] md:block" key={`preview-${step}`}>
              <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-xl backdrop-blur-sm">
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {current.previewLabel}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[8px] text-emerald-400">Live preview</span>
                    </div>
                  </div>
                  {/* Scale down the preview slightly for a zoomed-out "exploded view" feel */}
                  <div className="origin-top-left scale-[0.92]">
                    {current.preview}
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
