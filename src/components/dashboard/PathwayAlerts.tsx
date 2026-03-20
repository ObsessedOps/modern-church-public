"use client";

import { useState, useEffect, useCallback } from "react";
import { Workflow, X, ArrowRight, GraduationCap, TrendingDown, HandHeart, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PathwayAlert {
  id: string;
  pathway: string;
  trigger: string;
  member: string;
  detail: string;
  icon: "attendance" | "milestone" | "serving" | "overdue";
  step: string;
  visible: boolean;
  dismissing: boolean;
}

const ICON_MAP = {
  attendance: { Icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
  milestone: { Icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  serving: { Icon: HandHeart, color: "text-violet-500", bg: "bg-violet-500/10" },
  overdue: { Icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
};

const SIMULATED_ALERTS: Omit<PathwayAlert, "id" | "visible" | "dismissing">[] = [
  {
    pathway: "Attendance Drop Response",
    trigger: "Missed 3 consecutive weeks",
    member: "Marcus & Tanya Williams",
    detail: "Sending care check-in email (Step 1 of 4)",
    icon: "attendance",
    step: "1/4",
  },
  {
    pathway: "Growth Track Milestone",
    trigger: "Completed Membership Class",
    member: "David Chen",
    detail: "Enrolling in Serve Team pathway (Step 1 of 3)",
    icon: "milestone",
    step: "1/3",
  },
  {
    pathway: "First-Time Serve Celebration",
    trigger: "Jason Rivera served in Kids Ministry for the first time",
    member: "Jason Rivera",
    detail: "Sending thank-you text + notifying team leader (Step 1 of 2)",
    icon: "serving",
    step: "1/2",
  },
  {
    pathway: "Pastoral Care Overdue",
    trigger: "No follow-up in 14 days",
    member: "Linda Matthews",
    detail: "Escalating to senior pastor (Step 3 of 3)",
    icon: "overdue",
    step: "3/3",
  },
];

export function PathwayAlerts() {
  const [alerts, setAlerts] = useState<PathwayAlert[]>([]);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissing: true } : a))
    );
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 300);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    SIMULATED_ALERTS.forEach((alert, i) => {
      // Stagger: first at 3s, then every 8s
      const delay = 3000 + i * 8000;

      timers.push(
        setTimeout(() => {
          const id = `pathway-${Date.now()}-${i}`;
          setAlerts((prev) => [...prev, { ...alert, id, visible: false, dismissing: false }]);

          // Animate in
          setTimeout(() => {
            setAlerts((prev) =>
              prev.map((a) => (a.id === id ? { ...a, visible: true } : a))
            );
          }, 50);

          // Auto-dismiss after 7s
          timers.push(setTimeout(() => dismiss(id), 7000));
        }, delay)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [dismiss]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed right-4 top-[calc(var(--topbar-height)+1rem)] z-[90] flex flex-col gap-2 sm:w-96 w-[calc(100vw-2rem)]">
      {alerts.map((alert) => {
        const { Icon, color, bg } = ICON_MAP[alert.icon];

        return (
          <div
            key={alert.id}
            className={cn(
              "rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm transition-all duration-300 dark:border-dark-600 dark:bg-dark-800/95",
              alert.visible && !alert.dismissing
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", bg)}>
                  <Workflow className={cn("h-4 w-4", color)} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900 dark:text-dark-50">
                      Pathway Triggered
                    </p>
                    <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-dark-300">
                    {alert.pathway}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismiss(alert.id)}
                className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-dark-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-dark-700">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
                <p className="text-[11px] font-medium text-slate-700 dark:text-dark-100">
                  {alert.trigger}
                </p>
              </div>
              <p className="mt-1 text-[11px] text-slate-900 dark:text-dark-50">
                <span className="font-semibold">{alert.member}</span>
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-dark-300">
                {alert.detail}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Running step {alert.step}
                </span>
              </div>
              <Link
                href="/pathways"
                className="flex items-center gap-1 text-[10px] font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400"
              >
                View Pathways
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
