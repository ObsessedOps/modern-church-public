import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!can(session, "insights:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reaction, replyText } = body;

    const insight = await prisma.insight.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    if (action === "read") {
      await prisma.insightRecipient.updateMany({
        where: { insightId: id, userId: session.userId },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "react") {
      await prisma.insightRecipient.updateMany({
        where: { insightId: id, userId: session.userId },
        data: { reaction, readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "reply") {
      await prisma.insightRecipient.updateMany({
        where: { insightId: id, userId: session.userId },
        data: { replyText, repliedAt: new Date(), readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "resolve") {
      // Only author can resolve
      if (insight.authorId !== session.userId) {
        return NextResponse.json({ error: "Only the author can resolve" }, { status: 403 });
      }
      await prisma.insight.update({
        where: { id },
        data: { isResolved: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Insight PATCH error:", err);
    return NextResponse.json({ error: "Failed to update insight" }, { status: 500 });
  }
}
