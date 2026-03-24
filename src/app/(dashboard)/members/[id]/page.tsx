import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getMemberDetail } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Users,
  Heart,
  HandHeart,
  Star,
  Clock,
  Sparkles,
  Footprints,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Workflow,
  TrendingUp,
  MessageSquare,
  UserPlus,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  VISITOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ATTENDEE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MEMBER: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300",
  TRANSFERRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DECEASED: "bg-slate-200 text-slate-500 dark:bg-dark-700 dark:text-dark-400",
};

const TIER_COLORS: Record<string, { badge: string; ring: string; text: string }> = {
  CHAMPION: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    ring: "stroke-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  ENGAGED: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    ring: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  CASUAL: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    ring: "stroke-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  AT_RISK: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    ring: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  DISENGAGED: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    ring: "stroke-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
};

const LIFE_EVENT_COLORS: Record<string, string> = {
  BAPTISM: "bg-blue-500",
  SALVATION: "bg-purple-500",
  MEMBERSHIP: "bg-emerald-500",
  MARRIAGE: "bg-pink-500",
  BABY_DEDICATION: "bg-amber-500",
  DEATH: "bg-slate-400",
  TRANSFER_IN: "bg-teal-500",
  TRANSFER_OUT: "bg-orange-500",
  RECOMMITMENT: "bg-violet-500",
};

const GROWTH_STEPS = ["CONNECT", "DISCOVER", "SERVE"] as const;
const GROWTH_STEP_LABELS: Record<string, string> = {
  CONNECT: "Connect",
  DISCOVER: "Discover",
  SERVE: "Serve",
  COMPLETED: "Completed",
};

function formatTier(tier: string): string {
  return tier.replace("_", " ");
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function daysAgo(date: Date | string | null | undefined): string {
  if (!date) return "Never";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return `${Math.floor(diff / 30)} months ago`;
}

// Compute engagement score breakdown (mirrors intelligence.ts logic)
function computeScoreBreakdown(member: {
  attendanceRecords: { serviceDate: Date | string }[];
  contributions: { transactionDate: Date | string }[];
  groupMemberships: unknown[];
  volunteerPositions: unknown[];
  lastActivityAt: Date | string | null;
}) {
  const now = Date.now();
  const twelveWeeksAgo = now - 12 * 7 * 24 * 60 * 60 * 1000;
  const twelveMonthsAgo = now - 365 * 24 * 60 * 60 * 1000;

  // Attendance: unique weeks in 12-week window
  const attendedWeeks = new Set(
    member.attendanceRecords
      .filter((r) => new Date(r.serviceDate).getTime() >= twelveWeeksAgo)
      .map((r) => {
        const d = new Date(r.serviceDate);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().slice(0, 10);
      })
  );
  const attendanceRaw = attendedWeeks.size / 12;
  const attendanceScore = Math.round(attendanceRaw * 30);

  // Giving: unique months in 12-month window
  const givingMonths = new Set(
    member.contributions
      .filter((c) => new Date(c.transactionDate).getTime() >= twelveMonthsAgo)
      .map((c) => {
        const d = new Date(c.transactionDate);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
  );
  const givingRaw = givingMonths.size / 12;
  const givingScore = Math.round(givingRaw * 20);

  // Groups: capped at 2
  const groupRaw = Math.min(member.groupMemberships.length, 2) / 2;
  const groupScore = Math.round(groupRaw * 20);

  // Volunteering: boolean
  const volunteerRaw = member.volunteerPositions.length > 0 ? 1 : 0;
  const volunteerScore = Math.round(volunteerRaw * 15);

  // Recency
  const lastActivity = member.lastActivityAt ? new Date(member.lastActivityAt).getTime() : 0;
  const daysSince = lastActivity ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24)) : 90;
  const recencyRaw = daysSince <= 7 ? 1 : daysSince >= 90 ? 0 : 1 - (daysSince - 7) / 83;
  const recencyScore = Math.round(recencyRaw * 15);

  return [
    { label: "Attendance", detail: `${attendedWeeks.size}/12 weeks`, score: attendanceScore, max: 30 },
    { label: "Giving", detail: `${givingMonths.size}/12 months`, score: givingScore, max: 20 },
    { label: "Groups", detail: `${Math.min(member.groupMemberships.length, 2)} active`, score: groupScore, max: 20 },
    { label: "Volunteering", detail: volunteerRaw ? "Active" : "None", score: volunteerScore, max: 15 },
    { label: "Recency", detail: daysAgo(member.lastActivityAt), score: recencyScore, max: 15 },
  ];
}

// Generate a Grace AI insight based on member data
function generateGraceInsight(member: {
  firstName: string;
  engagementTier: string;
  engagementScore: number;
  attendanceRecords: unknown[];
  contributions: unknown[];
  groupMemberships: unknown[];
  volunteerPositions: unknown[];
}): { text: string; action: string } {
  const name = member.firstName;

  if (member.engagementTier === "CHAMPION") {
    return {
      text: `${name} is one of your most engaged members — attending consistently, giving regularly, and actively serving. Consider recognizing their faithfulness or inviting them into a leadership role.`,
      action: "Invite to lead a group or mentor a newer member",
    };
  }
  if (member.engagementTier === "ENGAGED") {
    if (member.volunteerPositions.length === 0) {
      return {
        text: `${name} is actively engaged in attendance and groups but hasn't started serving yet. This is often the next natural step in the growth journey.`,
        action: "Invite to explore serving opportunities",
      };
    }
    return {
      text: `${name} is doing great — consistently showing up and plugged into the community. Keep nurturing this relationship.`,
      action: "Send a personal encouragement note",
    };
  }
  if (member.engagementTier === "CASUAL") {
    if (member.groupMemberships.length === 0) {
      return {
        text: `${name} attends occasionally but isn't connected to a small group. Research shows that group connection is the #1 predictor of long-term engagement.`,
        action: "Invite to a group that matches their interests",
      };
    }
    return {
      text: `${name} is in a group but attendance has been inconsistent. A personal check-in from their group leader could make a big difference.`,
      action: "Ask their group leader to reach out",
    };
  }
  if (member.engagementTier === "AT_RISK") {
    return {
      text: `${name} is showing signs of disengagement — attendance has dropped and activity is declining. Without intervention, there's a high chance they'll stop coming altogether.`,
      action: "Schedule a personal call or coffee meeting",
    };
  }
  // DISENGAGED
  return {
    text: `${name} hasn't been active in several weeks. This is a critical window — a thoughtful personal outreach now has the best chance of re-engaging them before they fully disconnect.`,
    action: "Send a caring, no-pressure personal message",
  };
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();
  if (!can(session, "members:view")) return <AccessDenied />;
  const member = await getMemberDetail(id, session.churchId);

  if (!member) {
    notFound();
  }

  const familyMembers =
    member.familyMembers?.flatMap((fm) =>
      fm.familyUnit.members.filter((m) => m.id !== member.id)
    ) ?? [];

  const tierStyle = TIER_COLORS[member.engagementTier] ?? TIER_COLORS.CASUAL;
  const scoreBreakdown = computeScoreBreakdown(member);
  const graceInsight = generateGraceInsight(member);
  const growthTrack = member.growthTracks?.[0] ?? null;
  const totalGiving = member.contributions.reduce((sum, c) => sum + c.amount, 0);

  // Attendance heatmap: last 12 weeks
  const now = Date.now();
  const attendanceWeeks: boolean[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
    const attended = member.attendanceRecords.some((r) => {
      const d = new Date(r.serviceDate).getTime();
      return d >= weekStart && d < weekEnd;
    });
    attendanceWeeks.push(attended);
  }

  // Circumference for score gauge
  const circumference = 2 * Math.PI * 36;
  const scoreOffset = circumference - (member.engagementScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/members"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-violet-600 dark:text-dark-300 dark:hover:text-violet-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Congregation
      </Link>

      {/* ── Hero Header ──────────────────────────────────────── */}
      <div className="card relative overflow-hidden p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />

        <div className="flex flex-col gap-6 pt-1 lg:flex-row lg:items-start">
          {/* Avatar + Name */}
          <div className="flex items-start gap-4 lg:flex-1">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 sm:h-20 sm:w-20 sm:text-2xl">
              {getInitials(member.firstName, member.lastName)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
                {member.firstName} {member.lastName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-dark-300">
                {member.primaryCampus && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {member.primaryCampus.name}
                  </span>
                )}
                {member.memberSince && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Since {formatDate(member.memberSince)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`badge ${STATUS_COLORS[member.membershipStatus] ?? "bg-slate-100 text-slate-600"}`}>
                  {member.membershipStatus}
                </span>
                <span className={`badge ${tierStyle.badge}`}>
                  {formatTier(member.engagementTier)}
                </span>
                {member.tags.length > 0 &&
                  member.tags.map((tag) => (
                    <span key={tag} className="badge bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300">
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Engagement Score Gauge */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-dark-600" />
                <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={scoreOffset} className={`transition-all duration-1000 ${tierStyle.ring}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${tierStyle.text}`}>
                  {Math.round(member.engagementScore)}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-300">
              Engagement
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-dark-600">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-dark-500 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10 dark:hover:text-violet-400">
            <Mail className="h-3.5 w-3.5" /> Send Email
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-dark-500 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10 dark:hover:text-violet-400">
            <MessageSquare className="h-3.5 w-3.5" /> Send Text
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-dark-500 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10 dark:hover:text-violet-400">
            <Workflow className="h-3.5 w-3.5" /> Enroll in Pathway
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-dark-500 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10 dark:hover:text-violet-400">
            <UserPlus className="h-3.5 w-3.5" /> Add to Group
          </button>
        </div>
      </div>

      {/* ── Grace AI Insight + Score Breakdown ────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Grace AI Insight */}
        <div className="card relative overflow-hidden border border-violet-500/20 p-5 lg:col-span-2">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                  Engagement Insight
                </h3>
                <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-600 dark:text-violet-400">
                  AI
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-dark-200">
                {graceInsight.text}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-violet-500/5 px-3 py-2">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                <span className="text-xs font-medium text-violet-700 dark:text-violet-400">
                  Recommended: {graceInsight.action}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-dark-50">
            Score Breakdown
          </h3>
          <div className="space-y-2.5">
            {scoreBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-dark-200">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-dark-400">{item.detail}</span>
                    <span className="font-bold text-slate-900 dark:text-dark-50">
                      {item.score}/{item.max}
                    </span>
                  </div>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-600">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Growth Track + Attendance + Active Pathways ────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Growth Track */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Footprints className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Growth Track</h3>
          </div>
          {growthTrack ? (
            <div className="space-y-3">
              {GROWTH_STEPS.map((step, i) => {
                const stepIndex = GROWTH_STEPS.indexOf(step);
                const currentIndex = GROWTH_STEPS.indexOf(growthTrack.currentStep as typeof GROWTH_STEPS[number]);
                const isCompleted = growthTrack.status === "COMPLETED" || stepIndex < currentIndex;
                const isCurrent = stepIndex === currentIndex && growthTrack.status !== "COMPLETED";

                return (
                  <div key={step} className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : isCurrent ? (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-violet-500">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-slate-300 dark:text-dark-500" />
                    )}
                    <div className="flex-1">
                      <span className={`text-xs font-medium ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : isCurrent ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-dark-400"}`}>
                        {GROWTH_STEP_LABELS[step]}
                      </span>
                    </div>
                    {isCompleted && (
                      <span className="text-[10px] text-slate-400 dark:text-dark-400">
                        {formatDate(
                          step === "CONNECT" ? growthTrack.connectCompletedAt :
                          step === "DISCOVER" ? growthTrack.discoverCompletedAt :
                          growthTrack.serveCompletedAt
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
              {growthTrack.status === "STALLED" && (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Stalled — needs follow-up</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <Circle className="mb-2 h-8 w-8 text-slate-300 dark:text-dark-500" />
              <p className="text-xs text-slate-400 dark:text-dark-400">Not enrolled in growth track</p>
              <button className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
                Enroll now →
              </button>
            </div>
          )}
        </div>

        {/* Attendance Heatmap */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Attendance</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-dark-300">
              Last 12 weeks
            </span>
          </div>
          {/* Heatmap grid */}
          <div className="grid grid-cols-6 gap-1.5">
            {attendanceWeeks.map((attended, i) => (
              <div
                key={i}
                className={`h-6 rounded ${attended ? "bg-emerald-500" : "bg-slate-100 dark:bg-dark-600"}`}
                title={`Week ${i + 1}: ${attended ? "Attended" : "Missed"}`}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-dark-400">
            <span>12 weeks ago</span>
            <span>This week</span>
          </div>
          {/* Streak */}
          {(() => {
            let streak = 0;
            for (let i = attendanceWeeks.length - 1; i >= 0; i--) {
              if (attendanceWeeks[i]) streak++;
              else break;
            }
            return streak > 0 ? (
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {streak} week streak
                </span>
              </div>
            ) : null;
          })()}
          <p className="mt-2 text-xs text-slate-500 dark:text-dark-300">
            Last attended: {member.attendanceRecords.length > 0 ? daysAgo(member.attendanceRecords[0].serviceDate) : "Never"}
          </p>
        </div>

        {/* Active Pathways + Family */}
        <div className="space-y-4">
          {/* Active Pathways */}
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Workflow className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Active Pathways</h3>
            </div>
            {member.workflowExecutions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-dark-400">No active pathways</p>
            ) : (
              <div className="space-y-2">
                {member.workflowExecutions.map((exec) => (
                  <div key={exec.id} className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                    <span className="text-xs font-medium text-violet-700 dark:text-violet-400">
                      {exec.workflow.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Family */}
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-pink-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Family</h3>
            </div>
            {familyMembers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-dark-400">No family connections</p>
            ) : (
              <div className="space-y-2">
                {familyMembers.map((fm) => (
                  <Link
                    key={fm.id}
                    href={`/members/${fm.id}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 dark:text-dark-200 dark:hover:text-violet-400"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-[10px] font-bold text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                      {getInitials(fm.firstName, fm.lastName)}
                    </div>
                    <span className="text-xs font-medium">{fm.firstName} {fm.lastName}</span>
                    <span className={`badge text-[9px] ${STATUS_COLORS[fm.membershipStatus] ?? ""}`}>
                      {fm.membershipStatus}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contact + Giving Summary ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-dark-50">Contact Info</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="truncate text-slate-600 dark:text-dark-200">{member.email ?? "No email"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="text-slate-600 dark:text-dark-200">{member.phone ?? "No phone"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="text-slate-600 dark:text-dark-200">DOB: {formatDate(member.dateOfBirth)}</span>
            </div>
          </div>
          {member.notes && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-dark-700">
              <p className="text-xs text-slate-600 dark:text-dark-200">{member.notes}</p>
            </div>
          )}
        </div>

        {/* Giving Summary */}
        {can(session, "giving:view") && (
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Giving</h3>
            </div>
            {member.contributions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-dark-400">No giving records</p>
            ) : (
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalGiving)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Total ({member.contributions.length} gifts)
                  </p>
                </div>
                <div className="h-10 border-l border-slate-200 dark:border-dark-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                    {formatCurrency(member.contributions[0].amount)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-dark-300">
                    Last gift · {formatDate(member.contributions[0].transactionDate)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Groups + Volunteer ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Groups */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Groups</h3>
          </div>
          {member.groupMemberships.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-dark-400">Not in any groups</p>
          ) : (
            <div className="space-y-2">
              {member.groupMemberships.map((gm) => (
                <div key={gm.group.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 dark:border-dark-600">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-dark-50">{gm.group.name}</p>
                    <span className="text-[10px] text-slate-500 dark:text-dark-300">{gm.group.type.replace("_", " ")}</span>
                  </div>
                  {gm.group.healthScore != null && (
                    <span className={`text-xs font-bold ${gm.group.healthScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : gm.group.healthScore >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {Math.round(gm.group.healthScore)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Volunteer */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <HandHeart className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Serving</h3>
          </div>
          {member.volunteerPositions.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-dark-400">Not serving on any teams</p>
          ) : (
            <div className="space-y-2">
              {member.volunteerPositions.map((vp) => (
                <div key={vp.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 dark:border-dark-600">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-dark-50">{vp.team.name}</p>
                    <span className="text-[10px] text-slate-500 dark:text-dark-300">{vp.team.ministryArea ?? "General"}</span>
                  </div>
                  <span className={`badge text-[10px] ${vp.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300"}`}>
                    {vp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Life Events Timeline ─────────────────────────────── */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">Life Events</h3>
        </div>
        {member.lifeEvents.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-dark-400">No life events recorded</p>
        ) : (
          <div className="relative ml-3 border-l-2 border-slate-200 pl-6 dark:border-dark-600">
            {member.lifeEvents.map((event) => (
              <div key={event.id} className="relative mb-4 last:mb-0">
                <div className={`absolute -left-[31px] h-3 w-3 rounded-full border-2 border-white dark:border-dark-800 ${LIFE_EVENT_COLORS[event.type] ?? "bg-slate-400"}`} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-900 dark:text-dark-50">
                    {event.type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-dark-400">
                    {formatDate(event.date)}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-dark-300">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
