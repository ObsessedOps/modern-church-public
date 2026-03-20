import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!can(session, "automation:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, name, description } = body;

    const workflow = await prisma.workflow.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Workflow PATCH error:", err);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!can(session, "automation:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    await prisma.workflow.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Workflow DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}
