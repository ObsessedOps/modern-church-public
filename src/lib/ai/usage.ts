import { prisma } from "@/lib/prisma";

// ============================================================================
// AI Usage Logging — granular per-request token/cost tracking
// ============================================================================

// Cost per 1M tokens in cents
const COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 300, output: 1500 },
  "claude-sonnet-4-6": { input: 300, output: 1500 },
  "claude-haiku-4-5-20251001": { input: 80, output: 400 },
  "claude-opus-4-6": { input: 1500, output: 7500 },
};

interface UsageLogParams {
  churchId: string;
  userId?: string | null;
  provider: "anthropic" | "openai";
  model: string;
  requestType: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Calculate cost in cents for a given model and token counts.
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = COST_PER_MILLION[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // 4 decimal places
}

/**
 * Log an AI API call for usage tracking. Fire-and-forget — never throws.
 */
export function logAiUsage(params: UsageLogParams): void {
  const { churchId, userId, provider, model, requestType, inputTokens, outputTokens } = params;
  const totalTokens = inputTokens + outputTokens;
  const costCents = calculateCost(model, inputTokens, outputTokens);

  // Fire and forget — don't block the caller
  prisma.aiUsageLog
    .create({
      data: {
        churchId,
        userId: userId || null,
        provider,
        model,
        requestType,
        inputTokens,
        outputTokens,
        totalTokens,
        costCents,
      },
    })
    .then(() => {})
    .catch(() => {});
}

// ── Formatting helpers (used by dashboard) ──────────────

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 0.01) return `$${dollars.toFixed(4)}`;
  return `$${dollars.toFixed(2)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function getModelLabel(model: string): string {
  const labels: Record<string, string> = {
    "claude-sonnet-4-20250514": "Claude Sonnet 4",
    "claude-sonnet-4-6": "Claude Sonnet 4.6",
    "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
    "claude-opus-4-6": "Claude Opus 4.6",
  };
  return labels[model] || model;
}

export function getRequestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    grace_chat: "Grace AI Chat",
    grace_insight: "Grace Insight",
    engagement_analysis: "Engagement Analysis",
    attendance_forecast: "Attendance Forecast",
    giving_analysis: "Giving Analysis",
    volunteer_optimization: "Volunteer Optimization",
    group_health_report: "Group Health Report",
    visitor_followup: "Visitor Follow-up",
  };
  return labels[type] || type;
}

export { COST_PER_MILLION };
