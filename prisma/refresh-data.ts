/**
 * Non-destructive refresh: replaces only ServiceSummary and Contribution data
 * with fresh, upward-trending numbers. Everything else stays untouched.
 *
 * Usage: npx tsx prisma/refresh-data.ts
 */
import "dotenv/config";
import { PrismaClient, ServiceType, ContributionMethod, ContributionSource } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ───────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sundayWeeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - (n - 1) * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Positive-only growth: every week is higher than the last
function growingCount(base: number, week: number, growthPerWeek: number): number {
  const growth = (12 - week) * growthPerWeek;
  const maxJitter = Math.max(0, Math.floor(growthPerWeek * 0.4));
  const jitter = maxJitter > 0 ? randomBetween(0, maxJitter) : 0;
  return Math.max(1, Math.round(base + growth + jitter));
}

async function main() {
  console.log("Refreshing attendance & giving data...\n");

  // Find the church
  const church = await prisma.church.findUnique({ where: { slug: "crossroads-church" } });
  if (!church) {
    console.error("Church 'crossroads-church' not found. Run the full seed first.");
    process.exit(1);
  }

  // Find campuses
  const campuses = await prisma.campus.findMany({ where: { churchId: church.id } });
  const downtown = campuses.find((c) => c.name === "Downtown")!;
  const westside = campuses.find((c) => c.name === "Westside")!;
  const north = campuses.find((c) => c.name === "North Campus")!;
  const online = campuses.find((c) => c.name === "Online")!;

  if (!downtown || !westside || !north || !online) {
    console.error("Missing campuses. Run the full seed first.");
    process.exit(1);
  }

  // Find members for giving data
  const members = await prisma.member.findMany({
    where: { churchId: church.id },
    select: { id: true, firstName: true, lastName: true, primaryCampusId: true },
  });
  const m = (first: string, last: string) => {
    const found = members.find((m) => m.firstName === first && m.lastName === last);
    if (!found) throw new Error(`Member not found: ${first} ${last}`);
    return found;
  };

  // ─── Delete old data ────────────────────────────────────
  const [deletedSummaries, deletedContributions] = await Promise.all([
    prisma.serviceSummary.deleteMany({ where: { churchId: church.id } }),
    prisma.contribution.deleteMany({ where: { churchId: church.id } }),
  ]);
  console.log(`Deleted ${deletedSummaries.count} service summaries`);
  console.log(`Deleted ${deletedContributions.count} contributions`);

  // ─── Service Summaries (12 weeks × 4 campuses) ─────────

  const serviceSummaries = [];
  for (let week = 1; week <= 12; week++) {
    const serviceDate = sundayWeeksAgo(week);

    // Downtown — base ~410 adults, growing ~7/week
    serviceSummaries.push({
      churchId: church.id,
      campusId: downtown.id,
      serviceDate,
      serviceTime: "10:00 AM",
      serviceType: ServiceType.WEEKEND,
      adultCount: growingCount(410, week, 7),
      childCount: growingCount(148, week, 4),
      onlineCount: 0,
      volunteerCount: growingCount(48, week, 1.5),
      firstTimeCount: growingCount(4, week, 0.5),
      totalCount: 0,
    });

    // Westside — base ~255 adults, growing ~6/week
    serviceSummaries.push({
      churchId: church.id,
      campusId: westside.id,
      serviceDate,
      serviceTime: "9:00 AM",
      serviceType: ServiceType.WEEKEND,
      adultCount: growingCount(255, week, 6),
      childCount: growingCount(88, week, 3),
      onlineCount: 0,
      volunteerCount: growingCount(32, week, 1.2),
      firstTimeCount: growingCount(3, week, 0.4),
      totalCount: 0,
    });

    // North — base ~115 adults, growing ~4/week
    serviceSummaries.push({
      churchId: church.id,
      campusId: north.id,
      serviceDate,
      serviceTime: "10:00 AM",
      serviceType: ServiceType.WEEKEND,
      adultCount: growingCount(115, week, 4),
      childCount: growingCount(36, week, 2),
      onlineCount: 0,
      volunteerCount: growingCount(16, week, 0.8),
      firstTimeCount: growingCount(2, week, 0.3),
      totalCount: 0,
    });

    // Online — base ~690, growing ~10/week
    serviceSummaries.push({
      churchId: church.id,
      campusId: online.id,
      serviceDate,
      serviceTime: "10:00 AM Live",
      serviceType: ServiceType.ONLINE,
      adultCount: 0,
      childCount: 0,
      onlineCount: growingCount(690, week, 10),
      volunteerCount: growingCount(10, week, 0.5),
      firstTimeCount: growingCount(6, week, 1),
      totalCount: 0,
    });
  }

  for (const s of serviceSummaries) {
    s.totalCount = s.adultCount + s.childCount + s.onlineCount;
  }

  await prisma.serviceSummary.createMany({ data: serviceSummaries });
  console.log(`\nCreated ${serviceSummaries.length} service summaries`);

  // Log this week vs last week for verification
  const thisWeek = serviceSummaries.filter((s) => sundayWeeksAgo(1).getTime() === s.serviceDate.getTime());
  const lastWeek = serviceSummaries.filter((s) => sundayWeeksAgo(2).getTime() === s.serviceDate.getTime());
  const thisTotal = thisWeek.reduce((sum, s) => sum + s.totalCount, 0);
  const lastTotal = lastWeek.reduce((sum, s) => sum + s.totalCount, 0);
  console.log(`  This week total: ${thisTotal} | Last week: ${lastTotal} | Delta: +${((thisTotal / lastTotal - 1) * 100).toFixed(1)}%`);

  // ─── Contributions ─────────────────────────────────────

  const contributionData: any[] = [];

  // Regular tithers — 3 months, growing each month
  const regularGivers = [
    m("David", "Thompson"), m("Lisa", "Thompson"), m("Sarah", "Kim"),
    m("Carlos", "Martinez"), m("Angela", "Williams"), m("Maria", "Martinez"),
    m("James", "Robinson"), m("Daniel", "Garcia"), m("Marcus", "Williams"),
  ];

  const giverBases = [425, 300, 350, 500, 275, 225, 280, 200, 325];
  for (let gi = 0; gi < regularGivers.length; gi++) {
    const giver = regularGivers[gi];
    const giverBase = giverBases[gi % giverBases.length];
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const growthMultiplier = 1 + (2 - monthOffset) * 0.06;
      for (let weekInMonth = 0; weekInMonth < 4; weekInMonth++) {
        const d = new Date();
        d.setMonth(d.getMonth() - monthOffset);
        d.setDate(7 + weekInMonth * 7);
        if (d > new Date()) continue;

        const jitter = 1 + (randomBetween(0, 5) / 100);
        contributionData.push({
          churchId: church.id,
          campusId: giver.primaryCampusId,
          memberId: giver.id,
          amount: Math.round(giverBase * jitter * growthMultiplier),
          fund: "General",
          method: ContributionMethod.ONLINE,
          source: ContributionSource.PUSHPAY,
          isRecurring: true,
          transactionDate: d,
        });
      }
    }
  }

  // One-time larger gifts
  const specialGifts = [
    { member: m("David", "Thompson"), amount: 5000, fund: "Building Fund", method: ContributionMethod.CHECK, source: ContributionSource.CASH_CHECK, date: daysAgo(15) },
    { member: m("Carlos", "Martinez"), amount: 2500, fund: "Missions", method: ContributionMethod.ACH, source: ContributionSource.VANCO, date: daysAgo(22) },
    { member: m("Angela", "Williams"), amount: 1000, fund: "Benevolence", method: ContributionMethod.CREDIT_CARD, source: ContributionSource.PUSHPAY, date: daysAgo(8) },
    { member: m("James", "Robinson"), amount: 750, fund: "Youth Ministry", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY, date: daysAgo(12) },
    { member: m("Daniel", "Garcia"), amount: 500, fund: "Missions", method: ContributionMethod.CASH, source: ContributionSource.CASH_CHECK, date: daysAgo(5) },
    { member: m("Rachel", "Davis"), amount: 200, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY, date: daysAgo(3) },
    { member: m("Chris", "Patterson"), amount: 50, fund: "General", method: ContributionMethod.CASH, source: ContributionSource.CASH_CHECK, date: daysAgo(7) },
    { member: m("Natalie", "Chen"), amount: 100, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.VANCO, date: daysAgo(14) },
    { member: m("Sarah", "Kim"), amount: 3000, fund: "Building Fund", method: ContributionMethod.ACH, source: ContributionSource.VANCO, date: daysAgo(30) },
    { member: m("Maria", "Martinez"), amount: 1500, fund: "Missions", method: ContributionMethod.CHECK, source: ContributionSource.CASH_CHECK, date: daysAgo(45) },
  ];

  for (const gift of specialGifts) {
    contributionData.push({
      churchId: church.id,
      campusId: gift.member.primaryCampusId,
      memberId: gift.member.id,
      amount: gift.amount,
      fund: gift.fund,
      method: gift.method,
      source: gift.source,
      isRecurring: false,
      transactionDate: gift.date,
    });
  }

  // Anonymous contributions
  const funds = ["General", "Missions", "Building Fund", "Benevolence", "Youth Ministry"];
  for (let i = 0; i < 5; i++) {
    contributionData.push({
      churchId: church.id,
      campusId: downtown.id,
      amount: randomBetween(25, 200),
      fund: funds[randomBetween(0, funds.length - 1)],
      method: ContributionMethod.CASH,
      source: ContributionSource.CASH_CHECK,
      isRecurring: false,
      isAnonymous: true,
      transactionDate: daysAgo(randomBetween(1, 60)),
    });
  }

  // This week — strongest week yet
  const thisWeekGivers = [
    { member: m("David", "Thompson"), amount: 475, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Lisa", "Thompson"), amount: 300, fund: "Missions", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Sarah", "Kim"), amount: 375, fund: "General", method: ContributionMethod.ACH, source: ContributionSource.VANCO },
    { member: m("Carlos", "Martinez"), amount: 550, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Angela", "Williams"), amount: 350, fund: "General", method: ContributionMethod.ACH, source: ContributionSource.VANCO },
    { member: m("James", "Robinson"), amount: 300, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Daniel", "Garcia"), amount: 225, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Maria", "Martinez"), amount: 250, fund: "Missions", method: ContributionMethod.CHECK, source: ContributionSource.CASH_CHECK },
    { member: m("Marcus", "Williams"), amount: 350, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Rachel", "Davis"), amount: 175, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Chris", "Patterson"), amount: 100, fund: "General", method: ContributionMethod.CASH, source: ContributionSource.CASH_CHECK },
    { member: m("Natalie", "Chen"), amount: 125, fund: "Youth Ministry", method: ContributionMethod.ONLINE, source: ContributionSource.VANCO },
    { member: m("Sophia", "Garcia"), amount: 200, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
    { member: m("Brandon", "Scott"), amount: 150, fund: "General", method: ContributionMethod.ONLINE, source: ContributionSource.PUSHPAY },
  ];

  for (const g of thisWeekGivers) {
    contributionData.push({
      churchId: church.id,
      campusId: g.member.primaryCampusId,
      memberId: g.member.id,
      amount: g.amount,
      fund: g.fund,
      method: g.method,
      source: g.source,
      isRecurring: true,
      transactionDate: daysAgo(0),
    });
  }

  await prisma.contribution.createMany({ data: contributionData });

  const thisWeekGiving = thisWeekGivers.reduce((sum, g) => sum + g.amount, 0);
  console.log(`\nCreated ${contributionData.length} contributions`);
  console.log(`  This week giving: $${thisWeekGiving.toLocaleString()}`);

  // ─── Refresh Visitor Dates ──────────────────────────────
  // Update visitor createdAt to this week so they show on the dashboard
  const visitors = await prisma.member.findMany({
    where: { churchId: church.id, membershipStatus: "VISITOR" },
    select: { id: true, firstName: true, lastName: true },
  });

  const visitorDates = [
    daysAgo(0), // today
    daysAgo(1), // yesterday
    daysAgo(0), // today
    daysAgo(2), // 2 days ago
    daysAgo(0), // today
  ];

  let updatedVisitors = 0;
  for (let i = 0; i < visitors.length; i++) {
    const date = visitorDates[i % visitorDates.length];
    await prisma.member.update({
      where: { id: visitors[i].id },
      data: { createdAt: date, lastActivityAt: date },
    });
    updatedVisitors++;
  }
  console.log(`\nUpdated ${updatedVisitors} visitors with fresh dates`);

  console.log("\nRefresh complete! Attendance, giving, and visitor data updated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
