"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Heart,
  AlertTriangle,
  Users,
  Flame,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Nudge {
  id: string;
  icon: LucideIcon;
  color: "emerald" | "violet" | "amber" | "rose" | "blue";
  title: string;
  message: string;
  action?: { label: string; href: string };
}

// Role-specific proactive nudges — these simulate what Grace AI would surface
const ROLE_NUDGES: Record<string, Nudge[]> = {
  SENIOR_PASTOR: [
    {
      id: "outreach-working",
      icon: TrendingUp,
      color: "emerald",
      title: "Your outreach pathway is working",
      message:
        "3 members who missed 3+ weeks just RSVPd for Sunday after receiving the automated check-in. The Attendance Drop pathway has re-engaged 12 people this quarter.",
      action: { label: "View Pathway", href: "/pathways" },
    },
    {
      id: "burnout-risk",
      icon: Flame,
      color: "amber",
      title: "High burnout risk detected",
      message:
        "Sarah Kim has served 12 consecutive weeks across 4 teams with no scheduled break. She's in the top 5% of volunteer hours — consider scheduling relief before Easter.",
      action: { label: "View Volunteer", href: "/volunteers" },
    },
    {
      id: "visitor-retention",
      icon: Users,
      color: "blue",
      title: "February retention hit a 6-month high",
      message:
        "Visitor retention was 34% last month — the highest since September. The connect card follow-up pathway is the biggest driver. 8 of 14 February visitors returned.",
      action: { label: "View Visitors", href: "/visitors" },
    },
  ],
  CAMPUS_PASTOR: [
    {
      id: "campus-momentum",
      icon: TrendingUp,
      color: "emerald",
      title: "Your campus is outpacing the average",
      message:
        "Downtown Campus attendance is up 8% month-over-month, 3 points ahead of the church-wide average. The new 9:00 AM service time is driving the growth.",
      action: { label: "View Analytics", href: "/analytics" },
    },
    {
      id: "follow-up-gap",
      icon: AlertTriangle,
      color: "amber",
      title: "6 visitors need follow-up",
      message:
        "6 first-time visitors from the last 2 weeks haven't been contacted. Data shows visitors who receive a call within 48 hours are 3x more likely to return.",
      action: { label: "View Visitors", href: "/visitors" },
    },
  ],
  YOUTH_PASTOR: [
    {
      id: "student-streak",
      icon: TrendingUp,
      color: "emerald",
      title: "Wednesday nights are on a streak",
      message:
        "45+ students for 6 consecutive weeks — the highest sustained attendance this year. Small group sign-ups are up 22% since you added the icebreaker format.",
    },
    {
      id: "leader-rest",
      icon: Flame,
      color: "amber",
      title: "2 leaders need a break",
      message:
        "Jake Torres and Maria Chen have led small groups 12+ consecutive weeks. Schedule subs before summer camp to prevent burnout.",
      action: { label: "View Leaders", href: "/volunteers" },
    },
  ],
  KIDS_PASTOR: [
    {
      id: "capacity-warning",
      icon: AlertTriangle,
      color: "amber",
      title: "9 AM service hitting capacity",
      message:
        "Kids check-ins for the 9:00 AM service are at 85% room capacity. Last Easter had 40% more kids than normal — plan overflow rooms now.",
    },
    {
      id: "new-families",
      icon: Users,
      color: "blue",
      title: "5 new families with young kids",
      message:
        "5 families with children under 10 visited in the last month. 3 have returned — a welcome packet or parent connect event could help them stick.",
      action: { label: "View Visitors", href: "/visitors" },
    },
  ],
  ACCOUNTING: [
    {
      id: "giving-ahead",
      icon: TrendingUp,
      color: "emerald",
      title: "YTD giving tracking 8% ahead",
      message:
        "You're outpacing last year by 8% at this point. March is historically the lowest giving month, but you're bucking the trend so far.",
      action: { label: "View Giving", href: "/giving" },
    },
    {
      id: "recurring-paused",
      icon: Heart,
      color: "rose",
      title: "3 recurring donors paused",
      message:
        "3 recurring donors paused or missed their usual cadence in the last 2 weeks. Recurring giving now makes up 62% of total revenue — worth a check-in.",
      action: { label: "View Donors", href: "/giving" },
    },
  ],
};

// Default nudges for roles not listed
const DEFAULT_NUDGES: Nudge[] = [
  {
    id: "engagement-up",
    icon: TrendingUp,
    color: "emerald",
    title: "Overall engagement is trending up",
    message:
      "Attendance, giving, and group participation all show positive momentum over the last 90 days. The church is healthier than it was a quarter ago.",
    action: { label: "View Analytics", href: "/analytics" },
  },
];

const COLOR_STYLES = {
  emerald: {
    border: "border-emerald-200 dark:border-emerald-500/20",
    bg: "bg-emerald-50/50 dark:bg-emerald-500/5",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    border: "border-violet-200 dark:border-violet-500/20",
    bg: "bg-violet-50/50 dark:bg-violet-500/5",
    iconBg: "bg-violet-100 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-500/20",
    bg: "bg-amber-50/50 dark:bg-amber-500/5",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    border: "border-rose-200 dark:border-rose-500/20",
    bg: "bg-rose-50/50 dark:bg-rose-500/5",
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-500/20",
    bg: "bg-blue-50/50 dark:bg-blue-500/5",
    iconBg: "bg-blue-100 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

export function GraceNudges({ role = "SENIOR_PASTOR" }: { role?: string }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(false);

  const nudges = (ROLE_NUDGES[role] ?? DEFAULT_NUDGES).filter(
    (n) => !dismissed.has(n.id)
  );

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (nudges.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-3 transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10 dark:bg-violet-500/20">
          <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
          Recommended Actions
        </h3>
      </div>

      {nudges.map((nudge, i) => {
        const Icon = nudge.icon;
        const style = COLOR_STYLES[nudge.color];

        const cardClasses = cn(
          "group relative rounded-xl border p-4 transition-all duration-500",
          style.border,
          style.bg,
          visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
          nudge.action?.href && "hover:shadow-md hover:scale-[1.01] cursor-pointer"
        );

        const cardContent = (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed((prev) => { const next = new Set(prev); next.add(nudge.id); return next; }); }}
              className="absolute right-3 top-3 z-10 rounded-full p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-200/50 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-dark-600 dark:hover:text-dark-200"
            >
              <X className="h-3 w-3" />
            </button>

            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  style.iconBg
                )}
              >
                <Icon className={cn("h-4 w-4", style.iconColor)} />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                  {nudge.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-dark-200">
                  {nudge.message}
                </p>
              </div>
            </div>
          </>
        );

        return nudge.action?.href ? (
          <Link
            key={nudge.id}
            href={nudge.action.href}
            className={cn(cardClasses, "block no-underline")}
            style={{ transitionDelay: `${(i + 1) * 200}ms` }}
          >
            {cardContent}
          </Link>
        ) : (
          <div
            key={nudge.id}
            className={cardClasses}
            style={{ transitionDelay: `${(i + 1) * 200}ms` }}
          >
            {cardContent}
          </div>
        );
      })}
    </div>
  );
}
