import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!can(session, "insights:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get insights where user is author OR recipient
    const insights = await prisma.insight.findMany({
      where: {
        churchId: session.churchId,
        OR: [
          { authorId: session.userId },
          { recipients: { some: { userId: session.userId } } },
        ],
      },
      include: {
        recipients: {
          where: { userId: session.userId },
          select: { readAt: true, reaction: true, replyText: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Resolve author names
    const authorIds = Array.from(new Set(insights.filter((i) => i.authorId).map((i) => i.authorId!)));
    const authors = authorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true, role: true },
        })
      : [];
    const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

    const result = insights.map((insight) => ({
      id: insight.id,
      type: insight.type,
      source: insight.source,
      priority: insight.priority,
      title: insight.title,
      body: insight.body,
      suggestion: insight.suggestion,
      alertEventId: insight.alertEventId,
      isResolved: insight.isResolved,
      createdAt: insight.createdAt,
      author: insight.authorId ? authorMap[insight.authorId] ?? null : null,
      readAt: insight.recipients[0]?.readAt ?? null,
      reaction: insight.recipients[0]?.reaction ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Insights GET error:", err);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!can(session, "insights:share")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, priority, title, bodyText, suggestion, recipientIds, alertEventId } = body;

    if (!type || !title || !bodyText || !recipientIds?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const insight = await prisma.insight.create({
      data: {
        churchId: session.churchId,
        authorId: session.userId,
        type,
        source: "LEADER_SHARED",
        priority: priority ?? "FYI",
        title,
        body: bodyText,
        suggestion: suggestion ?? null,
        alertEventId: alertEventId ?? null,
        recipients: {
          create: recipientIds.map((userId: string) => ({ userId })),
        },
      },
    });

    return NextResponse.json(insight, { status: 201 });
  } catch (err) {
    console.error("Insights POST error:", err);
    return NextResponse.json({ error: "Failed to share insight" }, { status: 500 });
  }
}
