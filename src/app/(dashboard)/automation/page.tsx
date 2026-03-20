import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AutomationClient } from "./AutomationClient";

export default async function AutomationPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, "automation:view")) return <AccessDenied />;

  const canManage = can(session, "automation:manage");

  const workflows = await prisma.workflow.findMany({
    where: { churchId: session.churchId },
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      _count: { select: { executions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get execution stats per workflow
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

  // Recent executions for the activity feed
  const recentExecutions = await prisma.workflowExecution.findMany({
    where: { churchId: session.churchId },
    include: {
      workflow: { select: { name: true } },
      member: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  const data = {
    workflows: workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      trigger: w.trigger,
      status: w.status,
      stepsCount: w.steps.length,
      steps: w.steps.map((s) => ({
        id: s.id,
        sortOrder: s.sortOrder,
        type: s.type,
        config: s.config as Record<string, unknown>,
      })),
      totalExecutions: w._count.executions,
      executionStats: statsMap[w.id] ?? {},
      createdAt: w.createdAt.toISOString(),
    })),
    recentExecutions: recentExecutions.map((e) => ({
      id: e.id,
      workflowName: e.workflow.name,
      memberName: `${e.member.firstName} ${e.member.lastName}`,
      status: e.status,
      startedAt: e.startedAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
    })),
    canManage,
  };

  return <AutomationClient data={data} />;
}
