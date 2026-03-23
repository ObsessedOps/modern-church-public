import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── In-memory rate limiting ────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((val, key) => {
    if (now > val.resetAt) rateLimitMap.delete(key);
  });
}, 5 * 60 * 1000);

// ─── In-memory context cache (30 min TTL) ───────────────
let contextCache: { data: string; expires: number } | null = null;
const CONTEXT_TTL_MS = 30 * 60 * 1000;

async function getCachedChurchContext(): Promise<string> {
  const now = Date.now();
  if (contextCache && now < contextCache.expires) {
    return contextCache.data;
  }
  const data = await buildChurchContext();
  contextCache = { data, expires: now + CONTEXT_TTL_MS };
  return data;
}

// ─── Request schema ─────────────────────────────────────
const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(2000),
    })
  ).max(20),
});

// ─── Build church context for system prompt ─────────────
async function buildChurchContext(): Promise<string> {
  const church = await prisma.church.findFirst({
    include: { campuses: true },
  });
  if (!church) return "No church data available.";

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    memberCount,
    activeMemberCount,
    visitorCount,
    visitors,
    recentServices,
    givingWeek,
    givingMTD,
    givingYTD,
    activeAlerts,
    recentLifeEvents,
    groups,
    volunteerTeams,
    growthTracks,
    engagementDist,
    atRiskMembers,
    disengagedMembers,
    activeWorkflows,
    recentExecutions,
  ] = await Promise.all([
    prisma.member.count({ where: { churchId: church.id } }),
    prisma.member.count({
      where: { churchId: church.id, membershipStatus: { in: ["MEMBER", "ATTENDEE"] } },
    }),
    prisma.member.count({
      where: { churchId: church.id, membershipStatus: "VISITOR", createdAt: { gte: startOfWeek } },
    }),
    // Visitor details
    prisma.member.findMany({
      where: { churchId: church.id, membershipStatus: "VISITOR", createdAt: { gte: startOfWeek } },
      select: { firstName: true, lastName: true, email: true, primaryCampus: { select: { name: true } }, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.serviceSummary.findMany({
      where: { churchId: church.id, serviceDate: { gte: fourWeeksAgo } },
      orderBy: { serviceDate: "desc" },
      include: { campus: { select: { name: true } } },
    }),
    prisma.contribution.aggregate({
      where: { churchId: church.id, transactionDate: { gte: startOfWeek } },
      _sum: { amount: true },
    }),
    prisma.contribution.aggregate({
      where: { churchId: church.id, transactionDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.contribution.aggregate({
      where: { churchId: church.id, transactionDate: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.alertEvent.findMany({
      where: { churchId: church.id, dismissed: false },
      orderBy: { detectedAt: "desc" },
      take: 10,
      include: {
        memberImpacts: {
          include: { member: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.lifeEvent.findMany({
      where: { churchId: church.id },
      orderBy: { date: "desc" },
      take: 10,
      include: { member: { select: { firstName: true, lastName: true } } },
    }),
    prisma.group.findMany({
      where: { churchId: church.id },
      include: { _count: { select: { memberships: true } } },
    }),
    prisma.volunteerTeam.findMany({
      where: { churchId: church.id },
      include: {
        positions: {
          include: { member: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.growthTrack.findMany({
      where: { churchId: church.id },
      include: { member: { select: { firstName: true, lastName: true } } },
    }),
    prisma.member.groupBy({
      by: ["engagementTier"],
      where: { churchId: church.id },
      _count: true,
    }),
    // At-risk members with details
    prisma.member.findMany({
      where: { churchId: church.id, engagementTier: "AT_RISK" },
      select: { firstName: true, lastName: true, engagementScore: true, lastActivityAt: true, primaryCampus: { select: { name: true } } },
      orderBy: { engagementScore: "asc" },
      take: 10,
    }),
    // Disengaged members
    prisma.member.findMany({
      where: { churchId: church.id, engagementTier: "DISENGAGED" },
      select: { firstName: true, lastName: true, engagementScore: true, lastActivityAt: true, primaryCampus: { select: { name: true } } },
      orderBy: { engagementScore: "asc" },
      take: 10,
    }),
    // Active care workflows/pathways
    prisma.workflow.findMany({
      where: { churchId: church.id, status: "ACTIVE" },
      select: { name: true, description: true, trigger: true, steps: { select: { type: true, sortOrder: true }, orderBy: { sortOrder: "asc" } } },
    }),
    // Recent pathway executions
    prisma.workflowExecution.findMany({
      where: { churchId: church.id, startedAt: { gte: fourWeeksAgo } },
      select: {
        status: true,
        startedAt: true,
        workflow: { select: { name: true } },
        member: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 15,
    }),
  ]);

  // ── Compute attendance trend ──────────────────────────
  const thisWeekServices = recentServices.filter((s) => new Date(s.serviceDate) >= oneWeekAgo);
  const lastWeekServices = recentServices.filter((s) => {
    const d = new Date(s.serviceDate);
    return d >= twoWeeksAgo && d < oneWeekAgo;
  });
  const thisWeekTotal = thisWeekServices.reduce((sum, s) => sum + s.totalCount, 0);
  const lastWeekTotal = lastWeekServices.reduce((sum, s) => sum + s.totalCount, 0);
  const attendanceDelta = lastWeekTotal > 0
    ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100).toFixed(1)
    : "N/A";

  // Per-campus this week breakdown
  const campusBreakdown = church.campuses.map((c) => {
    const campusServices = thisWeekServices.filter((s) => s.campus?.name === c.name);
    const total = campusServices.reduce((sum, s) => sum + s.totalCount, 0);
    const adults = campusServices.reduce((sum, s) => sum + s.adultCount, 0);
    const kids = campusServices.reduce((sum, s) => sum + s.childCount, 0);
    const online = campusServices.reduce((sum, s) => sum + s.onlineCount, 0);
    return `  ${c.name}: ${total} total (${adults} adults, ${kids} kids${online > 0 ? `, ${online} online` : ""})`;
  }).filter((line) => !line.includes(": 0 total"));

  const attendanceLines = recentServices.slice(0, 12).map((s) => {
    const date = new Date(s.serviceDate).toLocaleDateString();
    return `  ${date} (${s.campus?.name ?? "Unknown"}): ${s.totalCount} total (${s.adultCount} adults, ${s.childCount} children, ${s.onlineCount} online)`;
  });

  const alertLines = activeAlerts.map((a) => {
    const members = a.memberImpacts.map((m) => `${m.member.firstName} ${m.member.lastName}`).join(", ");
    return `  [${a.severity}] ${a.eventType}: ${a.headline}${a.summary ? ` — ${a.summary}` : ""}${members ? ` (Affected: ${members})` : ""}`;
  });

  const lifeEventLines = recentLifeEvents.map((e) => {
    return `  ${e.member.firstName} ${e.member.lastName}: ${e.type} (${new Date(e.date).toLocaleDateString()})${e.description ? ` — ${e.description}` : ""}`;
  });

  const groupLines = groups.map((g) => {
    return `  ${g.name} (${g.type}): ${g._count.memberships} members, health score: ${g.healthScore ?? "N/A"}, active: ${g.isActive}`;
  });

  const volunteerLines = volunteerTeams.map((t) => {
    const activePositions = t.positions.filter((p) => p.status === "ACTIVE");
    const highBurnout = t.positions.filter((p) => p.burnoutRisk === "HIGH");
    return `  ${t.name} (${t.ministryArea}): ${activePositions.length} active volunteers${highBurnout.length > 0 ? `, ${highBurnout.length} HIGH burnout risk` : ""}`;
  });

  const activeGT = growthTracks.filter((t) => t.status === "ACTIVE");
  const stalledGT = growthTracks.filter((t) => t.status === "STALLED");
  const completedGT = growthTracks.filter((t) => t.status === "COMPLETED");

  const engagementLines = engagementDist.map((e) => `  ${e.engagementTier}: ${e._count} members`);

  const campusNames = church.campuses.map((c) => `${c.name}${c.isMainCampus ? " (main)" : ""}`).join(", ");

  // Visitor detail lines
  const visitorLines = visitors.map((v) => {
    const daysAgo = Math.floor((now.getTime() - new Date(v.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const when = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;
    return `  ${v.firstName} ${v.lastName} — ${v.primaryCampus?.name ?? "Unknown campus"}, visited ${when}${v.email ? ` (${v.email})` : ""}`;
  });

  // At-risk member lines
  const atRiskLines = atRiskMembers.map((m) => {
    const daysSince = m.lastActivityAt ? Math.floor((now.getTime() - new Date(m.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
    return `  ${m.firstName} ${m.lastName} — score: ${m.engagementScore}, ${m.primaryCampus?.name ?? "Unknown"}${daysSince != null ? `, last active ${daysSince}d ago` : ""}`;
  });

  const disengagedLines = disengagedMembers.map((m) => {
    const daysSince = m.lastActivityAt ? Math.floor((now.getTime() - new Date(m.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
    return `  ${m.firstName} ${m.lastName} — score: ${m.engagementScore}, ${m.primaryCampus?.name ?? "Unknown"}${daysSince != null ? `, last active ${daysSince}d ago` : ""}`;
  });

  // Pathway/workflow lines
  const workflowLines = activeWorkflows.map((w) => {
    const stepTypes = w.steps.map((s) => s.type).join(" → ");
    return `  ${w.name} (trigger: ${w.trigger}): ${w.steps.length} steps [${stepTypes}]${w.description ? ` — ${w.description}` : ""}`;
  });

  const executionLines = recentExecutions.slice(0, 10).map((e) => {
    const daysAgo = Math.floor((now.getTime() - new Date(e.startedAt).getTime()) / (1000 * 60 * 60 * 24));
    const when = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo}d ago`;
    return `  ${e.workflow.name} → ${e.member.firstName} ${e.member.lastName} [${e.status}] (${when})`;
  });

  return `
CHURCH PROFILE:
  Name: ${church.name}
  Denomination: ${church.denomination ?? "N/A"}
  Campuses: ${campusNames}
  Timezone: ${church.timezone ?? "America/Chicago"}

MEMBERSHIP:
  Total members: ${memberCount}
  Active (Member/Attendee): ${activeMemberCount}
  New visitors this week: ${visitorCount}

ENGAGEMENT DISTRIBUTION:
${engagementLines.join("\n")}

ATTENDANCE TREND:
  This week total: ${thisWeekTotal} | Last week: ${lastWeekTotal} | Change: ${attendanceDelta}%
  Per-campus this week:
${campusBreakdown.length > 0 ? campusBreakdown.join("\n") : "  No services recorded this week"}

RECENT ATTENDANCE DETAIL (last 4 weeks):
${attendanceLines.join("\n")}

GIVING:
  This week: $${(givingWeek._sum.amount ?? 0).toLocaleString()}
  Month-to-date: $${(givingMTD._sum.amount ?? 0).toLocaleString()}
  Year-to-date: $${(givingYTD._sum.amount ?? 0).toLocaleString()}

NEW VISITORS THIS WEEK (${visitorCount}):
${visitorLines.length > 0 ? visitorLines.join("\n") : "  No new visitors this week"}

AT-RISK MEMBERS (${atRiskMembers.length}):
${atRiskLines.length > 0 ? atRiskLines.join("\n") : "  None currently at risk"}

DISENGAGED MEMBERS (${disengagedMembers.length}):
${disengagedLines.length > 0 ? disengagedLines.join("\n") : "  None currently disengaged"}

ACTIVE ALERTS (${activeAlerts.length}):
${alertLines.length > 0 ? alertLines.join("\n") : "  No active alerts"}

RECENT LIFE EVENTS:
${lifeEventLines.length > 0 ? lifeEventLines.join("\n") : "  None recorded recently"}

SMALL GROUPS (${groups.length} total):
${groupLines.join("\n")}

VOLUNTEER TEAMS:
${volunteerLines.join("\n")}

GROWTH TRACK (Discipleship Pipeline):
  Active: ${activeGT.length}, Stalled: ${stalledGT.length}, Completed: ${completedGT.length}
${stalledGT.length > 0 ? `  Stalled members needing attention: ${stalledGT.map((t) => `${t.member.firstName} ${t.member.lastName} (at ${t.currentStep})`).join(", ")}` : ""}

CARE PATHWAYS (${activeWorkflows.length} active):
${workflowLines.length > 0 ? workflowLines.join("\n") : "  No active pathways"}

RECENT PATHWAY ACTIVITY (last 4 weeks):
${executionLines.length > 0 ? executionLines.join("\n") : "  No recent executions"}
`.trim();
}

// ─── POST handler (streaming) ───────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a few minutes." },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Grace AI is not configured. Missing API key." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const churchContext = await getCachedChurchContext();

    const systemPrompt = `You are Grace AI, the intelligent church operations assistant for Modern.Church. You have deep knowledge of this church's data and can provide insights, analysis, and recommendations to church leaders.

CURRENT CHURCH DATA:
${churchContext}

YOUR CAPABILITIES — WHAT YOU POWER ON THE DASHBOARD:
You are the intelligence behind several dashboard features. When relevant, reference these naturally so pastors know what's available:
- **Grace AI Daily Briefing** — You generate the daily summary at the top of the dashboard with highlight cards for attendance trends, visitor pipeline, volunteer coverage, active alerts, and pathway status.
- **Trend Insights** — You surface AI-powered trend analysis cards (attendance streaks, visitor retention rates, group engagement momentum, growth projections) that appear below the briefing.
- **Proactive Nudges** — You generate contextual nudge cards that recommend specific pastoral actions (e.g., "3 families missed 2+ weeks — consider a check-in before they hit 3").
- **Care Pathways** — Automated multi-step workflows you help trigger and monitor. When someone misses 3 weeks, a pathway can automatically send a care email, schedule a follow-up, and escalate to a pastor. You know which pathways are active and who they've triggered for.
- **Engagement Scoring** — You compute engagement scores (0-100) for every member based on attendance, giving consistency, group participation, volunteering, and recency. You assign tiers: Champion, Engaged, Casual, At-Risk, Disengaged.
- **Alerts & Thresholds** — You detect and surface alerts like attendance drops, volunteer burnout, missed visitor follow-ups, and threshold breaches.

CONVERSATION STYLE:
- Talk like a trusted advisor sitting across the table from the pastor — warm, direct, conversational.
- Lead with the insight, not the data dump. Weave numbers naturally into sentences instead of listing raw stats.
- Use **bold** sparingly for the most important names, numbers, or action items.
- Keep paragraphs short (2-3 sentences max). Use line breaks between thoughts for readability.
- When something needs attention, say it plainly: "I'd want to check on the Johnson family this week" not "Action item: Contact Johnson family."
- If you mention a concern, pair it with a specific, practical next step.
- When referencing people who need attention, use their actual names from the data — pastors connect with names, not numbers.
- Do NOT use markdown headings (## or #). Do NOT use horizontal rules (---). Just write naturally with paragraphs and occasional bullet points.
- Numbered lists are fine for action steps, but keep them tight (1-3 items, one line each).
- If asked about something not in the data, say so honestly.
- This is a public demo — don't reference that fact unless asked.

IMPORTANT: Never suggest or proactively bring up giving amounts, donation data, top givers, or financial details. If asked directly about giving, you may answer, but keep follow-up suggestions focused on people, engagement, groups, volunteers, and pastoral care — never money.

At the very end of your response, on a new line, add exactly 3 contextual follow-up questions the pastor might want to ask next. Format them as:
[SUGGESTIONS]
- First follow-up question
- Second follow-up question
- Third follow-up question`;

    const anthropic = new Anthropic();

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: parsed.data.messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Grace AI stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Grace AI error:", err);
    return NextResponse.json(
      { error: "Grace AI encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
