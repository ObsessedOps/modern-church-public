import "server-only";
import { prisma } from "@/lib/prisma";
import { triggerWorkflowsForAlert, advanceWorkflows } from "@/lib/workflows";

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

    // Trigger matching care workflows
    try {
      await triggerWorkflowsForAlert(churchId, alert.id, eventType as never, severity);
    } catch (e) {
      console.error("Workflow trigger error:", e);
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

// ─── Custom Threshold Evaluation ────────────────────────

export async function evaluateCustomThresholds(churchId: string) {
  const thresholds = await prisma.customThreshold.findMany({
    where: { churchId, isActive: true },
  });

  let triggered = 0;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const threshold of thresholds) {
    let currentValue: number | null = null;

    switch (threshold.metric) {
      case "ATTENDANCE_TOTAL": {
        const where: Record<string, unknown> = {
          churchId,
          serviceDate: { gte: oneWeekAgo },
        };
        if (threshold.scope === "CAMPUS" && threshold.scopeId) {
          where.campusId = threshold.scopeId;
        }
        const result = await prisma.serviceSummary.aggregate({
          where: where as never,
          _sum: { totalCount: true },
        });
        currentValue = result._sum.totalCount ?? 0;
        break;
      }

      case "GROUP_ATTENDANCE": {
        if (!threshold.scopeId) break;
        const activeCount = await prisma.groupMembership.count({
          where: { groupId: threshold.scopeId, isActive: true },
        });
        currentValue = activeCount;
        break;
      }

      case "VOLUNTEER_FILL_RATE": {
        if (!threshold.scopeId) break;
        const total = await prisma.volunteerPosition.count({
          where: { teamId: threshold.scopeId },
        });
        const active = await prisma.volunteerPosition.count({
          where: { teamId: threshold.scopeId, status: "ACTIVE" },
        });
        currentValue = total > 0 ? Math.round((active / total) * 100) : 100;
        break;
      }

      case "VOLUNTEER_ABSENT_WEEKS": {
        if (!threshold.scopeId) break;
        const member = await prisma.member.findUnique({
          where: { id: threshold.scopeId },
          select: { lastActivityAt: true },
        });
        if (member?.lastActivityAt) {
          const daysSince = (now.getTime() - new Date(member.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
          currentValue = Math.floor(daysSince / 7);
        }
        break;
      }

      case "GROUP_HEALTH_SCORE": {
        if (!threshold.scopeId) break;
        const group = await prisma.group.findUnique({
          where: { id: threshold.scopeId },
          select: { healthScore: true },
        });
        currentValue = group?.healthScore ?? null;
        break;
      }

      case "VISITOR_COUNT": {
        const visitorWhere: Record<string, unknown> = {
          churchId,
          membershipStatus: "VISITOR",
          createdAt: { gte: oneWeekAgo },
        };
        if (threshold.scope === "CAMPUS" && threshold.scopeId) {
          visitorWhere.primaryCampusId = threshold.scopeId;
        }
        currentValue = await prisma.member.count({ where: visitorWhere as never });
        break;
      }

      case "MEMBER_ENGAGEMENT_SCORE": {
        if (!threshold.scopeId) break;
        const mem = await prisma.member.findUnique({
          where: { id: threshold.scopeId },
          select: { engagementScore: true },
        });
        currentValue = mem?.engagementScore ?? null;
        break;
      }

      case "GROWTH_TRACK_STALL_DAYS": {
        if (!threshold.scopeId) break;
        const track = await prisma.growthTrack.findFirst({
          where: { memberId: threshold.scopeId, churchId, status: "ACTIVE" },
          select: { updatedAt: true },
        });
        if (track) {
          currentValue = Math.floor((now.getTime() - new Date(track.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        }
        break;
      }
    }

    if (currentValue === null) continue;

    // Check if threshold is breached
    const breached =
      (threshold.operator === "LESS_THAN" && currentValue < threshold.value) ||
      (threshold.operator === "GREATER_THAN" && currentValue > threshold.value);

    if (breached) {
      // Check if we already have an undismissed THRESHOLD_BREACH alert for this threshold
      const existing = await prisma.alertEvent.findFirst({
        where: {
          churchId,
          eventType: "THRESHOLD_BREACH",
          dismissed: false,
          summary: { contains: threshold.id },
        },
      });

      if (!existing) {
        await prisma.alertEvent.create({
          data: {
            churchId,
            eventType: "THRESHOLD_BREACH",
            headline: `Threshold breached: ${threshold.name}`,
            summary: `Custom threshold "${threshold.name}" triggered. Current value: ${currentValue}, threshold: ${threshold.operator === "LESS_THAN" ? "<" : ">"} ${threshold.value}. [threshold:${threshold.id}]`,
            severity: threshold.severity,
          },
        });
        triggered++;
      }

      await prisma.customThreshold.update({
        where: { id: threshold.id },
        data: { lastTriggeredAt: now },
      });
    }
  }

  return { triggered };
}

// ─── AI Insight Generation ──────────────────────────────

export async function generateInsights(churchId: string) {
  let insightsCreated = 0;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = oneWeekAgo;

  // Helper to check for duplicate insight
  async function hasRecentInsight(type: string, titleContains: string): Promise<boolean> {
    const existing = await prisma.insight.findFirst({
      where: {
        churchId,
        type: type as never,
        isResolved: false,
        title: { contains: titleContains },
        createdAt: { gte: sevenDaysAgo },
      },
    });
    return !!existing;
  }

  // Get all users with leadership roles for recipient routing
  const leaders = await prisma.user.findMany({
    where: {
      churchId,
      role: {
        in: [
          "SENIOR_PASTOR", "EXECUTIVE_PASTOR", "CAMPUS_PASTOR",
          "YOUTH_PASTOR", "KIDS_PASTOR", "WORSHIP_LEADER",
          "GROUPS_DIRECTOR", "OUTREACH_DIRECTOR", "STAFF",
        ],
      },
    },
    select: { id: true, role: true, campusId: true },
  });

  const seniorPastors = leaders.filter((l) => l.role === "SENIOR_PASTOR" || l.role === "EXECUTIVE_PASTOR");
  const campusPastors = leaders.filter((l) => l.role === "CAMPUS_PASTOR");

  // ── Insight 1: Volunteer Staffing Gaps ──
  const teams = await prisma.volunteerTeam.findMany({
    where: { churchId },
    select: {
      id: true,
      name: true,
      leaderId: true,
      campusId: true,
      requiresBackgroundCheck: true,
      positions: {
        select: { id: true, status: true, memberId: true },
      },
    },
  });

  for (const team of teams) {
    const totalPositions = team.positions.length;
    const activePositions = team.positions.filter((p) => p.status === "ACTIVE").length;
    const inactiveCount = totalPositions - activePositions;

    if (inactiveCount > 0 && totalPositions > 0) {
      const fillRate = Math.round((activePositions / totalPositions) * 100);
      if (fillRate < 80) {
        if (await hasRecentInsight("STAFFING_GAP", team.name)) continue;

        // Find suggested volunteers (engaged members not on this team)
        const teamMemberIds = team.positions.map((p) => p.memberId);
        const suggestedVolunteers = await prisma.member.findMany({
          where: {
            churchId,
            engagementTier: { in: ["CHAMPION", "ENGAGED"] },
            id: { notIn: teamMemberIds },
            ...(team.requiresBackgroundCheck ? {
              volunteerPositions: {
                some: { backgroundCheckDate: { not: null } },
              },
            } : {}),
          },
          select: { id: true, firstName: true, lastName: true },
          take: 3,
        });

        const suggestionText = suggestedVolunteers.length > 0
          ? `Suggested volunteers: ${suggestedVolunteers.map((v) => `${v.firstName} ${v.lastName}`).join(", ")}`
          : "Consider a volunteer recruitment push for this team.";

        // Route to team leader + campus pastors
        const recipientIds: string[] = [];
        if (team.leaderId) {
          const leaderUser = leaders.find((l) => l.id === team.leaderId);
          if (leaderUser) recipientIds.push(leaderUser.id);
        }
        const relevantCampusPastors = team.campusId
          ? campusPastors.filter((cp) => cp.campusId === team.campusId)
          : campusPastors;
        for (const cp of relevantCampusPastors) {
          if (!recipientIds.includes(cp.id)) recipientIds.push(cp.id);
        }
        for (const sp of seniorPastors) {
          if (!recipientIds.includes(sp.id)) recipientIds.push(sp.id);
        }

        if (recipientIds.length > 0) {
          await prisma.insight.create({
            data: {
              churchId,
              type: "STAFFING_GAP",
              source: "AI_GENERATED",
              priority: fillRate < 50 ? "URGENT" : "IMPORTANT",
              title: `${team.name} team is ${inactiveCount} volunteer${inactiveCount > 1 ? "s" : ""} short`,
              body: `The ${team.name} team currently has ${activePositions} of ${totalPositions} positions filled (${fillRate}% fill rate). ${inactiveCount} position${inactiveCount > 1 ? "s need" : " needs"} to be filled.`,
              suggestion: suggestionText,
              recipients: {
                create: recipientIds.map((userId) => ({ userId })),
              },
            },
          });
          insightsCreated++;
        }
      }
    }
  }

  // ── Insight 2: Member Care (engagement drops) ──
  const atRiskMembers = await prisma.member.findMany({
    where: {
      churchId,
      engagementTier: { in: ["AT_RISK", "DISENGAGED"] },
      membershipStatus: { in: ["MEMBER", "ATTENDEE"] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      engagementScore: true,
      lastActivityAt: true,
      primaryCampusId: true,
      familyUnit: {
        select: {
          name: true,
          members: {
            select: { id: true, firstName: true, lastName: true, engagementTier: true },
          },
        },
      },
    },
    take: 10,
    orderBy: { engagementScore: "asc" },
  });

  // Group by family to detect family-wide disengagement
  const familyMap = new Map<string, typeof atRiskMembers>();
  for (const member of atRiskMembers) {
    if (member.familyUnit) {
      const familyMembers = familyMap.get(member.familyUnit.name) ?? [];
      familyMembers.push(member);
      familyMap.set(member.familyUnit.name, familyMembers);
    }
  }

  for (const [familyName, members] of Array.from(familyMap.entries())) {
    if (members.length >= 2) {
      if (await hasRecentInsight("MEMBER_CARE", familyName)) continue;

      const memberNames = members.map((m) => `${m.firstName} ${m.lastName}`).join(" and ");
      const recipientIds: string[] = [];
      // Route to campus pastor + senior pastor
      const campusId = members[0].primaryCampusId;
      const relevantCp = campusPastors.filter((cp) => cp.campusId === campusId);
      for (const cp of relevantCp) recipientIds.push(cp.id);
      for (const sp of seniorPastors) {
        if (!recipientIds.includes(sp.id)) recipientIds.push(sp.id);
      }

      if (recipientIds.length > 0) {
        await prisma.insight.create({
          data: {
            churchId,
            type: "MEMBER_CARE",
            source: "AI_GENERATED",
            priority: "IMPORTANT",
            title: `The ${familyName} may need pastoral attention`,
            body: `${memberNames} are both showing signs of disengagement. Their engagement scores have dropped and attendance has been inconsistent.`,
            suggestion: "A pastoral care visit or phone call would be appropriate to check in on the family.",
            recipients: {
              create: recipientIds.map((userId) => ({ userId })),
            },
          },
        });
        insightsCreated++;
      }
    }
  }

  // ── Insight 3: Celebrations (life events) ──
  const recentLifeEvents = await prisma.lifeEvent.findMany({
    where: {
      churchId,
      date: { gte: sevenDaysAgo },
      type: { in: ["BAPTISM", "SALVATION", "MEMBERSHIP"] },
    },
    select: {
      type: true,
      member: { select: { firstName: true, lastName: true } },
      campus: { select: { name: true } },
    },
  });

  if (recentLifeEvents.length >= 2) {
    if (!(await hasRecentInsight("CELEBRATION", "this week"))) {
      const baptisms = recentLifeEvents.filter((e) => e.type === "BAPTISM");
      const salvations = recentLifeEvents.filter((e) => e.type === "SALVATION");
      const memberships = recentLifeEvents.filter((e) => e.type === "MEMBERSHIP");

      const parts: string[] = [];
      if (baptisms.length > 0) parts.push(`${baptisms.length} baptism${baptisms.length > 1 ? "s" : ""}`);
      if (salvations.length > 0) parts.push(`${salvations.length} salvation${salvations.length > 1 ? "s" : ""}`);
      if (memberships.length > 0) parts.push(`${memberships.length} new member${memberships.length > 1 ? "s" : ""}`);

      const names = recentLifeEvents.map((e) => `${e.member.firstName} ${e.member.lastName}`).join(", ");

      // Send to all leaders as FYI
      const allLeaderIds = leaders.map((l) => l.id);

      if (allLeaderIds.length > 0) {
        await prisma.insight.create({
          data: {
            churchId,
            type: "CELEBRATION",
            source: "AI_GENERATED",
            priority: "FYI",
            title: `${parts.join(" and ")} this week`,
            body: `Celebrating: ${names}. Consider a recognition moment in this Sunday's service.`,
            suggestion: "These stories of life change could encourage the congregation. Consider sharing during announcements or in the weekly newsletter.",
            recipients: {
              create: allLeaderIds.map((userId) => ({ userId })),
            },
          },
        });
        insightsCreated++;
      }
    }
  }

  // ── Insight 4: Visitor Follow-Up Recommendations ──
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const unfollowedVisitors = await prisma.member.findMany({
    where: {
      churchId,
      membershipStatus: "VISITOR",
      createdAt: { gte: thirtyDaysAgo, lte: sevenDaysAgo },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      primaryCampus: { select: { name: true } },
      _count: { select: { attendanceRecords: true } },
    },
  });

  const singleVisitGuests = unfollowedVisitors.filter((v) => v._count.attendanceRecords <= 1);

  if (singleVisitGuests.length >= 2) {
    if (!(await hasRecentInsight("RECOMMENDATION", "visitors"))) {
      const names = singleVisitGuests.map((v) => `${v.firstName} ${v.lastName} (${v.primaryCampus.name})`).join(", ");

      const recipientIds: string[] = [];
      for (const sp of seniorPastors) recipientIds.push(sp.id);
      for (const cp of campusPastors) {
        if (!recipientIds.includes(cp.id)) recipientIds.push(cp.id);
      }
      // Add outreach directors
      const outreachDirs = leaders.filter((l) => l.role === "OUTREACH_DIRECTOR");
      for (const od of outreachDirs) {
        if (!recipientIds.includes(od.id)) recipientIds.push(od.id);
      }

      if (recipientIds.length > 0) {
        await prisma.insight.create({
          data: {
            churchId,
            type: "RECOMMENDATION",
            source: "AI_GENERATED",
            priority: "IMPORTANT",
            title: `${singleVisitGuests.length} first-time visitors need follow-up`,
            body: `These visitors attended once but haven't returned: ${names}. The average follow-up window is closing.`,
            suggestion: "Assign each visitor to a campus pastor or outreach team member for personal follow-up within 48 hours.",
            recipients: {
              create: recipientIds.map((userId) => ({ userId })),
            },
          },
        });
        insightsCreated++;
      }
    }
  }

  return { insightsCreated };
}

// ─── Run All Intelligence ────────────────────────────────

export async function runIntelligenceRefresh(churchId: string) {
  const engagement = await computeEngagementScores(churchId);
  const groupHealth = await computeGroupHealthScores(churchId);
  const burnout = await computeBurnoutRisk(churchId);
  const alerts = await generateAlerts(churchId);
  const thresholds = await evaluateCustomThresholds(churchId);
  const insights = await generateInsights(churchId);

  // Advance any waiting workflow steps
  const workflows = await advanceWorkflows(churchId);

  return {
    engagementScoresUpdated: engagement.updated,
    groupHealthScoresUpdated: groupHealth.updated,
    burnoutRiskUpdated: burnout.updated,
    alertsCreated: alerts.alertsCreated,
    thresholdsTriggered: thresholds.triggered,
    insightsCreated: insights.insightsCreated,
    workflowStepsExecuted: workflows.stepsExecuted,
    workflowsCompleted: workflows.workflowsCompleted,
  };
}
