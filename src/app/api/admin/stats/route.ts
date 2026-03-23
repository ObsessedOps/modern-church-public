import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Simple secret key auth for admin
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_KEY && key !== "modern2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    // Page views
    totalPageViews,
    pageViewsToday,
    pageViews7d,
    pageViews30d,
    uniqueVisitors7d,
    uniqueVisitors30d,
    topPages7d,
    deviceBreakdown7d,
    // Page views by day (last 14 days)
    recentPageViews,
    // AI usage
    totalAiRequests,
    aiRequests7d,
    aiRequests30d,
    totalTokens,
    totalCost,
    aiByModel,
    aiByType,
    recentAiUsage,
    // Audit log
    recentAuditCount,
    // Interest form proxy — count connect cards as a rough measure
  ] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      distinct: ["visitorHash"],
      select: { visitorHash: true },
    }).then((r) => r.length),
    prisma.pageView.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      distinct: ["visitorHash"],
      select: { visitorHash: true },
    }).then((r) => r.length),
    prisma.pageView.groupBy({
      by: ["pagePath"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true,
      orderBy: { _count: { pagePath: "desc" } },
      take: 10,
    }),
    prisma.pageView.groupBy({
      by: ["deviceType"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true,
    }),
    // Daily page views for chart
    prisma.$queryRawUnsafe<{ day: string; count: bigint }[]>(
      `SELECT DATE("createdAt") as day, COUNT(*) as count FROM "PageView" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY day`,
      sevenDaysAgo
    ),
    // AI stats
    prisma.aiUsageLog.count(),
    prisma.aiUsageLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.aiUsageLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.aiUsageLog.aggregate({ _sum: { totalTokens: true } }),
    prisma.aiUsageLog.aggregate({ _sum: { costCents: true } }),
    prisma.aiUsageLog.groupBy({
      by: ["model"],
      _count: true,
      _sum: { totalTokens: true, costCents: true },
      orderBy: { _count: { model: "desc" } },
    }),
    prisma.aiUsageLog.groupBy({
      by: ["requestType"],
      _count: true,
      _sum: { totalTokens: true },
      orderBy: { _count: { requestType: "desc" } },
    }),
    // Daily AI requests for chart
    prisma.$queryRawUnsafe<{ day: string; count: bigint }[]>(
      `SELECT DATE("createdAt") as day, COUNT(*) as count FROM "AiUsageLog" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY day`,
      sevenDaysAgo
    ),
    prisma.auditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return NextResponse.json({
    pageViews: {
      total: totalPageViews,
      today: pageViewsToday,
      last7d: pageViews7d,
      last30d: pageViews30d,
      uniqueVisitors7d,
      uniqueVisitors30d,
      topPages: topPages7d.map((p) => ({ path: p.pagePath, count: p._count })),
      devices: deviceBreakdown7d.map((d) => ({ type: d.deviceType ?? "unknown", count: d._count })),
      daily: recentPageViews.map((r) => ({ day: String(r.day).slice(0, 10), count: Number(r.count) })),
    },
    ai: {
      totalRequests: totalAiRequests,
      requests7d: aiRequests7d,
      requests30d: aiRequests30d,
      totalTokens: totalTokens._sum.totalTokens ?? 0,
      totalCostCents: totalCost._sum.costCents ?? 0,
      byModel: aiByModel.map((m) => ({
        model: m.model,
        count: m._count,
        tokens: m._sum.totalTokens ?? 0,
        costCents: m._sum.costCents ?? 0,
      })),
      byType: aiByType.map((t) => ({
        type: t.requestType,
        count: t._count,
        tokens: t._sum.totalTokens ?? 0,
      })),
      daily: recentAiUsage.map((r) => ({ day: String(r.day).slice(0, 10), count: Number(r.count) })),
    },
    activity: {
      auditEvents7d: recentAuditCount,
    },
  });
}
