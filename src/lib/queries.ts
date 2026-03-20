import "server-only";
import { prisma } from "@/lib/prisma";
import { IntegrationType } from "@/generated/prisma/client";

// ─── Dashboard ───────────────────────────────────────────

export async function getDashboardData(churchId: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

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
    prisma.member.count({ where: { churchId } }),

    // Active members (MEMBER or ATTENDEE status)
    prisma.member.count({
      where: {
        churchId,
        membershipStatus: { in: ["MEMBER", "ATTENDEE"] },
      },
    }),

    // Last 4 weeks of service summaries
    prisma.serviceSummary.findMany({
      where: {
        churchId,
        serviceDate: { gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { serviceDate: "desc" },
    }),

    // Giving this week
    prisma.contribution.aggregate({
      where: {
        churchId,
        transactionDate: { gte: startOfWeek },
      },
      _sum: { amount: true },
    }),

    // Giving MTD
    prisma.contribution.aggregate({
      where: {
        churchId,
        transactionDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),

    // Giving YTD
    prisma.contribution.aggregate({
      where: {
        churchId,
        transactionDate: { gte: startOfYear },
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
      where: { churchId },
      orderBy: { date: "desc" },
      take: 5,
      include: { member: { select: { firstName: true, lastName: true } } },
    }),

    // Visitors created this week
    prisma.member.count({
      where: {
        churchId,
        membershipStatus: "VISITOR",
        createdAt: { gte: startOfWeek },
      },
    }),

    // Active group count
    prisma.group.count({
      where: { churchId, isActive: true },
    }),

    // Active volunteer positions
    prisma.volunteerPosition.count({
      where: {
        status: "ACTIVE",
        team: { churchId },
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

export async function getGivingTrend(churchId: string) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const contributions = await prisma.contribution.findMany({
    where: {
      churchId,
      transactionDate: { gte: twelveMonthsAgo },
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

  const [weeklyTotal, mtdTotal, ytdTotal, recentTransactions, uniqueDonors] = await Promise.all([
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
  ]);

  // Fund breakdown
  const allContributions = await prisma.contribution.findMany({
    where: { churchId, transactionDate: { gte: startOfYear } },
    select: { fund: true, amount: true },
  });
  const fundMap = new Map<string, number>();
  for (const c of allContributions) {
    fundMap.set(c.fund, (fundMap.get(c.fund) ?? 0) + c.amount);
  }
  const fundBreakdown = Array.from(fundMap.entries())
    .map(([fund, total]) => ({ fund, total: Math.round(total * 100) / 100 }))
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

// ─── Visitors ───────────────────────────────────────────

export async function getVisitors(churchId: string) {
  return prisma.member.findMany({
    where: { churchId, membershipStatus: "VISITOR" },
    orderBy: { createdAt: "desc" },
    include: {
      primaryCampus: { select: { name: true } },
      _count: { select: { attendanceRecords: true, groupMemberships: true } },
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
