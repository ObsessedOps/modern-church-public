import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { WORKFLOW_TEMPLATES } from "@/lib/workflows";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!can(session, "pathways:view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { churchId: session.churchId },
      include: {
        steps: { orderBy: { sortOrder: "asc" } },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also get execution stats
    const stats = await prisma.workflowExecution.groupBy({
      by: ["workflowId", "status"],
      where: { churchId: session.churchId },
      _count: true,
    });

    const statsMap: Record<string, Record<string, number>> = {};
    for (const s of stats) {
      if (!statsMap[s.workflowId]) statsMap[s.workflowId] = {};
      statsMap[s.workflowId][s.status] = s._count;
    }

    return NextResponse.json({
      workflows: workflows.map((w) => ({
        ...w,
        executionStats: statsMap[w.id] ?? {},
      })),
      templates: WORKFLOW_TEMPLATES,
    });
  } catch (err) {
    console.error("Workflows GET error:", err);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!can(session, "pathways:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, trigger, triggerConfig, status, steps, templateIndex } = body;

    // Create from template
    if (templateIndex != null) {
      const template = WORKFLOW_TEMPLATES[templateIndex];
      if (!template) {
        return NextResponse.json({ error: "Invalid template index" }, { status: 400 });
      }

      const workflow = await prisma.workflow.create({
        data: {
          churchId: session.churchId,
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          triggerConfig: template.triggerConfig ?? undefined,
          status: "ACTIVE",
          createdById: session.userId,
          steps: {
            create: template.steps.map((s) => ({
              sortOrder: s.sortOrder,
              type: s.type,
              config: s.config,
            })),
          },
        },
        include: { steps: { orderBy: { sortOrder: "asc" } } },
      });

      return NextResponse.json(workflow, { status: 201 });
    }

    // Create custom workflow
    if (!name || !trigger) {
      return NextResponse.json({ error: "Name and trigger are required" }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        churchId: session.churchId,
        name,
        description: description ?? null,
        trigger,
        triggerConfig: triggerConfig ?? undefined,
        status: status ?? "DRAFT",
        createdById: session.userId,
        steps: steps?.length
          ? {
              create: steps.map(
                (s: { type: string; config: Record<string, unknown>; sortOrder: number }) => ({
                  sortOrder: s.sortOrder,
                  type: s.type,
                  config: s.config,
                })
              ),
            }
          : undefined,
      },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (err) {
    console.error("Workflows POST error:", err);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
