"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X, Sparkles, BarChart3, Bell, Workflow, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { InterestModal } from "@/components/layout/InterestModal";

interface TourStep {
  id: string;
  icon: typeof Sparkles;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  highlight?: string; // CSS selector to spotlight
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: BarChart3,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    title: "Welcome to Modern.Church",
    description:
      "Your church already generates incredible data every week — attendance, giving, groups, visitors, volunteers. Modern.Church connects it all and surfaces what matters, in language your whole team can act on.",
  },
  {
    id: "briefing",
    icon: Sparkles,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    title: "Your Daily Briefing",
    description:
      "Every time you open the dashboard, you see exactly what matters — tailored to your role. The lead pastor sees the full picture. The campus pastor sees their campus. No reports to pull, no spreadsheets to assemble.",
  },
  {
    id: "actions",
    icon: Bell,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Know Who Needs Attention",
    description:
      "When someone starts drifting, you'll know — by name, not by number. When a volunteer is burning out or a visitor hasn't been followed up with, it surfaces automatically so your team can act before it's too late.",
  },
  {
    id: "pathways",
    icon: Workflow,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Care That Runs Itself",
    description:
      "Automated care pathways trigger when someone misses three weeks, when a visitor needs follow-up, or when a life event happens. A check-in goes out, a follow-up gets scheduled, and it escalates if needed. No one falls through the cracks.",
  },
  {
    id: "grace",
    icon: MessageCircle,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Ask Anything About Your Church",
    description:
      "Grace knows your data. Ask \"who's at risk this week?\" or \"how's our visitor retention?\" in plain language and get a real answer — with names, numbers, and next steps. It's like a chief of staff who's read every report.",
  },
];

const COOKIE_KEY = "mc-tour-completed";

export function ProductTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [interestOpen, setInterestOpen] = useState(false);

  useEffect(() => {
    // Check cookie — only show once
    const completed = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${COOKIE_KEY}=`));
    if (!completed) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback(() => {
    setActive(false);
    // Set cookie for 30 days
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=1;path=/;expires=${expires};SameSite=Lax`;
  }, []);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Last step — dismiss and open interest form
      dismiss();
      setInterestOpen(true);
    }
  }, [step, dismiss]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // Close on Escape
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Card */}
          <div className="relative z-10 mx-4 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-800">
              {/* Gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />

              {/* Skip button */}
              <button
                onClick={dismiss}
                className="absolute right-4 top-5 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-dark-200"
              >
                Skip Tour
                <X className="h-3 w-3" />
              </button>

              {/* Content */}
              <div className="px-8 pb-6 pt-6">
                {/* Icon */}
                <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", current.iconBg)}>
                  <Icon className={cn("h-6 w-6", current.iconColor)} />
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">
                  {current.title}
                </h2>

                {/* Description */}
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-dark-200">
                  {current.description}
                </p>

                {/* Progress dots */}
                <div className="mt-6 flex items-center justify-between">
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

                  {/* Navigation */}
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

                {/* Step counter */}
                <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-dark-500">
                  {step + 1} of {TOUR_STEPS.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <InterestModal open={interestOpen} onClose={() => setInterestOpen(false)} />
    </>
  );
}
