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
    if (!can(session, "thresholds:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const threshold = await prisma.customThreshold.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!threshold) {
      return NextResponse.json({ error: "Threshold not found" }, { status: 404 });
    }

    const updated = await prisma.customThreshold.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.value !== undefined && { value: Number(body.value) }),
        ...(body.severity !== undefined && { severity: body.severity }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.operator !== undefined && { operator: body.operator }),
        ...(body.metric !== undefined && { metric: body.metric }),
        ...(body.scope !== undefined && { scope: body.scope }),
        ...(body.scopeId !== undefined && { scopeId: body.scopeId }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Threshold PATCH error:", err);
    return NextResponse.json({ error: "Failed to update threshold" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!can(session, "thresholds:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const threshold = await prisma.customThreshold.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!threshold) {
      return NextResponse.json({ error: "Threshold not found" }, { status: 404 });
    }

    await prisma.customThreshold.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Threshold DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete threshold" }, { status: 500 });
  }
}
