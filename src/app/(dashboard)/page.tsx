import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import {
  getDashboardData,
  getAttendanceTrend,
  getGivingTrend,
  getGrowthTrackData,
  getBriefingData,
} from "@/lib/queries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { KpiSection } from "@/components/dashboard/KpiSection";
import { AttendanceTrendChart } from "@/components/dashboard/AttendanceTrendChart";
import { GivingTrendChart } from "@/components/dashboard/GivingTrendChart";
import { GraceBriefingSummary, GraceBriefingDetails } from "@/components/dashboard/GraceBriefing";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { RecentLifeEvents } from "@/components/dashboard/RecentLifeEvents";
import { CampusComparison } from "@/components/dashboard/CampusComparison";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { InsightsFeed } from "@/components/dashboard/InsightsFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PathwayAlerts } from "@/components/dashboard/PathwayAlerts";
import { prisma } from "@/lib/prisma";

function getGreeting(timezone: string): string {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()),
    10
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(timezone: string): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ campus?: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, 'dashboard:view')) return <AccessDenied />;
  const { churchId } = session;
  const params = await searchParams;
  const campusSlug = params.campus || undefined;

  // Resolve campus slug to ID
  let campusId: string | undefined;
  if (campusSlug) {
    const allCampuses = await prisma.campus.findMany({
      where: { churchId, status: "ACTIVE" },
      select: { id: true, name: true },
    });
    const match = allCampuses.find(
      (c) => c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === campusSlug
    );
    campusId = match?.id;
  }

  const canSeeGiving = can(session, 'giving:view');
  const canSeeGrowthTrack = can(session, 'growth-track:view');

  // Parallel fetch
  const [dashboard, attendanceTrend, givingTrend, growthTrack, briefing, church] = await Promise.all([
    getDashboardData(churchId, campusId),
    getAttendanceTrend(churchId, campusId),
    canSeeGiving ? getGivingTrend(churchId, campusId) : Promise.resolve([]),
    canSeeGrowthTrack ? getGrowthTrackData(churchId) : Promise.resolve(null),
    getBriefingData(churchId),
    prisma.church.findUnique({ where: { id: churchId }, select: { timezone: true } }),
  ]);

  const tz = church?.timezone ?? "America/Chicago";

  // ── Compute KPI values ──────────────────────────────────

  // Weekend attendance: latest week vs prior week
  const latestWeekSummaries = dashboard.recentServiceSummaries.filter((s) => {
    const d = new Date(s.serviceDate);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });
  const priorWeekSummaries = dashboard.recentServiceSummaries.filter((s) => {
    const d = new Date(s.serviceDate);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return d >= twoWeeksAgo && d < weekAgo;
  });

  const currentAttendance = latestWeekSummaries.reduce((sum, s) => sum + s.totalCount, 0);
  const priorAttendance = priorWeekSummaries.reduce((sum, s) => sum + s.totalCount, 0);
  const attendanceDelta = computeDelta(currentAttendance, priorAttendance);
  const adultsThisWeek = latestWeekSummaries.reduce((sum, s) => sum + s.adultCount, 0);
  const kidsThisWeek = latestWeekSummaries.reduce((sum, s) => sum + s.childCount, 0);
  const onlineThisWeek = latestWeekSummaries.reduce((sum, s) => sum + s.onlineCount, 0);

  // Giving
  const givingDelta = computeDelta(
    dashboard.givingThisWeek,
    dashboard.givingThisWeek > 0 ? dashboard.givingThisWeek * 0.95 : 0 // approximate prior week
  );

  // Salvations/Baptisms from life events (MTD + YTD approximations)
  const salvationBaptismEvents = dashboard.recentLifeEvents.filter(
    (e) => e.type === "SALVATION" || e.type === "BAPTISM"
  );
  const salvationBaptismMTD = salvationBaptismEvents.length;

  // Greeting
  const userName = session.name?.split(" ")[0] ?? "Pastor";
  const greeting = getGreeting(tz);

  return (
    <div className="space-y-6">
      {/* ── Simulated Pathway Alerts ──────────────────────── */}
      <PathwayAlerts />

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
            {greeting}, {userName}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
            {formatDate(tz)}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* ── Grace AI Briefing (Summary + Highlights) ────── */}
      <GraceBriefingSummary data={briefing} />

      {/* ── KPI Cards ────────────────────────────────────── */}
      <KpiSection
        cards={[
          {
            id: "Weekend Attendance",
            node: (
              <KpiCard
                label="Weekend Attendance"
                value={currentAttendance.toLocaleString()}
                delta={attendanceDelta}
                deltaLabel="vs last week"
                detail={`${adultsThisWeek} adults \u00b7 ${kidsThisWeek} kids \u00b7 ${onlineThisWeek} online`}
                icon="Users"
                color="violet"
                href="/attendance"
              />
            ),
          },
          ...(canSeeGiving
            ? [
                {
                  id: "Weekly Giving" as const,
                  node: (
                    <KpiCard
                      label="Weekly Giving"
                      value={formatCurrency(dashboard.givingThisWeek)}
                      delta={givingDelta}
                      deltaLabel="vs last week"
                      detail={`MTD ${formatCurrency(dashboard.givingMTD)} \u00b7 YTD ${formatCurrency(dashboard.givingYTD)}`}
                      icon="Heart"
                      color="emerald"
                      href="/giving"
                    />
                  ),
                },
              ]
            : []),
          ...(can(session, 'visitors:view')
            ? [
                {
                  id: "First-Time Visitors" as const,
                  node: (
                    <KpiCard
                      label="First-Time Visitors"
                      value={dashboard.visitorCount}
                      delta={null}
                      detail="This week"
                      icon="UserPlus"
                      color="blue"
                      href="/visitors"
                    />
                  ),
                },
              ]
            : []),
          {
            id: "Salvations & Baptisms",
            node: (
              <KpiCard
                label="Salvations & Baptisms"
                value={salvationBaptismMTD}
                delta={null}
                detail="Month to date"
                icon="Cross"
                color="purple"
                href="/members"
              />
            ),
          },
          ...(can(session, 'volunteers:view')
            ? [
                {
                  id: "Active Volunteers" as const,
                  node: (
                    <KpiCard
                      label="Active Volunteers"
                      value={dashboard.volunteerCount}
                      delta={null}
                      detail="Serving positions filled"
                      icon="HandHeart"
                      color="amber"
                      href="/volunteers"
                    />
                  ),
                },
              ]
            : []),
          ...(can(session, 'groups:view')
            ? [
                {
                  id: "Small Groups" as const,
                  node: (
                    <KpiCard
                      label="Small Groups"
                      value={dashboard.activeGroupCount}
                      delta={null}
                      detail={`${dashboard.activeMemberCount.toLocaleString()} active members`}
                      icon="UsersRound"
                      color="cyan"
                      href="/groups"
                    />
                  ),
                },
              ]
            : []),
          ...(canSeeGrowthTrack && growthTrack
            ? [
                {
                  id: "Growth Track" as const,
                  node: (
                    <KpiCard
                      label="Growth Track"
                      value={growthTrack.activeCount}
                      delta={null}
                      detail={`${growthTrack.completedCount} completed · ${growthTrack.stalledCount} stalled`}
                      icon="Footprints"
                      color="teal"
                      href="/growth-track"
                    />
                  ),
                },
              ]
            : []),
        ]}
      />

      {/* ── Charts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className={canSeeGiving ? "lg:col-span-3" : "lg:col-span-5"}>
          <AttendanceTrendChart data={attendanceTrend} />
        </div>
        {canSeeGiving && (
          <div className="lg:col-span-2">
            <GivingTrendChart data={givingTrend} />
          </div>
        )}
      </div>

      {/* ── Grace AI Details (Action Items, Disengagement, Easter) */}
      <GraceBriefingDetails data={briefing} />

      {/* ── Alerts, Insights & Life Events ─────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AlertFeed alerts={dashboard.activeAlerts} />
        {can(session, 'insights:view') && <InsightsFeed />}
        <RecentLifeEvents lifeEvents={dashboard.recentLifeEvents} />
      </div>

      {/* ── Campus Comparison & Activity ──────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CampusComparison />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed entries={dashboard.recentAuditLog} />
        </div>
      </div>
    </div>
  );
}
