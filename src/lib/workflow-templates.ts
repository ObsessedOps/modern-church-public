// ─── Workflow Templates (shared between client & server) ──
// This file must NOT import server-only modules (prisma, etc.)

import type {
  WorkflowTrigger,
  WorkflowStepType,
  Prisma,
} from "@/generated/prisma/client";

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
