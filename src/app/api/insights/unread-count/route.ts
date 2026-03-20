import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!can(session, "insights:view")) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.insightRecipient.count({
      where: {
        userId: session.userId,
        readAt: null,
        insight: {
          churchId: session.churchId,
          isResolved: false,
        },
      },
    });

    return NextResponse.json({ count });
  } catch (err) {
    console.error("Unread count error:", err);
    return NextResponse.json({ count: 0 });
  }
}
