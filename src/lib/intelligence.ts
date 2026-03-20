import "server-only";
import { prisma } from "@/lib/prisma";

// ─── Engagement Score Computation ─────────────────────────
// Weighted score 0-100 based on attendance, giving, groups, volunteering, recency

export async function computeEngagementScores(churchId: string) {
  const now = new Date();
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(now.getMonth() - 12);

  // Fetch all members with their activity data
  const members = await prisma.member.findMany({
    where: { churchId },
    select: {
      id: true,
      lastActivityAt: true,
      attendanceRecords: {
        where: { serviceDate: { gte: twelveWeeksAgo } },
        select: { serviceDate: true },
      },
      contributions: {
        where: { transactionDate: { gte: twelveMonthsAgo } },
        select: { transactionDate: true },
      },
      groupMemberships: {
        where: { isActive: true },
        select: { id: true },
      },
      volunteerPositions: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  // Total Sundays in 12 weeks = 12
  const totalSundays = 12;

  const updates = members.map((member) => {
    // Attendance: unique weeks attended / 12
    const uniqueWeeks = new Set(
      member.attendanceRecords.map((a) => {
        const d = new Date(a.serviceDate);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().slice(0, 10);
      })
    );
    const attendancePct = Math.min(uniqueWeeks.size / totalSundays, 1);

    // Giving consistency: unique months with contributions / 12
    const uniqueMonths = new Set(
      member.contributions.map((c) => {
        const d = new Date(c.transactionDate);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    const givingConsistency = Math.min(uniqueMonths.size / 12, 1);

    // Group participation: active groups (capped at 2 for max score)
    const groupScore = Math.min(member.groupMemberships.length / 2, 1);

    // Volunteering: boolean (active in any team)
    const volunteerScore = member.volunteerPositions.length > 0 ? 1 : 0;

    // Recency: days since last activity, decayed
    const lastActivity = member.lastActivityAt
      ? new Date(member.lastActivityAt)
      : member.attendanceRecords.length > 0
        ? new Date(Math.max(...member.attendanceRecords.map((a) => new Date(a.serviceDate).getTime())))
        : null;

    let recencyScore = 0;
    if (lastActivity) {
      const daysSince = Math.max(0, (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      // Full score if within 7 days, linear decay over 90 days
      recencyScore = Math.max(0, 1 - daysSince / 90);
    }

    // Weighted total
    const score = Math.round(
      (attendancePct * 0.30 +
        givingConsistency * 0.20 +
        groupScore * 0.20 +
        volunteerScore * 0.15 +
        recencyScore * 0.15) * 100
    );

    // Tier mapping
    let tier: "CHAMPION" | "ENGAGED" | "CASUAL" | "AT_RISK" | "DISENGAGED";
    if (score >= 80) tier = "CHAMPION";
    else if (score >= 60) tier = "ENGAGED";
    else if (score >= 40) tier = "CASUAL";
    else if (score >= 20) tier = "AT_RISK";
    else tier = "DISENGAGED";

    return { id: member.id, score, tier };
  });

  // Batch update in groups of 50
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    await Promise.all(
      batch.map((u) =>
        prisma.member.update({
          where: { id: u.id },
          data: { engagementScore: u.score, engagementTier: u.tier },
        })
      )
    );
  }

  return { updated: updates.length };
}

// ─── Group Health Score Computation ───────────────────────

export async function computeGroupHealthScores(churchId: string) {
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const groups = await prisma.group.findMany({
    where: { churchId },
    select: {
      id: true,
      isActive: true,
      memberships: {
        select: {
          isActive: true,
          member: {
            select: {
              engagementScore: true,
              lastActivityAt: true,
            },
          },
        },
      },
    },
  });

  const updates = groups.map((group) => {
    if (!group.isActive) {
      return { id: group.id, healthScore: 0 };
    }

    const activeMemberships = group.memberships.filter((m) => m.isActive);
    const totalMemberships = group.memberships.length;

    if (totalMemberships === 0) {
      return { id: group.id, healthScore: 0 };
    }

    // Factor 1: Retention rate (active / total)
    const retentionRate = activeMemberships.length / totalMemberships;

    // Factor 2: Average member engagement score
    const avgEngagement = activeMemberships.length > 0
      ? activeMemberships.reduce((sum, m) => sum + (m.member.engagementScore ?? 0), 0) / activeMemberships.length / 100
      : 0;

    // Factor 3: Recent activity (members active in last 4 weeks)
    const recentlyActive = activeMemberships.filter((m) => {
      if (!m.member.lastActivityAt) return false;
      return new Date(m.member.lastActivityAt) >= fourWeeksAgo;
    }).length;
    const activityRate = activeMemberships.length > 0 ? recentlyActive / activeMemberships.length : 0;

    // Factor 4: Group size health (penalize very small or empty groups)
    const sizeScore = activeMemberships.length >= 3 ? 1 : activeMemberships.length / 3;

    // Weighted health score (0-100)
    const healthScore = Math.round(
      (retentionRate * 0.25 +
        avgEngagement * 0.30 +
        activityRate * 0.30 +
        sizeScore * 0.15) * 100
    );

    return { id: group.id, healthScore };
  });

  // Batch update
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    await Promise.all(
      batch.map((u) =>
        prisma.group.update({
          where: { id: u.id },
          data: { healthScore: u.healthScore },
        })
      )
    );
  }

  return { updated: updates.length };
}

// ─── Burnout Risk Detection ──────────────────────────────

export async function computeBurnoutRisk(churchId: string) {
  const positions = await prisma.volunteerPosition.findMany({
    where: {
      status: "ACTIVE",
      team: { churchId },
    },
    select: {
      id: true,
      memberId: true,
      hoursLogged: true,
    },
  });

  // Group by member to count teams and total hours
  const memberMap = new Map<string, { positionIds: string[]; totalHours: number }>();
  for (const pos of positions) {
    const entry = memberMap.get(pos.memberId) ?? { positionIds: [], totalHours: 0 };
    entry.positionIds.push(pos.id);
    entry.totalHours += pos.hoursLogged;
    memberMap.set(pos.memberId, entry);
  }

  const updates: { id: string; risk: "LOW" | "MODERATE" | "HIGH" }[] = [];

  Array.from(memberMap.values()).forEach((data) => {
    const teamCount = data.positionIds.length;
    const weeklyHours = data.totalHours; // hoursLogged represents weekly commitment

    let risk: "LOW" | "MODERATE" | "HIGH";
    if (teamCount >= 2 && weeklyHours >= 15) {
      risk = "HIGH";
    } else if (teamCount >= 2 || weeklyHours >= 10) {
      risk = "MODERATE";
    } else {
      risk = "LOW";
    }

    data.positionIds.forEach((posId) => {
      updates.push({ id: posId, risk });
    });
  });

  // Batch update
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    await Promise.all(
      batch.map((u) =>
        prisma.volunteerPosition.update({
          where: { id: u.id },
          data: { burnoutRisk: u.risk },
        })
      )
    );
  }

  return { updated: updates.length };
}

// ─── Alert Auto-Generation Engine ────────────────────────

export async function generateAlerts(churchId: string) {
  const now = new Date();
  let alertsCreated = 0;

  // Helper to create alert if no matching undismissed alert already exists
  async function createAlertIfNew(
    eventType: string,
    headline: string,
    summary: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    memberIds: string[]
  ) {
    // Check for existing undismissed alert of same type
    const existing = await prisma.alertEvent.findFirst({
      where: {
        churchId,
        eventType: eventType as never,
        dismissed: false,
      },
    });

    if (existing) return; // Don't create duplicate

    const alert = await prisma.alertEvent.create({
      data: {
        churchId,
        eventType: eventType as never,
        headline,
        summary,
        severity: severity as never,
      },
    });

    if (memberIds.length > 0) {
      await prisma.alertMemberImpact.createMany({
        data: memberIds.map((memberId) => ({
          alertEventId: alert.id,
          memberId,
          churchId,
        })),
      });
    }

    alertsCreated++;
  }

  // ── Rule 1: Attendance Drop ──
  // Members who attended 3+ times in prior 8 weeks but 0 in last 3 weeks
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const elevenWeeksAgo = new Date(now.getTime() - 77 * 24 * 60 * 60 * 1000);

  const membersWithAttendance = await prisma.member.findMany({
    where: {
      churchId,
      membershipStatus: { in: ["MEMBER", "ATTENDEE"] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      attendanceRecords: {
        where: { serviceDate: { gte: elevenWeeksAgo } },
        select: { serviceDate: true },
      },
    },
  });

  const droppedMembers = membersWithAttendance.filter((m) => {
    const priorRecords = m.attendanceRecords.filter(
      (a) => new Date(a.serviceDate) < threeWeeksAgo
    );
    const recentRecords = m.attendanceRecords.filter(
      (a) => new Date(a.serviceDate) >= threeWeeksAgo
    );
    return priorRecords.length >= 3 && recentRecords.length === 0;
  });

  if (droppedMembers.length > 0) {
    await createAlertIfNew(
      "ATTENDANCE_DROP",
      `${droppedMembers.length} previously regular members have stopped attending`,
      `These members attended at least 3 times in the prior 8 weeks but haven't been seen in 3+ weeks: ${droppedMembers.slice(0, 5).map((m) => `${m.firstName} ${m.lastName}`).join(", ")}${droppedMembers.length > 5 ? ` and ${droppedMembers.length - 5} more` : ""}`,
      droppedMembers.length >= 10 ? "HIGH" : "MEDIUM",
      droppedMembers.map((m) => m.id)
    );
  }

  // ── Rule 2: Visitor Follow-Up Missed ──
  // First-time visitors from 7-30 days ago with no second visit
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentVisitors = await prisma.member.findMany({
    where: {
      churchId,
      membershipStatus: "VISITOR",
      createdAt: { gte: thirtyDaysAgo, lte: sevenDaysAgo },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      _count: { select: { attendanceRecords: true } },
    },
  });

  const missedFollowups = recentVisitors.filter((v) => v._count.attendanceRecords <= 1);

  if (missedFollowups.length > 0) {
    await createAlertIfNew(
      "VISITOR_FOLLOWUP_MISSED",
      `${missedFollowups.length} first-time visitors haven't returned`,
      `Visitors from the past 7-30 days who haven't attended a second time: ${missedFollowups.slice(0, 5).map((v) => `${v.firstName} ${v.lastName}`).join(", ")}${missedFollowups.length > 5 ? ` and ${missedFollowups.length - 5} more` : ""}`,
      missedFollowups.length >= 5 ? "HIGH" : "MEDIUM",
      missedFollowups.map((v) => v.id)
    );
  }

  // ── Rule 3: Volunteer Burnout ──
  const highBurnoutPositions = await prisma.volunteerPosition.findMany({
    where: {
      status: "ACTIVE",
      burnoutRisk: "HIGH",
      team: { churchId },
    },
    select: {
      memberId: true,
      member: { select: { firstName: true, lastName: true } },
    },
  });

  // Deduplicate by member
  const uniqueBurnoutMembers = new Map<string, { firstName: string; lastName: string }>();
  for (const pos of highBurnoutPositions) {
    uniqueBurnoutMembers.set(pos.memberId, pos.member);
  }

  if (uniqueBurnoutMembers.size > 0) {
    const names = Array.from(uniqueBurnoutMembers.values());
    await createAlertIfNew(
      "VOLUNTEER_BURNOUT",
      `${uniqueBurnoutMembers.size} volunteers at high burnout risk`,
      `Serving on multiple teams with heavy hours: ${names.slice(0, 5).map((n) => `${n.firstName} ${n.lastName}`).join(", ")}${names.length > 5 ? ` and ${names.length - 5} more` : ""}`,
      "HIGH",
      Array.from(uniqueBurnoutMembers.keys())
    );
  }

  // ── Rule 4: Group Health Warning ──
  const unhealthyGroups = await prisma.group.findMany({
    where: {
      churchId,
      isActive: true,
      healthScore: { lt: 40 },
    },
    select: { id: true, name: true },
  });

  if (unhealthyGroups.length > 0) {
    await createAlertIfNew(
      "GROUP_HEALTH_WARNING",
      `${unhealthyGroups.length} small groups have low health scores`,
      `Groups scoring below 40: ${unhealthyGroups.map((g) => g.name).join(", ")}`,
      unhealthyGroups.length >= 3 ? "HIGH" : "MEDIUM",
      [] // group-level alert, not member-specific
    );
  }

  // ── Rule 5: Growth Track Stall ──
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const stalledTracks = await prisma.growthTrack.findMany({
    where: {
      churchId,
      status: "ACTIVE",
      updatedAt: { lt: ninetyDaysAgo },
    },
    select: {
      memberId: true,
      currentStep: true,
      member: { select: { firstName: true, lastName: true } },
    },
  });

  if (stalledTracks.length > 0) {
    // Also update their status to STALLED
    await prisma.growthTrack.updateMany({
      where: {
        churchId,
        status: "ACTIVE",
        updatedAt: { lt: ninetyDaysAgo },
      },
      data: { status: "STALLED" },
    });

    await createAlertIfNew(
      "THRESHOLD_BREACH",
      `${stalledTracks.length} members stalled in growth track for 90+ days`,
      `Members stuck at the same step: ${stalledTracks.slice(0, 5).map((t) => `${t.member.firstName} ${t.member.lastName} (${t.currentStep})`).join(", ")}${stalledTracks.length > 5 ? ` and ${stalledTracks.length - 5} more` : ""}`,
      "MEDIUM",
      stalledTracks.map((t) => t.memberId)
    );
  }

  // ── Auto-dismiss resolved alerts ──
  // If attendance drop members have returned, dismiss the alert
  const attendanceDropAlerts = await prisma.alertEvent.findMany({
    where: { churchId, eventType: "ATTENDANCE_DROP", dismissed: false },
    select: { id: true },
  });

  if (attendanceDropAlerts.length > 0 && droppedMembers.length === 0) {
    await prisma.alertEvent.updateMany({
      where: { id: { in: attendanceDropAlerts.map((a) => a.id) } },
      data: { dismissed: true },
    });
  }

  return { alertsCreated };
}

// ─── Run All Intelligence ────────────────────────────────

export async function runIntelligenceRefresh(churchId: string) {
  const engagement = await computeEngagementScores(churchId);
  const groupHealth = await computeGroupHealthScores(churchId);
  const burnout = await computeBurnoutRisk(churchId);
  const alerts = await generateAlerts(churchId);

  return {
    engagementScoresUpdated: engagement.updated,
    groupHealthScoresUpdated: groupHealth.updated,
    burnoutRiskUpdated: burnout.updated,
    alertsCreated: alerts.alertsCreated,
  };
}
