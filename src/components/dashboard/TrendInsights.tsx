"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Users,
  Heart,
  Target,
  AlertTriangle,
  ChevronRight,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendInsight {
  id: string;
  icon: LucideIcon;
  color: string;
  category: string;
  narrative: string;
  metric?: string;
  href: string;
}

// Role-specific trend insights — these simulate what Grace AI would generate
const ROLE_INSIGHTS: Record<string, TrendInsight[]> = {
  SENIOR_PASTOR: [
    {
      id: "attendance-streak",
      icon: TrendingUp,
      color: "emerald",
      category: "Attendance Trend",
      narrative:
        "Attendance has climbed 3 consecutive weeks since the new sermon series launched — up 11% overall. Downtown Campus is driving most of the growth.",
      metric: "+11% over 3 weeks",
      href: "/analytics",
    },
    {
      id: "visitor-retention",
      icon: Users,
      color: "blue",
      category: "Visitor Retention",
      narrative:
        "Visitor retention improved from 23% to 34% since activating the First-Time Guest pathway. 8 of 14 February visitors returned at least twice.",
      metric: "34% retention rate",
      href: "/visitors",
    },
    {
      id: "giving-pattern",
      icon: Heart,
      color: "rose",
      category: "Giving Intelligence",
      narrative:
        "3 recurring donors are showing early lapse signals based on pattern changes — missed their usual cadence by 10+ days. Proactive outreach recommended.",
      metric: "3 at-risk donors",
      href: "/giving",
    },
    {
      id: "growth-projection",
      icon: Target,
      color: "violet",
      category: "Growth Projection",
      narrative:
        "At current trajectory, you'll cross 500 weekly attendance by June. The growth track completion rate has doubled since adding the Serve step.",
      metric: "500 by June",
      href: "/growth-track",
    },
  ],
  CAMPUS_PASTOR: [
    {
      id: "campus-growth",
      icon: TrendingUp,
      color: "emerald",
      category: "Campus Trend",
      narrative:
        "Your campus attendance is up 8% month-over-month. You're outpacing the church-wide average by 3 points — the new service time is working.",
      metric: "+8% MoM",
      href: "/analytics",
    },
    {
      id: "visitor-retention",
      icon: Users,
      color: "blue",
      category: "Visitor Follow-up",
      narrative:
        "6 first-time visitors from the last 2 weeks haven't been contacted yet. The fastest-converting visitors get a personal call within 48 hours.",
      metric: "6 need follow-up",
      href: "/visitors",
    },
    {
      id: "volunteer-gap",
      icon: AlertTriangle,
      color: "amber",
      category: "Volunteer Coverage",
      narrative:
        "Kids Ministry is at 72% coverage for Easter weekend. Historically, you need 90%+ to avoid wait times. 4 more volunteers needed.",
      metric: "4 volunteers needed",
      href: "/volunteers",
    },
    {
      id: "pathway-impact",
      icon: Workflow,
      color: "violet",
      category: "Pathway Impact",
      narrative:
        "The Attendance Drop pathway caught 3 families before they fully disengaged this month — all 3 returned after receiving a personal check-in.",
      metric: "3 families re-engaged",
      href: "/pathways",
    },
  ],
  YOUTH_PASTOR: [
    {
      id: "youth-attendance",
      icon: TrendingUp,
      color: "emerald",
      category: "Student Engagement",
      narrative:
        "Wednesday night attendance has been steady at 45+ for 6 weeks — the highest sustained level this year. Small group participation is up 22%.",
      metric: "45+ avg / 6 weeks",
      href: "/groups",
    },
    {
      id: "youth-growth",
      icon: Target,
      color: "violet",
      category: "Growth Track",
      narrative:
        "4 students completed the Discover step this month. 2 are ready to start serving — consider connecting them with the media team.",
      metric: "4 milestones hit",
      href: "/growth-track",
    },
    {
      id: "volunteer-health",
      icon: Users,
      color: "blue",
      category: "Leader Health",
      narrative:
        "2 small group leaders have served 12+ consecutive weeks without a break. Consider scheduling subs to prevent burnout before summer camp.",
      metric: "2 leaders need rest",
      href: "/volunteers",
    },
  ],
  KIDS_PASTOR: [
    {
      id: "kids-check-in",
      icon: TrendingUp,
      color: "emerald",
      category: "Check-In Trend",
      narrative:
        "Kids check-ins are up 15% since adding the second service. The 9:00 AM service is now at 85% room capacity — may need overflow planning.",
      metric: "+15% check-ins",
      href: "/analytics",
    },
    {
      id: "volunteer-coverage",
      icon: AlertTriangle,
      color: "amber",
      category: "Volunteer Gaps",
      narrative:
        "You're 3 volunteers short for Easter Sunday across nursery and pre-K. Last year's Easter had 40% more kids than a normal Sunday.",
      metric: "3 needed for Easter",
      href: "/volunteers",
    },
    {
      id: "new-families",
      icon: Users,
      color: "blue",
      category: "New Families",
      narrative:
        "5 new families with kids under 10 visited in the last month. 3 have returned — consider a welcome packet or parent connect event.",
      metric: "5 new families",
      href: "/visitors",
    },
  ],
  WORSHIP_LEADER: [
    {
      id: "service-flow",
      icon: TrendingUp,
      color: "emerald",
      category: "Service Health",
      narrative:
        "Average service length has been consistent at 72 minutes for the past month. Online engagement spikes during worship — the new lighting is helping.",
      metric: "72 min avg",
      href: "/worship",
    },
    {
      id: "team-rotation",
      icon: Users,
      color: "blue",
      category: "Team Rotation",
      narrative:
        "3 worship team members have served 8+ consecutive weeks. Rotating in newer musicians could prevent burnout and develop the bench.",
      metric: "3 need rotation",
      href: "/volunteers",
    },
  ],
  GROUPS_DIRECTOR: [
    {
      id: "group-health",
      icon: TrendingUp,
      color: "emerald",
      category: "Group Health",
      narrative:
        "Average group health score improved from 72 to 81 this quarter. Groups that meet weekly score 15 points higher than bi-weekly groups.",
      metric: "81 avg health score",
      href: "/groups",
    },
    {
      id: "group-growth",
      icon: Users,
      color: "blue",
      category: "Group Growth",
      narrative:
        "12 members joined a group for the first time this month — highest since September launch season. The connect card auto-invite is working.",
      metric: "12 new joins",
      href: "/groups",
    },
    {
      id: "at-risk-groups",
      icon: AlertTriangle,
      color: "amber",
      category: "At-Risk Groups",
      narrative:
        "2 groups haven't reported attendance in 3+ weeks. Historically, groups that go dark for a month have a 60% chance of dissolving.",
      metric: "2 groups silent",
      href: "/groups",
    },
  ],
  OUTREACH_DIRECTOR: [
    {
      id: "visitor-funnel",
      icon: TrendingUp,
      color: "emerald",
      category: "Visitor Funnel",
      narrative:
        "Visitor-to-member conversion improved from 18% to 27% this quarter. The connect card follow-up pathway is the biggest driver.",
      metric: "27% conversion",
      href: "/visitors",
    },
    {
      id: "connect-cards",
      icon: Target,
      color: "violet",
      category: "Connect Cards",
      narrative:
        "38 connect cards submitted this month — up 45% from the QR code rollout. 12 requested more info about groups, 8 about serving.",
      metric: "38 cards / +45%",
      href: "/connect-cards",
    },
    {
      id: "community-reach",
      icon: Users,
      color: "blue",
      category: "Community Reach",
      narrative:
        "Online service viewers have grown 20% in 90 days. 6 online-only attendees visited in person this month for the first time.",
      metric: "6 online → in-person",
      href: "/analytics",
    },
  ],
  ACCOUNTING: [
    {
      id: "giving-trend",
      icon: TrendingUp,
      color: "emerald",
      category: "Giving Trend",
      narrative:
        "YTD giving is tracking 8% ahead of last year at this point. March is historically the lowest giving month — you're bucking the trend.",
      metric: "+8% vs prior year",
      href: "/giving",
    },
    {
      id: "recurring-health",
      icon: Heart,
      color: "rose",
      category: "Recurring Health",
      narrative:
        "Recurring giving makes up 62% of total revenue — up from 54% last year. 3 recurring donors paused in the last 2 weeks.",
      metric: "62% recurring",
      href: "/giving",
    },
    {
      id: "fund-allocation",
      icon: Target,
      color: "violet",
      category: "Fund Allocation",
      narrative:
        "Building fund contributions spiked 3x this month after the capital campaign update. General fund remains steady at budget.",
      metric: "Building fund +3x",
      href: "/giving",
    },
  ],
  VOLUNTEER_LEADER: [
    {
      id: "coverage-trend",
      icon: TrendingUp,
      color: "emerald",
      category: "Coverage Trend",
      narrative:
        "Overall volunteer coverage improved from 78% to 86% this quarter. The text-reminder system reduced no-shows by 40%.",
      metric: "86% coverage",
      href: "/volunteers",
    },
    {
      id: "burnout-risk",
      icon: AlertTriangle,
      color: "amber",
      category: "Burnout Prevention",
      narrative:
        "5 volunteers have served 10+ consecutive weeks without a break. Burnout is the #1 reason volunteers quit — schedule relief before Easter.",
      metric: "5 high-risk",
      href: "/volunteers",
    },
    {
      id: "new-volunteers",
      icon: Users,
      color: "blue",
      category: "New Volunteers",
      narrative:
        "7 people expressed interest in serving via connect cards this month. 4 have been placed, 3 are waiting for team lead follow-up.",
      metric: "3 awaiting placement",
      href: "/volunteers",
    },
  ],
  READ_ONLY: [
    {
      id: "church-health",
      icon: TrendingUp,
      color: "emerald",
      category: "Church Health",
      narrative:
        "Overall engagement is trending upward — attendance, giving, and group participation all show positive momentum over the last 90 days.",
      metric: "Positive trend",
      href: "/analytics",
    },
    {
      id: "community-growth",
      icon: Users,
      color: "blue",
      category: "Community Growth",
      narrative:
        "The church has welcomed 14 new visitors this month and 4 new members completed the membership class.",
      metric: "14 visitors / 4 members",
      href: "/members",
    },
  ],
};

const colorStyles: Record<string, { border: string; bg: string; iconBg: string; iconColor: string; badge: string }> = {
  emerald: {
    border: "border-emerald-500/20",
    bg: "hover:bg-emerald-500/5",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  blue: {
    border: "border-blue-500/20",
    bg: "hover:bg-blue-500/5",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  violet: {
    border: "border-violet-500/20",
    bg: "hover:bg-violet-500/5",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  amber: {
    border: "border-amber-500/20",
    bg: "hover:bg-amber-500/5",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  rose: {
    border: "border-rose-500/20",
    bg: "hover:bg-rose-500/5",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
};

export function TrendInsights({ role = "SENIOR_PASTOR" }: { role?: string }) {
  const [visible, setVisible] = useState(false);
  const insights = ROLE_INSIGHTS[role] ?? ROLE_INSIGHTS.SENIOR_PASTOR;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn("transition-all duration-700", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10">
          <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
          Grace AI Trend Insights
        </h3>
        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
          AI-POWERED
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          const style = colorStyles[insight.color] ?? colorStyles.blue;

          return (
            <a
              key={insight.id}
              href={insight.href}
              className={cn(
                "group rounded-xl border p-4 transition-all duration-300",
                style.border,
                style.bg,
                "bg-white dark:bg-dark-800",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${(i + 1) * 150}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.iconBg)}>
                  <Icon className={cn("h-4 w-4", style.iconColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                      {insight.category}
                    </span>
                    {insight.metric && (
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", style.badge)}>
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-dark-200">
                    {insight.narrative}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-violet-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-violet-400">
                    Explore
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
