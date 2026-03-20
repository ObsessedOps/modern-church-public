import "server-only";
import { prisma } from "@/lib/prisma";
import { IntegrationType } from "@/generated/prisma/client";

// ─── Dashboard ───────────────────────────────────────────

export async function getDashboardData(churchId: string, campusId?: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Campus-aware filter helpers
  const memberWhere = { churchId, ...(campusId && { primaryCampusId: campusId }) };
  const contributionCampusFilter = campusId ? { member: { primaryCampusId: campusId } } : {};

  const [
    memberCount,
    activeMemberCount,
    recentServiceSummaries,
    givingThisWeek,
    givingMTD,
    givingYTD,
    activeAlerts,
    recentLifeEvents,
    visitorCount,
    activeGroupCount,
    volunteerCount,
    recentAuditLog,
  ] = await Promise.all([
    // Total member count
    prisma.member.count({ where: memberWhere }),

    // Active members (MEMBER or ATTENDEE status)
    prisma.member.count({
      where: {
        ...memberWhere,
        membershipStatus: { in: ["MEMBER", "ATTENDEE"] },
      },
    }),

    // Last 4 weeks of service summaries
    prisma.serviceSummary.findMany({
      where: {
        churchId,
        ...(campusId && { campusId }),
        serviceDate: { gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { serviceDate: "desc" },
    }),

    // Giving this week
    prisma.contribution.aggregate({
      where: {
        churchId,
        transactionDate: { gte: startOfWeek },
        ...contributionCampusFilter,
      },
      _sum: { amount: true },
    }),

    // Giving MTD
    prisma.contribution.aggregate({
      where: {
        churchId,
        transactionDate: { gte: startOfMonth },
        ...contributionCampusFilter,
      },
      _sum: { amount: true },
    }),

    // Giving YTD
    prisma.contribution.aggregate({
      where: {
        churchId,
        transactionDate: { gte: startOfYear },
        ...contributionCampusFilter,
      },
      _sum: { amount: true },
    }),

    // Active (undismissed) alerts, top 5
    prisma.alertEvent.findMany({
      where: { churchId, dismissed: false },
      orderBy: { detectedAt: "desc" },
      take: 5,
    }),

    // Recent life events, top 5
    prisma.lifeEvent.findMany({
      where: { churchId, ...(campusId && { member: { primaryCampusId: campusId } }) },
      orderBy: { date: "desc" },
      take: 5,
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
    }),

    // Visitors created this week
    prisma.member.count({
      where: {
        ...memberWhere,
        membershipStatus: "VISITOR",
        createdAt: { gte: startOfWeek },
      },
    }),

    // Active group count
    prisma.group.count({
      where: { churchId, isActive: true, ...(campusId && { campusId }) },
    }),

    // Active volunteer positions
    prisma.volunteerPosition.count({
      where: {
        status: "ACTIVE",
        team: { churchId },
        ...(campusId && { member: { primaryCampusId: campusId } }),
      },
    }),

    // Recent audit log, top 8
    prisma.auditLog.findMany({
      where: { churchId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    memberCount,
    activeMemberCount,
    recentServiceSummaries,
    givingThisWeek: givingThisWeek._sum.amount ?? 0,
    givingMTD: givingMTD._sum.amount ?? 0,
    givingYTD: givingYTD._sum.amount ?? 0,
    activeAlerts,
    recentLifeEvents,
    visitorCount,
    activeGroupCount,
    volunteerCount,
    recentAuditLog,
  };
}

// ─── Attendance Trend ────────────────────────────────────

export async function getAttendanceTrend(churchId: string, campusId?: string) {
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);

  const summaries = await prisma.serviceSummary.findMany({
    where: {
      churchId,
      ...(campusId && { campusId }),
      serviceDate: { gte: twelveWeeksAgo },
    },
    orderBy: { serviceDate: "asc" },
  });

  // Group by week (ISO week start = Monday)
  const weekMap = new Map<string, { adultCount: number; childCount: number; onlineCount: number; totalCount: number }>();

  for (const s of summaries) {
    const d = new Date(s.serviceDate);
    const dayOfWeek = d.getDay();
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    const key = weekStart.toISOString().slice(0, 10);

    const existing = weekMap.get(key) ?? { adultCount: 0, childCount: 0, onlineCount: 0, totalCount: 0 };
    existing.adultCount += s.adultCount;
    existing.childCount += s.childCount;
    existing.onlineCount += s.onlineCount;
    existing.totalCount += s.totalCount;
    weekMap.set(key, existing);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, ...data }));
}

// ─── Giving Trend ────────────────────────────────────────

export async function getGivingTrend(churchId: string, campusId?: string) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const contributions = await prisma.contribution.findMany({
    where: {
      churchId,
      transactionDate: { gte: twelveMonthsAgo },
      ...(campusId && { member: { primaryCampusId: campusId } }),
    },
    orderBy: { transactionDate: "asc" },
  });

  // Group by month
  const monthMap = new Map<string, number>();

  for (const c of contributions) {
    const d = new Date(c.transactionDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + c.amount);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));
}

// ─── Members ─────────────────────────────────────────────

export async function getMembers(churchId: string) {
  return prisma.member.findMany({
    where: { churchId },
    orderBy: { engagementScore: "desc" },
    include: {
      _count: {
        select: {
          groupMemberships: true,
          volunteerPositions: true,
          lifeEvents: true,
        },
      },
    },
  });
}

export async function getMemberDetail(memberId: string, churchId: string) {
  return prisma.member.findFirst({
    where: { id: memberId, churchId },
    include: {
      attendanceRecords: { orderBy: { serviceDate: "desc" }, take: 20 },
      contributions: { orderBy: { transactionDate: "desc" }, take: 20 },
      groupMemberships: {
        include: {
          group: { select: { id: true, name: true, type: true, healthScore: true } },
        },
      },
      volunteerPositions: {
        include: {
          team: { select: { id: true, name: true, ministryArea: true } },
        },
      },
      lifeEvents: { orderBy: { date: "desc" } },
      familyMembers: {
        include: {
          familyUnit: {
            include: {
              members: {
                select: { id: true, firstName: true, lastName: true, membershipStatus: true },
              },
            },
          },
        },
      },
    },
  });
}

// ─── Alerts ──────────────────────────────────────────────

export async function getAlerts(churchId: string) {
  return prisma.alertEvent.findMany({
    where: { churchId },
    orderBy: { detectedAt: "desc" },
    include: {
      memberImpacts: {
        include: {
          member: { select: { firstName: true, lastName: true } },
        },
      },
      actionLogs: true,
    },
  });
}

// ─── Groups ──────────────────────────────────────────────

export async function getGroups(churchId: string) {
  return prisma.group.findMany({
    where: { churchId },
    include: {
      _count: { select: { memberships: true } },
    },
  });
}

// ─── Campuses ────────────────────────────────────────────

export async function getCampuses(churchId: string) {
  const campuses = await prisma.campus.findMany({
    where: { churchId },
    orderBy: { isMainCampus: "desc" },
    include: {
      serviceSummaries: {
        orderBy: { serviceDate: "desc" },
        take: 12,
        select: { adultCount: true, childCount: true, onlineCount: true },
      },
      users: {
        where: { role: "CAMPUS_PASTOR" },
        take: 1,
        select: { name: true },
      },
    },
  });

  return campuses.map((c) => {
    const totalAttendance = c.serviceSummaries.reduce(
      (sum, s) => sum + (s.adultCount ?? 0) + (s.childCount ?? 0) + (s.onlineCount ?? 0),
      0
    );
    const avgWeeklyAttendance = c.serviceSummaries.length > 0
      ? Math.round(totalAttendance / c.serviceSummaries.length)
      : null;
    const pastorName = c.users[0]?.name ?? null;
    const { serviceSummaries: _ss, users: _u, ...campus } = c;
    return { ...campus, avgWeeklyAttendance, seatingCapacity: null as number | null, pastorName };
  });
}

// ─── Integrations ────────────────────────────────────────

const ALL_INTEGRATION_TYPES = Object.values(IntegrationType);

export async function getIntegrations(churchId: string) {
  const existing = await prisma.integration.findMany({
    where: { churchId },
    orderBy: { createdAt: "asc" },
  });

  // Auto-create DISCONNECTED records for any missing integration types
  const existingTypes = new Set(existing.map((i) => i.type));
  const missing = ALL_INTEGRATION_TYPES.filter((t) => !existingTypes.has(t));

  if (missing.length > 0) {
    await prisma.integration.createMany({
      data: missing.map((type) => ({ churchId, type, status: "DISCONNECTED" as const })),
    });
    return prisma.integration.findMany({
      where: { churchId },
      orderBy: { createdAt: "asc" },
    });
  }

  return existing;
}

// ─── Activity Feed (AuditLog) ───────────────────────────

export async function getRecentActivity(churchId: string, limit = 5) {
  return prisma.auditLog.findMany({
    where: { churchId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ─── Giving Data ────────────────────────────────────────

export async function getGivingData(churchId: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [weeklyTotal, mtdTotal, ytdTotal, recentTransactions, uniqueDonors, fundGroupBy] = await Promise.all([
    prisma.contribution.aggregate({
      where: { churchId, transactionDate: { gte: startOfWeek } },
      _sum: { amount: true },
    }),
    prisma.contribution.aggregate({
      where: { churchId, transactionDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.contribution.aggregate({
      where: { churchId, transactionDate: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.contribution.findMany({
      where: { churchId },
      orderBy: { transactionDate: "desc" },
      take: 25,
      include: { member: { select: { firstName: true, lastName: true } } },
    }),
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: { churchId, transactionDate: { gte: startOfYear }, memberId: { not: null } },
    }),
    prisma.contribution.groupBy({
      by: ["fund"],
      where: { churchId, transactionDate: { gte: startOfYear } },
      _sum: { amount: true },
    }),
  ]);

  // Fund breakdown — aggregated in DB instead of fetching all rows
  const fundBreakdown = fundGroupBy
    .map((f) => ({ fund: f.fund, total: Math.round((f._sum.amount ?? 0) * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  return {
    weeklyTotal: weeklyTotal._sum.amount ?? 0,
    mtdTotal: mtdTotal._sum.amount ?? 0,
    ytdTotal: ytdTotal._sum.amount ?? 0,
    avgPerGiver: uniqueDonors.length > 0 ? Math.round(((ytdTotal._sum.amount ?? 0) / uniqueDonors.length) * 100) / 100 : 0,
    uniqueDonorCount: uniqueDonors.length,
    fundBreakdown,
    recentTransactions,
  };
}

// ─── Giving Health Intelligence ─────────────────────────

export async function getGivingHealthData(churchId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    recurringDonorIds,
    recentRecurringDonorIds,
    thisMonthGivers,
    lastMonthGivers,
    allTimeDonorIds,
    activeMembers,
  ] = await Promise.all([
    // All members who have ever given recurring
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: { churchId, isRecurring: true, memberId: { not: null } },
    }),
    // Members who gave recurring in the last 30 days
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: {
        churchId,
        isRecurring: true,
        memberId: { not: null },
        transactionDate: { gte: thirtyDaysAgo },
      },
    }),
    // This month givers with totals
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: { churchId, memberId: { not: null }, transactionDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // Last month givers with totals
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: {
        churchId,
        memberId: { not: null },
        transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
    // All-time donors (for first-time detection)
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: {
        churchId,
        memberId: { not: null },
        transactionDate: { lt: startOfMonth },
      },
    }),
    // Active members (for giving-to-attendance ratio)
    prisma.member.count({
      where: {
        churchId,
        membershipStatus: { in: ["MEMBER", "ATTENDEE"] },
        attendanceRecords: { some: { serviceDate: { gte: thirtyDaysAgo } } },
      },
    }),
  ]);

  // Lapsed recurring donors
  const recentRecurringSet = new Set(recentRecurringDonorIds.map((r) => r.memberId));
  const lapsedRecurringIds = recurringDonorIds
    .map((r) => r.memberId!)
    .filter((id) => !recentRecurringSet.has(id));

  // Fetch lapsed member details
  const lapsedRecurring = lapsedRecurringIds.length > 0
    ? await prisma.member.findMany({
        where: { id: { in: lapsedRecurringIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        take: 20,
      })
    : [];

  // First-time givers this month
  const priorDonorSet = new Set(allTimeDonorIds.map((d) => d.memberId));
  const firstTimeGiverIds = thisMonthGivers
    .map((g) => g.memberId!)
    .filter((id) => !priorDonorSet.has(id));

  const firstTimeGivers = firstTimeGiverIds.length > 0
    ? await prisma.member.findMany({
        where: { id: { in: firstTimeGiverIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        take: 20,
      })
    : [];

  // Declining givers (gave less this month than last)
  const lastMonthMap = new Map(lastMonthGivers.map((g) => [g.memberId, g._sum.amount ?? 0]));
  const decliningGiverIds: string[] = [];
  for (const g of thisMonthGivers) {
    const lastAmount = lastMonthMap.get(g.memberId) ?? 0;
    const thisAmount = g._sum.amount ?? 0;
    if (lastAmount > 0 && thisAmount < lastAmount * 0.5) {
      decliningGiverIds.push(g.memberId!);
    }
  }

  const decliningGivers = decliningGiverIds.length > 0
    ? await prisma.member.findMany({
        where: { id: { in: decliningGiverIds.slice(0, 20) } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      })
    : [];

  // Giving-to-attendance ratio
  const givingAttendanceRatio =
    activeMembers > 0
      ? Math.round((thisMonthGivers.length / activeMembers) * 100)
      : 0;

  return {
    lapsedRecurring,
    lapsedRecurringCount: lapsedRecurringIds.length,
    firstTimeGivers,
    firstTimeGiverCount: firstTimeGiverIds.length,
    decliningGivers,
    decliningGiverCount: decliningGiverIds.length,
    givingAttendanceRatio,
    activeGiversThisMonth: thisMonthGivers.length,
    activeAttendees: activeMembers,
  };
}

// ─── Visitors ───────────────────────────────────────────

export async function getVisitors(churchId: string) {
  return prisma.member.findMany({
    where: { churchId, membershipStatus: "VISITOR" },
    orderBy: { createdAt: "desc" },
    include: {
      primaryCampus: { select: { name: true } },
      _count: {
        select: {
          attendanceRecords: true,
          groupMemberships: true,
          workflowExecutions: true,
        },
      },
      growthTracks: {
        select: { id: true, currentStep: true, status: true },
        take: 1,
      },
      workflowExecutions: {
        select: {
          id: true,
          status: true,
          workflow: { select: { name: true } },
          startedAt: true,
          completedAt: true,
        },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });
}

// ─── Volunteer Data ─────────────────────────────────────

export async function getVolunteerData(churchId: string) {
  const teams = await prisma.volunteerTeam.findMany({
    where: { churchId },
    include: {
      positions: {
        include: {
          member: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const allPositions = teams.flatMap((t) => t.positions);
  const activeCount = allPositions.filter((p) => p.status === "ACTIVE").length;
  const highBurnout = allPositions.filter((p) => p.burnoutRisk === "HIGH").length;
  const moderateBurnout = allPositions.filter((p) => p.burnoutRisk === "MODERATE").length;

  return {
    teams,
    totalPositions: allPositions.length,
    activeCount,
    highBurnout,
    moderateBurnout,
  };
}

// ─── Service Data (Worship) ─────────────────────────────

export async function getServiceData(churchId: string) {
  return prisma.serviceSummary.findMany({
    where: { churchId },
    orderBy: { serviceDate: "desc" },
    take: 24,
    include: {
      campus: { select: { name: true } },
    },
  });
}

// ─── Life Events ────────────────────────────────────────

export async function getLifeEvents(churchId: string) {
  return prisma.lifeEvent.findMany({
    where: { churchId },
    orderBy: { date: "desc" },
    include: {
      member: { select: { firstName: true, lastName: true } },
    },
  });
}

// ─── Staff / Users ──────────────────────────────────────

export async function getStaff(churchId: string) {
  return prisma.user.findMany({
    where: { churchId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      username: true,
      campusId: true,
      lastLoginAt: true,
    },
  });
}

// ─── Church Profile ─────────────────────────────────────

export async function getChurchProfile(churchId: string) {
  const [church, campuses, integrations, userCount] = await Promise.all([
    prisma.church.findUnique({ where: { id: churchId } }),
    prisma.campus.findMany({ where: { churchId }, orderBy: { isMainCampus: "desc" } }),
    prisma.integration.findMany({ where: { churchId } }),
    prisma.user.count({ where: { churchId } }),
  ]);
  return { church, campuses, integrations, userCount };
}

// ─── Growth Track ───────────────────────────────────────

export async function getGrowthTrackData(churchId: string) {
  const tracks = await prisma.growthTrack.findMany({
    where: { churchId },
    orderBy: { updatedAt: "desc" },
    include: {
      member: { select: { firstName: true, lastName: true, email: true } },
      campus: { select: { name: true } },
    },
  });

  const activeCount = tracks.filter((t) => t.status === "ACTIVE").length;
  const completedCount = tracks.filter((t) => t.status === "COMPLETED").length;
  const stalledCount = tracks.filter((t) => t.status === "STALLED").length;

  const stepCounts = {
    CONNECT: tracks.filter((t) => t.currentStep === "CONNECT" && t.status === "ACTIVE").length,
    DISCOVER: tracks.filter((t) => t.currentStep === "DISCOVER" && t.status === "ACTIVE").length,
    SERVE: tracks.filter((t) => t.currentStep === "SERVE" && t.status === "ACTIVE").length,
    COMPLETED: completedCount,
  };

  return {
    tracks,
    activeCount,
    completedCount,
    stalledCount,
    totalCount: tracks.length,
    stepCounts,
  };
}

// ─── Engagement Distribution ────────────────────────────

export async function getEngagementDistribution(churchId: string) {
  const result = await prisma.member.groupBy({
    by: ["engagementTier"],
    where: { churchId },
    _count: true,
  });
  return result.map((r) => ({ tier: r.engagementTier, count: r._count }));
}

// ─── Grace Briefing Data ───────────────────────────────

export async function getBriefingData(churchId: string) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    currentWeekServices,
    priorWeekServices,
    givingThisWeek,
    visitorCount,
    totalVolunteerPositions,
    filledPositions,
    activeAlerts,
    atRiskMembers,
    activePathways,
    pathwayExecutionsThisWeek,
  ] = await Promise.all([
    prisma.serviceSummary.findMany({
      where: { churchId, serviceDate: { gte: oneWeekAgo } },
    }),
    prisma.serviceSummary.findMany({
      where: { churchId, serviceDate: { gte: twoWeeksAgo, lt: oneWeekAgo } },
    }),
    prisma.contribution.aggregate({
      where: { churchId, transactionDate: { gte: startOfWeek } },
      _sum: { amount: true },
    }),
    prisma.member.count({
      where: { churchId, membershipStatus: "VISITOR", createdAt: { gte: oneWeekAgo } },
    }),
    prisma.volunteerPosition.count({
      where: { team: { churchId } },
    }),
    prisma.volunteerPosition.count({
      where: { team: { churchId }, status: "ACTIVE" },
    }),
    prisma.alertEvent.findMany({
      where: { churchId, dismissed: false },
      orderBy: { detectedAt: "desc" },
      take: 5,
      include: {
        memberImpacts: {
          include: { member: { select: { firstName: true, lastName: true } } },
          take: 5,
        },
      },
    }),
    prisma.member.findMany({
      where: {
        churchId,
        engagementTier: { in: ["AT_RISK", "DISENGAGED"] },
      },
      orderBy: { engagementScore: "asc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        engagementTier: true,
        lastActivityAt: true,
        primaryCampus: { select: { name: true } },
      },
    }),
    prisma.workflow.count({
      where: { churchId, status: "ACTIVE" },
    }),
    prisma.workflowExecution.count({
      where: { churchId, startedAt: { gte: oneWeekAgo } },
    }),
  ]);

  // Compute attendance metrics
  const currentAttendance = currentWeekServices.reduce((sum, s) => sum + s.totalCount, 0);
  const priorAttendance = priorWeekServices.reduce((sum, s) => sum + s.totalCount, 0);
  const attendanceDelta = priorAttendance > 0
    ? Math.round(((currentAttendance - priorAttendance) / priorAttendance) * 1000) / 10
    : 0;

  const fillRate = totalVolunteerPositions > 0
    ? Math.round((filledPositions / totalVolunteerPositions) * 100)
    : 100;

  return {
    attendance: {
      current: currentAttendance,
      delta: attendanceDelta,
    },
    giving: givingThisWeek._sum.amount ?? 0,
    visitors: visitorCount,
    volunteerFillRate: fillRate,
    filledPositions,
    totalPositions: totalVolunteerPositions,
    alerts: activeAlerts.map((a) => ({
      id: a.id,
      eventType: a.eventType,
      headline: a.headline,
      summary: a.summary,
      severity: a.severity,
      memberNames: a.memberImpacts.map((m) => `${m.member.firstName} ${m.member.lastName}`),
    })),
    atRiskMembers: atRiskMembers.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      campus: m.primaryCampus.name,
      tier: m.engagementTier,
      weeksAbsent: m.lastActivityAt
        ? Math.floor((now.getTime() - new Date(m.lastActivityAt).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : null,
    })),
    pathways: {
      active: activePathways,
      executionsThisWeek: pathwayExecutionsThisWeek,
    },
  };
}
