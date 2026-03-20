// ─── Care Workflow Engine ────────────────────────────────
// Handles trigger matching, step execution, and workflow advancement.

import { prisma } from "@/lib/prisma";
import type {
  WorkflowTrigger,
  WorkflowStepType,
  AlertEventType,
  Prisma,
} from "@/generated/prisma/client";

// ─── Trigger Matching ───────────────────────────────────

/** Map alert types to their corresponding workflow triggers */
const ALERT_TO_TRIGGER: Record<string, WorkflowTrigger> = {
  ATTENDANCE_DROP: "ALERT_ATTENDANCE_DROP",
  GIVING_DECLINE: "ALERT_GIVING_DECLINE",
  VOLUNTEER_BURNOUT: "ALERT_VOLUNTEER_BURNOUT",
  VISITOR_FOLLOWUP_MISSED: "ALERT_VISITOR_FOLLOWUP_MISSED",
  GROUP_HEALTH_WARNING: "ALERT_GROUP_HEALTH_WARNING",
  BACKGROUND_CHECK_EXPIRING: "ALERT_BACKGROUND_CHECK_EXPIRING",
  PASTORAL_CARE_OVERDUE: "ALERT_PASTORAL_CARE_OVERDUE",
  THRESHOLD_BREACH: "ALERT_THRESHOLD_BREACH",
};

/**
 * Find active workflows that match a given alert event,
 * then enroll each impacted member in a new execution.
 */
export async function triggerWorkflowsForAlert(
  churchId: string,
  alertEventId: string,
  alertType: AlertEventType,
  severity: string
) {
  const trigger = ALERT_TO_TRIGGER[alertType];
  if (!trigger) return { executionsCreated: 0 };

  // Find active workflows matching this trigger
  const workflows = await prisma.workflow.findMany({
    where: { churchId, trigger, status: "ACTIVE" },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });

  if (workflows.length === 0) return { executionsCreated: 0 };

  // Get impacted members for this alert
  const impacts = await prisma.alertMemberImpact.findMany({
    where: { alertEventId },
    select: { memberId: true },
  });

  let executionsCreated = 0;

  for (const workflow of workflows) {
    // Check trigger config filters (e.g. severity)
    const config = workflow.triggerConfig as Record<string, string> | null;
    if (config?.severity && config.severity !== severity) continue;

    for (const { memberId } of impacts) {
      // Don't enroll if already running this workflow
      const existing = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id, memberId, status: "RUNNING" },
      });
      if (existing) continue;

      // Create execution with step records
      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          churchId,
          memberId,
          alertEventId,
          status: "RUNNING",
          stepExecutions: {
            create: workflow.steps.map((step, i) => ({
              stepId: step.id,
              status: i === 0 ? "PENDING" : "PENDING",
              scheduledFor:
                i === 0
                  ? new Date()
                  : undefined, // first step runs immediately
            })),
          },
        },
      });
      executionsCreated++;
    }
  }

  return { executionsCreated };
}

// ─── Step Execution ─────────────────────────────────────

/** Execute a single workflow step (simulated for demo) */
async function executeStep(
  stepType: WorkflowStepType,
  config: Record<string, unknown>,
  memberId: string,
  churchId: string
): Promise<{ success: boolean; result: Record<string, unknown> }> {
  // Get member context for personalization
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { firstName: true, lastName: true, email: true, phone: true },
  });

  if (!member) return { success: false, result: { error: "Member not found" } };

  switch (stepType) {
    case "SEND_EMAIL":
      // In production: call Mailchimp/SMTP API
      return {
        success: true,
        result: {
          channel: "email",
          to: member.email ?? "no-email",
          subject: config.subject as string,
          status: "delivered",
          simulatedAt: new Date().toISOString(),
        },
      };

    case "SEND_SMS":
      // In production: call Text In Church API
      return {
        success: true,
        result: {
          channel: "sms",
          to: member.phone ?? "no-phone",
          message: (config.body as string)?.substring(0, 160),
          status: "delivered",
          simulatedAt: new Date().toISOString(),
        },
      };

    case "CREATE_TASK":
      // Create an audit log entry as a task placeholder
      await prisma.auditLog.create({
        data: {
          churchId,
          action: "workflow_task",
          resource: `member:${memberId}`,
          details: {
            task: config.task as string,
            assignTo: config.assignTo as string,
            memberName: `${member.firstName} ${member.lastName}`,
          },
        },
      });
      return {
        success: true,
        result: {
          task: config.task,
          assigned: config.assignTo,
          createdAt: new Date().toISOString(),
        },
      };

    case "WAIT_DAYS":
      // This step just sets a future scheduledFor date
      return {
        success: true,
        result: { waitDays: config.days, status: "waiting" },
      };

    case "UPDATE_TAG":
      await prisma.member.update({
        where: { id: memberId },
        data: {
          tags: {
            push: config.tagName as string,
          },
        },
      });
      return {
        success: true,
        result: { tagAdded: config.tagName },
      };

    case "NOTIFY_STAFF":
      // Create an insight as a staff notification
      await prisma.insight.create({
        data: {
          churchId,
          type: "MEMBER_CARE",
          source: "AI_GENERATED",
          priority: "IMPORTANT",
          title: config.title as string ?? "Workflow Notification",
          body: config.body as string ?? `Care workflow step for ${member.firstName} ${member.lastName}`,
          suggestion: config.suggestion as string,
        },
      });
      return {
        success: true,
        result: { notified: true, title: config.title },
      };

    case "ENROLL_GROWTH_TRACK":
      // Check if already enrolled
      const existing = await prisma.growthTrack.findUnique({
        where: { memberId_churchId: { memberId, churchId } },
      });
      if (!existing) {
        const campus = await prisma.member.findUnique({
          where: { id: memberId },
          select: { primaryCampusId: true },
        });
        await prisma.growthTrack.create({
          data: {
            churchId,
            memberId,
            campusId: campus?.primaryCampusId,
            currentStep: "CONNECT",
            status: "ACTIVE",
          },
        });
      }
      return {
        success: true,
        result: { enrolled: !existing, alreadyEnrolled: !!existing },
      };

    case "ADD_TO_GROUP":
      const groupId = config.groupId as string;
      if (groupId) {
        const membershipExists = await prisma.groupMembership.findFirst({
          where: { groupId, memberId, isActive: true },
        });
        if (!membershipExists) {
          await prisma.groupMembership.create({
            data: { groupId, memberId, role: "MEMBER", isActive: true },
          });
        }
      }
      return {
        success: true,
        result: { groupId, added: true },
      };

    default:
      return { success: false, result: { error: `Unknown step type: ${stepType}` } };
  }
}

// ─── Workflow Advancement ───────────────────────────────

/**
 * Process all running workflow executions for a church.
 * Called periodically (e.g. via intelligence refresh or cron).
 * Advances pending steps that are due.
 */
export async function advanceWorkflows(churchId: string) {
  const now = new Date();
  let stepsExecuted = 0;
  let workflowsCompleted = 0;

  // Find all running executions with their step executions
  const executions = await prisma.workflowExecution.findMany({
    where: { churchId, status: "RUNNING" },
    include: {
      stepExecutions: {
        include: { step: true },
        orderBy: { step: { sortOrder: "asc" } },
      },
    },
  });

  for (const execution of executions) {
    const steps = execution.stepExecutions;

    for (let i = 0; i < steps.length; i++) {
      const stepExec = steps[i];

      // Skip completed/failed steps
      if (stepExec.status === "COMPLETED" || stepExec.status === "FAILED" || stepExec.status === "SKIPPED") {
        continue;
      }

      // Check if previous step is done (except for first step)
      if (i > 0 && steps[i - 1].status !== "COMPLETED") {
        break; // Can't proceed until previous step completes
      }

      // Handle WAIT_DAYS steps
      if (stepExec.step.type === "WAIT_DAYS") {
        const config = stepExec.step.config as Record<string, unknown>;
        const waitDays = (config.days as number) ?? 1;

        if (stepExec.status === "PENDING") {
          // Set the scheduled time and move to WAITING
          const scheduledFor = new Date(
            (steps[i - 1]?.executedAt ?? now).getTime() + waitDays * 24 * 60 * 60 * 1000
          );
          await prisma.workflowStepExecution.update({
            where: { id: stepExec.id },
            data: { status: "WAITING", scheduledFor },
          });
          break; // Don't advance past a wait
        }

        if (stepExec.status === "WAITING") {
          if (stepExec.scheduledFor && stepExec.scheduledFor <= now) {
            await prisma.workflowStepExecution.update({
              where: { id: stepExec.id },
              data: { status: "COMPLETED", executedAt: now },
            });
            stepsExecuted++;
            continue; // Move to next step
          }
          break; // Still waiting
        }
      }

      // Execute the step
      if (stepExec.status === "PENDING" && (!stepExec.scheduledFor || stepExec.scheduledFor <= now)) {
        const config = stepExec.step.config as Record<string, unknown>;
        const { success, result } = await executeStep(
          stepExec.step.type,
          config,
          execution.memberId,
          churchId
        );

        await prisma.workflowStepExecution.update({
          where: { id: stepExec.id },
          data: {
            status: success ? "COMPLETED" : "FAILED",
            executedAt: now,
            result: result as Prisma.InputJsonValue,
          },
        });
        stepsExecuted++;

        if (!success) {
          // Mark execution as failed
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { status: "FAILED", failedReason: JSON.stringify(result) },
          });
          break;
        }
      }
    }

    // Check if all steps are complete
    const updatedSteps = await prisma.workflowStepExecution.findMany({
      where: { executionId: execution.id },
    });
    const allDone = updatedSteps.every(
      (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
    );
    if (allDone && updatedSteps.length > 0) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: "COMPLETED", completedAt: now },
      });
      workflowsCompleted++;
    }
  }

  return { stepsExecuted, workflowsCompleted };
}

// ─── Workflow Templates ─────────────────────────────────

export interface WorkflowTemplate {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  triggerConfig?: Record<string, string>;
  steps: { type: WorkflowStepType; config: Prisma.InputJsonValue; sortOrder: number }[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: "Attendance Drop — Personal Check-In",
    description: "When a member misses 3+ weeks, send a caring text, wait 3 days, then email, then create a pastor follow-up task.",
    trigger: "ALERT_ATTENDANCE_DROP",
    steps: [
      {
        sortOrder: 1,
        type: "SEND_SMS",
        config: {
          body: "Hey {{firstName}}, we've missed you at Crossroads! Just checking in — is everything okay? We're here for you. 💜",
        },
      },
      { sortOrder: 2, type: "WAIT_DAYS", config: { days: 3 } },
      {
        sortOrder: 3,
        type: "SEND_EMAIL",
        config: {
          subject: "We miss you, {{firstName}}!",
          body: "Hi {{firstName}},\n\nWe noticed you haven't been at services recently and just wanted to reach out. Our community isn't the same without you.\n\nIf there's anything going on — a tough season, a schedule change, or anything else — we'd love to help however we can.\n\nYou're always welcome here.\n\nWith love,\nCrossroads Church",
        },
      },
      { sortOrder: 4, type: "WAIT_DAYS", config: { days: 4 } },
      {
        sortOrder: 5,
        type: "CREATE_TASK",
        config: {
          task: "Personal follow-up call — member has been absent 3+ weeks and hasn't responded to automated outreach",
          assignTo: "Campus Pastor",
        },
      },
      {
        sortOrder: 6,
        type: "UPDATE_TAG",
        config: { tagName: "care:follow-up-sent" },
      },
    ],
  },
  {
    name: "Visitor Welcome Journey",
    description: "When a first-time visitor is detected and follow-up is needed, send a welcome text immediately, email the next day, then invite to Growth Track after 5 days.",
    trigger: "ALERT_VISITOR_FOLLOWUP_MISSED",
    steps: [
      {
        sortOrder: 1,
        type: "SEND_SMS",
        config: {
          body: "Hi {{firstName}}! 👋 So glad you visited Crossroads! We'd love to help you feel at home. Reply to this text anytime — we're here!",
        },
      },
      { sortOrder: 2, type: "WAIT_DAYS", config: { days: 1 } },
      {
        sortOrder: 3,
        type: "SEND_EMAIL",
        config: {
          subject: "Welcome to Crossroads, {{firstName}}!",
          body: "Hi {{firstName}},\n\nThank you for visiting Crossroads Church! We hope you felt welcome.\n\nHere are a few ways to get connected:\n• Join a Small Group — meet people in your stage of life\n• Start Growth Track — a 3-step journey to discover your purpose\n• Serve on a Team — use your gifts to make a difference\n\nWe can't wait to see you again!\n\n— The Crossroads Team",
        },
      },
      { sortOrder: 4, type: "WAIT_DAYS", config: { days: 5 } },
      {
        sortOrder: 5,
        type: "ENROLL_GROWTH_TRACK",
        config: {},
      },
      {
        sortOrder: 6,
        type: "NOTIFY_STAFF",
        config: {
          title: "New visitor follow-up complete",
          body: "Automated welcome journey finished for {{firstName}} {{lastName}}. They've been enrolled in Growth Track.",
          suggestion: "Check in personally to see how their first few weeks have been.",
        },
      },
    ],
  },
  {
    name: "Volunteer Burnout Prevention",
    description: "When burnout risk is detected, notify the team leader and send a supportive message to the volunteer.",
    trigger: "ALERT_VOLUNTEER_BURNOUT",
    steps: [
      {
        sortOrder: 1,
        type: "NOTIFY_STAFF",
        config: {
          title: "Volunteer burnout risk detected",
          body: "{{firstName}} {{lastName}} is showing signs of burnout (serving on multiple teams with high hours). Consider lightening their load.",
          suggestion: "Have a conversation about sustainable serving and consider giving them a break.",
        },
      },
      { sortOrder: 2, type: "WAIT_DAYS", config: { days: 2 } },
      {
        sortOrder: 3,
        type: "SEND_EMAIL",
        config: {
          subject: "You're amazing, {{firstName}} — and we want to take care of you",
          body: "Hi {{firstName}},\n\nWe see how much you give to our church every week, and we are SO grateful for your heart to serve.\n\nWe also want to make sure you're thriving — not just surviving. It's okay to take a step back, rest, and recharge.\n\nWould you be open to a quick chat about how we can better support you?\n\nWith gratitude,\nCrossroads Church",
        },
      },
      {
        sortOrder: 4,
        type: "UPDATE_TAG",
        config: { tagName: "care:burnout-outreach" },
      },
    ],
  },
  {
    name: "Group Health Check",
    description: "When a small group's health score drops below threshold, alert the group leader and groups director.",
    trigger: "ALERT_GROUP_HEALTH_WARNING",
    steps: [
      {
        sortOrder: 1,
        type: "NOTIFY_STAFF",
        config: {
          title: "Small group needs attention",
          body: "A small group's health score has dropped below the healthy threshold. Review attendance trends, member engagement, and consider reaching out to the group leader.",
          suggestion: "Schedule a coaching conversation with the group leader to discuss group dynamics and support needs.",
        },
      },
      { sortOrder: 2, type: "WAIT_DAYS", config: { days: 3 } },
      {
        sortOrder: 3,
        type: "CREATE_TASK",
        config: {
          task: "Follow up on group health — check if leader needs coaching, resources, or a co-leader",
          assignTo: "Groups Director",
        },
      },
    ],
  },
  {
    name: "Inactive Member Re-Engagement",
    description: "For members inactive 60+ days, send a gentle check-in and offer to help reconnect.",
    trigger: "MEMBER_INACTIVE_60",
    steps: [
      {
        sortOrder: 1,
        type: "SEND_SMS",
        config: {
          body: "Hey {{firstName}}, it's been a while! We just want you to know — you matter to us and you're always welcome. Is there anything we can do? 💜",
        },
      },
      { sortOrder: 2, type: "WAIT_DAYS", config: { days: 5 } },
      {
        sortOrder: 3,
        type: "SEND_EMAIL",
        config: {
          subject: "You're missed, {{firstName}}",
          body: "Hi {{firstName}},\n\nIt's been a little while since we've seen you and we want you to know — you're not forgotten.\n\nLife gets busy, seasons change, and that's okay. Whenever you're ready, there's a seat with your name on it.\n\nIf you're going through something and need support, we're just a reply away.\n\nAlways in your corner,\nCrossroads Church",
        },
      },
      { sortOrder: 4, type: "WAIT_DAYS", config: { days: 7 } },
      {
        sortOrder: 5,
        type: "CREATE_TASK",
        config: {
          task: "Personal phone call — member has been inactive 60+ days with no response to automated outreach",
          assignTo: "Campus Pastor",
        },
      },
      {
        sortOrder: 6,
        type: "UPDATE_TAG",
        config: { tagName: "care:re-engagement" },
      },
    ],
  },
];
