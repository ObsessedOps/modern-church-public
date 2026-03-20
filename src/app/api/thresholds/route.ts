import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!can(session, "thresholds:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const thresholds = await prisma.customThreshold.findMany({
      where: { churchId: session.churchId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(thresholds);
  } catch (err) {
    console.error("Thresholds GET error:", err);
    return NextResponse.json({ error: "Failed to fetch thresholds" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!can(session, "thresholds:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, metric, operator, value, scope, scopeId, severity } = body;

    if (!name || !metric || !operator || value == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const threshold = await prisma.customThreshold.create({
      data: {
        churchId: session.churchId,
        createdById: session.userId,
        name,
        metric,
        operator,
        value: Number(value),
        scope: scope ?? "CHURCH_WIDE",
        scopeId: scopeId ?? null,
        severity: severity ?? "MEDIUM",
      },
    });

    return NextResponse.json(threshold, { status: 201 });
  } catch (err) {
    console.error("Thresholds POST error:", err);
    return NextResponse.json({ error: "Failed to create threshold" }, { status: 500 });
  }
}
