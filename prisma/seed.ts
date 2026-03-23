import {
  PrismaClient,
  Plan,
  Role,
  MembershipStatus,
  EngagementTier,
  EventType,
  ServiceType,
  GroupType,
  GroupRole,
  FamilyRole,
  AlertEventType,
  AlertSeverity,
  IntegrationType,
  IntegrationStatus,
  CampusStatus,
  ContributionMethod,
  ContributionSource,
  BurnoutRisk,
  VolunteerPositionStatus,
  GrowthTrackStep,
  GrowthTrackStatus,
  ThresholdMetric,
  ThresholdOperator,
  ThresholdScope,
  InsightType,
  InsightPriority,
  InsightSource,
  WorkflowTrigger,
  WorkflowStepType,
  WorkflowStatus,
  WorkflowExecutionStatus,
  WorkflowStepExecutionStatus,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ───────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function weeksAgo(n: number): Date {
  return daysAgo(n * 7);
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
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

async function main() {
  console.log("Seeding Modern.Church database...");

  // ─── Cleanup ─────────────────────────────────────────────
  // Clean up data from both old and new slugs
  for (const slug of ["crossroads-church", "grace-community", "resurrection-church"]) {
  const existingChurch = await prisma.church.findUnique({ where: { slug } });
  if (existingChurch) {
    // Delete sessions for church users
    const churchUserIds = (
      await prisma.user.findMany({ where: { churchId: existingChurch.id }, select: { id: true } })
    ).map((u) => u.id);
    if (churchUserIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: churchUserIds } } });
    }

    // Delete all church data (children first)
    await Promise.all([
      prisma.pageView.deleteMany({ where: { churchId: existingChurch.id } }),
      prisma.aiUsageLog.deleteMany({ where: { churchId: existingChurch.id } }),
      prisma.auditLog.deleteMany({ where: { churchId: existingChurch.id } }),
      prisma.alertActionLog.deleteMany({ where: { churchId: existingChurch.id } }),
      prisma.alertMemberImpact.deleteMany({ where: { churchId: existingChurch.id } }),
      prisma.insightRecipient.deleteMany({ where: { insight: { churchId: existingChurch.id } } }),
      prisma.customThreshold.deleteMany({ where: { churchId: existingChurch.id } }),
    ]);
    await prisma.insight.deleteMany({ where: { churchId: existingChurch.id } });

    await prisma.alertEvent.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.volunteerPosition.deleteMany({ where: { team: { churchId: existingChurch.id } } });
    await prisma.volunteerTeam.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.groupMembership.deleteMany({ where: { group: { churchId: existingChurch.id } } });
    await prisma.group.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.contribution.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.attendanceRecord.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.serviceSummary.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.lifeEvent.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.familyMember.deleteMany({ where: { familyUnit: { churchId: existingChurch.id } } });
    await prisma.growthTrack.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.member.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.familyUnit.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.integration.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.user.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.campus.deleteMany({ where: { churchId: existingChurch.id } });
    await prisma.church.deleteMany({ where: { id: existingChurch.id } });
    console.log(`Cleaned existing seed data for slug: ${slug}`);
  }
  } // end cleanup loop

  // Clean up any orphaned users by username (from prior seeds with different church slugs)
  const seedUsernames = ["admin", "sarah", "marcus", "reader", "jordan", "patrice", "derek"];
  for (const username of seedUsernames) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      await prisma.insightRecipient.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }
  }

  // ─── Church ──────────────────────────────────────────────
  const church = await prisma.church.create({
    data: {
      name: "Crossroads Church",
      slug: "crossroads-church",
      plan: Plan.ORGANIZATION,
      denomination: "Non-Denominational",
      timezone: "America/Chicago",
    },
  });
  console.log(`Church: ${church.name}`);

  // ─── Campuses ────────────────────────────────────────────
  const [downtown, westside, north, online] = await Promise.all([
    prisma.campus.create({
      data: {
        churchId: church.id,
        name: "Downtown",
        address: "123 Main St",
        city: "Austin",
        state: "TX",
        zip: "78701",
        phone: "(512) 555-0100",
        isMainCampus: true,
        serviceTimes: ["8:30 AM", "10:00 AM", "11:30 AM"],
        status: CampusStatus.ACTIVE,
        createdAt: new Date("2008-03-15"),
      },
    }),
    prisma.campus.create({
      data: {
        churchId: church.id,
        name: "Westside",
        address: "456 West Ave",
        city: "Austin",
        state: "TX",
        zip: "78745",
        phone: "(512) 555-0200",
        isMainCampus: false,
        serviceTimes: ["9:00 AM", "11:00 AM"],
        status: CampusStatus.ACTIVE,
        createdAt: new Date("2015-09-01"),
      },
    }),
    prisma.campus.create({
      data: {
        churchId: church.id,
        name: "North Campus",
        address: "789 North Blvd",
        city: "Austin",
        state: "TX",
        zip: "78758",
        phone: "(512) 555-0300",
        isMainCampus: false,
        serviceTimes: ["10:00 AM"],
        status: CampusStatus.ACTIVE,
        createdAt: new Date("2021-01-10"),
      },
    }),
    prisma.campus.create({
      data: {
        churchId: church.id,
        name: "Online",
        isMainCampus: false,
        serviceTimes: ["10:00 AM Live", "On Demand"],
        status: CampusStatus.ACTIVE,
        createdAt: new Date("2020-04-01"),
      },
    }),
  ]);
  console.log("Created 4 campuses");

  // ─── Users ───────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("modern2024!", 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        churchId: church.id,
        campusId: downtown.id,
        username: "admin",
        passwordHash,
        name: "Pastor Mike Thompson",
        role: Role.SENIOR_PASTOR,
        email: "mike@crossroads.church",
      },
    }),
    prisma.user.create({
      data: {
        churchId: church.id,
        campusId: westside.id,
        username: "sarah",
        passwordHash,
        name: "Sarah Mitchell",
        role: Role.CAMPUS_PASTOR,
        email: "sarah@crossroads.church",
      },
    }),
    prisma.user.create({
      data: {
        churchId: church.id,
        username: "marcus",
        passwordHash,
        name: "Marcus Johnson",
        role: Role.STAFF,
        email: "marcus@crossroads.church",
      },
    }),
    prisma.user.create({
      data: {
        churchId: church.id,
        username: "reader",
        passwordHash,
        name: "Read Only",
        role: Role.READ_ONLY,
        email: "reader@crossroads.church",
      },
    }),
    prisma.user.create({
      data: {
        churchId: church.id,
        campusId: downtown.id,
        username: "jordan",
        passwordHash,
        name: "Jordan Rivera",
        role: Role.YOUTH_PASTOR,
        email: "jordan@crossroads.church",
      },
    }),
    prisma.user.create({
      data: {
        churchId: church.id,
        username: "patrice",
        passwordHash,
        name: "Patrice Nguyen",
        role: Role.ACCOUNTING,
        email: "patrice@crossroads.church",
      },
    }),
    prisma.user.create({
      data: {
        churchId: church.id,
        campusId: downtown.id,
        username: "derek",
        passwordHash,
        name: "Derek Hayes",
        role: Role.WORSHIP_LEADER,
        email: "derek@crossroads.church",
      },
    }),
  ]);
  console.log(`Created ${users.length} users`);

  // ─── Family Units ────────────────────────────────────────
  const families = await Promise.all([
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Thompson Family" } }),
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Martinez Family" } }),
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Johnson Family" } }),
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Kim Family" } }),
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Williams Family" } }),
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Davis Family" } }),
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Garcia Family" } }),
    prisma.familyUnit.create({ data: { churchId: church.id, name: "Robinson Family" } }),
  ]);
  console.log(`Created ${families.length} family units`);

  // ─── Members ─────────────────────────────────────────────
  const memberData = [
    // CHAMPION (5) — score 85-95
    { firstName: "David", lastName: "Thompson", email: "david.t@email.com", phone: "(512) 555-1001", campus: downtown, family: families[0], familyRole: FamilyRole.HEAD, status: MembershipStatus.MEMBER, score: 93, tier: EngagementTier.CHAMPION, memberSince: new Date("2009-06-15"), tags: ["elder", "tither"], dob: new Date("1978-03-12") },
    { firstName: "Lisa", lastName: "Thompson", email: "lisa.t@email.com", phone: "(512) 555-1002", campus: downtown, family: families[0], familyRole: FamilyRole.SPOUSE, status: MembershipStatus.MEMBER, score: 91, tier: EngagementTier.CHAMPION, memberSince: new Date("2009-06-15"), tags: ["worship-team", "tither"], dob: new Date("1980-07-22") },
    { firstName: "Sarah", lastName: "Kim", email: "sarah.kim@email.com", phone: "(512) 555-1003", campus: downtown, family: families[3], familyRole: FamilyRole.HEAD, status: MembershipStatus.MEMBER, score: 89, tier: EngagementTier.CHAMPION, memberSince: new Date("2012-01-08"), tags: ["volunteer-leader", "small-group-leader"], dob: new Date("1985-11-30") },
    { firstName: "Carlos", lastName: "Martinez", email: "carlos.m@email.com", phone: "(512) 555-1004", campus: westside, family: families[1], familyRole: FamilyRole.HEAD, status: MembershipStatus.MEMBER, score: 87, tier: EngagementTier.CHAMPION, memberSince: new Date("2016-04-20"), tags: ["deacon", "tither"], dob: new Date("1975-09-05") },
    { firstName: "Angela", lastName: "Williams", email: "angela.w@email.com", phone: "(512) 555-1005", campus: downtown, family: families[4], familyRole: FamilyRole.HEAD, status: MembershipStatus.MEMBER, score: 85, tier: EngagementTier.CHAMPION, memberSince: new Date("2010-11-14"), tags: ["prayer-team", "mentor"], dob: new Date("1968-02-18") },

    // ENGAGED (7) — score 65-84
    { firstName: "Maria", lastName: "Martinez", email: "maria.m@email.com", phone: "(512) 555-1006", campus: westside, family: families[1], familyRole: FamilyRole.SPOUSE, status: MembershipStatus.MEMBER, score: 82, tier: EngagementTier.ENGAGED, memberSince: new Date("2016-04-20"), tags: ["women-ministry"], dob: new Date("1977-12-01") },
    { firstName: "James", lastName: "Robinson", email: "james.r@email.com", phone: "(512) 555-1007", campus: north, family: families[7], familyRole: FamilyRole.HEAD, status: MembershipStatus.MEMBER, score: 78, tier: EngagementTier.ENGAGED, memberSince: new Date("2021-09-12"), tags: ["tech-team"], dob: new Date("1990-06-14") },
    { firstName: "Rachel", lastName: "Davis", email: "rachel.d@email.com", phone: "(512) 555-1008", campus: downtown, family: families[5], familyRole: FamilyRole.HEAD, status: MembershipStatus.ATTENDEE, score: 75, tier: EngagementTier.ENGAGED, memberSince: null, tags: ["young-adult"], dob: new Date("1997-04-25") },
    { firstName: "Marcus", lastName: "Williams", email: "marcus.w@email.com", phone: "(512) 555-1009", campus: downtown, family: families[4], familyRole: FamilyRole.SPOUSE, status: MembershipStatus.MEMBER, score: 72, tier: EngagementTier.ENGAGED, memberSince: new Date("2011-03-06"), tags: ["usher"], dob: new Date("1970-08-10") },
    { firstName: "Daniel", lastName: "Garcia", email: "daniel.g@email.com", phone: "(512) 555-1010", campus: westside, family: families[6], familyRole: FamilyRole.HEAD, status: MembershipStatus.MEMBER, score: 70, tier: EngagementTier.ENGAGED, memberSince: new Date("2018-07-22"), tags: ["parking-team"], dob: new Date("1988-01-30") },
    { firstName: "Sophia", lastName: "Garcia", email: "sophia.g@email.com", phone: "(512) 555-1011", campus: westside, family: families[6], familyRole: FamilyRole.SPOUSE, status: MembershipStatus.MEMBER, score: 68, tier: EngagementTier.ENGAGED, memberSince: new Date("2018-07-22"), tags: ["kids-ministry"], dob: new Date("1991-05-17") },
    { firstName: "Tanya", lastName: "Robinson", email: "tanya.r@email.com", phone: "(512) 555-1012", campus: north, family: families[7], familyRole: FamilyRole.SPOUSE, status: MembershipStatus.ATTENDEE, score: 65, tier: EngagementTier.ENGAGED, memberSince: null, tags: [], dob: new Date("1993-10-08") },

    // CASUAL (6) — score 40-64
    { firstName: "Chris", lastName: "Patterson", email: "chris.p@email.com", phone: "(512) 555-1013", campus: downtown, family: null, familyRole: null, status: MembershipStatus.ATTENDEE, score: 62, tier: EngagementTier.CASUAL, memberSince: null, tags: ["young-adult"], dob: new Date("2000-03-15") },
    { firstName: "Natalie", lastName: "Chen", email: "natalie.c@email.com", phone: "(512) 555-1014", campus: westside, family: null, familyRole: null, status: MembershipStatus.MEMBER, score: 55, tier: EngagementTier.CASUAL, memberSince: new Date("2020-02-14"), tags: [], dob: new Date("1995-08-20") },
    { firstName: "Brandon", lastName: "Scott", email: "brandon.s@email.com", phone: "(512) 555-1015", campus: north, family: null, familyRole: null, status: MembershipStatus.ATTENDEE, score: 50, tier: EngagementTier.CASUAL, memberSince: null, tags: [], dob: new Date("1987-12-05") },
    { firstName: "Emily", lastName: "Foster", email: "emily.f@email.com", phone: "(512) 555-1016", campus: downtown, family: null, familyRole: null, status: MembershipStatus.ATTENDEE, score: 48, tier: EngagementTier.CASUAL, memberSince: null, tags: ["alpha-course"], dob: new Date("1999-06-28") },
    { firstName: "Tyler", lastName: "Kim", email: "tyler.k@email.com", phone: "(512) 555-1017", campus: downtown, family: families[3], familyRole: FamilyRole.CHILD, status: MembershipStatus.ATTENDEE, score: 44, tier: EngagementTier.CASUAL, memberSince: null, tags: ["youth"], dob: new Date("2007-09-12") },
    { firstName: "Jessica", lastName: "Davis", email: "jessica.d@email.com", phone: "(512) 555-1018", campus: downtown, family: families[5], familyRole: FamilyRole.CHILD, status: MembershipStatus.ATTENDEE, score: 40, tier: EngagementTier.CASUAL, memberSince: null, tags: ["youth"], dob: new Date("2008-04-03") },

    // AT_RISK (4) — score 20-39
    { firstName: "Robert", lastName: "Johnson", email: "robert.j@email.com", phone: "(512) 555-1019", campus: downtown, family: families[2], familyRole: FamilyRole.HEAD, status: MembershipStatus.MEMBER, score: 35, tier: EngagementTier.AT_RISK, memberSince: new Date("2014-08-10"), tags: [], dob: new Date("1972-11-22"), lastActivity: daysAgo(35) },
    { firstName: "Karen", lastName: "Johnson", email: "karen.j@email.com", phone: "(512) 555-1020", campus: downtown, family: families[2], familyRole: FamilyRole.SPOUSE, status: MembershipStatus.MEMBER, score: 30, tier: EngagementTier.AT_RISK, memberSince: new Date("2014-08-10"), tags: [], dob: new Date("1974-05-14"), lastActivity: daysAgo(35) },
    { firstName: "Michael", lastName: "Brooks", email: "michael.b@email.com", phone: "(512) 555-1021", campus: westside, family: null, familyRole: null, status: MembershipStatus.MEMBER, score: 25, tier: EngagementTier.AT_RISK, memberSince: new Date("2019-01-20"), tags: [], dob: new Date("1983-07-09"), lastActivity: daysAgo(42) },
    { firstName: "Ashley", lastName: "Turner", email: "ashley.t@email.com", phone: "(512) 555-1022", campus: north, family: null, familyRole: null, status: MembershipStatus.MEMBER, score: 22, tier: EngagementTier.AT_RISK, memberSince: new Date("2022-06-05"), tags: [], dob: new Date("1996-01-30"), lastActivity: daysAgo(50) },

    // DISENGAGED (3) — score 5-19
    { firstName: "Kevin", lastName: "Hart", email: "kevin.h@email.com", phone: "(512) 555-1023", campus: downtown, family: null, familyRole: null, status: MembershipStatus.INACTIVE, score: 15, tier: EngagementTier.DISENGAGED, memberSince: new Date("2017-03-12"), tags: [], dob: new Date("1980-10-15"), lastActivity: daysAgo(75) },
    { firstName: "Samantha", lastName: "Wells", email: "samantha.w@email.com", phone: "(512) 555-1024", campus: westside, family: null, familyRole: null, status: MembershipStatus.INACTIVE, score: 10, tier: EngagementTier.DISENGAGED, memberSince: new Date("2020-11-08"), tags: [], dob: new Date("1992-03-28"), lastActivity: daysAgo(90) },
    { firstName: "Brian", lastName: "Cooper", email: "brian.c@email.com", phone: "(512) 555-1025", campus: north, family: null, familyRole: null, status: MembershipStatus.INACTIVE, score: 5, tier: EngagementTier.DISENGAGED, memberSince: new Date("2022-01-15"), tags: [], dob: new Date("1989-06-20"), lastActivity: daysAgo(120) },

    // VISITORS (32) — first-time visitors this week, spread across campuses
    { firstName: "Jordan", lastName: "Mitchell", email: "jordan.m@email.com", phone: "(512) 555-1026", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 10, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1994-02-18"), lastActivity: daysAgo(0) },
    { firstName: "Priya", lastName: "Patel", email: "priya.p@email.com", phone: "(512) 555-1027", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 8, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1998-07-04"), lastActivity: daysAgo(1) },
    { firstName: "Ethan", lastName: "Brooks", email: "ethan.b@email.com", phone: "(512) 555-1028", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "young-adult"], dob: new Date("2001-11-22"), lastActivity: daysAgo(0) },
    { firstName: "Megan", lastName: "Lewis", email: "megan.l@email.com", phone: "(512) 555-1029", campus: north, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1989-03-30"), lastActivity: daysAgo(2) },
    { firstName: "Derek", lastName: "Washington", email: "derek.w@email.com", phone: "(512) 555-1030", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "invited-by-member"], dob: new Date("1996-09-15"), lastActivity: daysAgo(0) },
    { firstName: "Hannah", lastName: "Cole", email: "hannah.c@email.com", phone: "(512) 555-1031", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1992-08-14"), lastActivity: daysAgo(0) },
    { firstName: "Trevor", lastName: "Nguyen", email: "trevor.n@email.com", phone: "(512) 555-1032", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "young-adult"], dob: new Date("1999-05-22"), lastActivity: daysAgo(1) },
    { firstName: "Olivia", lastName: "Grant", email: "olivia.g@email.com", phone: "(512) 555-1033", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1987-11-03"), lastActivity: daysAgo(0) },
    { firstName: "Marcus", lastName: "Reed", email: "marcus.r@email.com", phone: "(512) 555-1034", campus: north, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1985-01-19"), lastActivity: daysAgo(2) },
    { firstName: "Alyssa", lastName: "Moreno", email: "alyssa.m@email.com", phone: "(512) 555-1035", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "invited-by-member"], dob: new Date("1996-03-28"), lastActivity: daysAgo(0) },
    { firstName: "Jacob", lastName: "Barnes", email: "jacob.b@email.com", phone: "(512) 555-1036", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("2000-07-15"), lastActivity: daysAgo(1) },
    { firstName: "Grace", lastName: "Hoffman", email: "grace.h@email.com", phone: "(512) 555-1037", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1993-12-09"), lastActivity: daysAgo(0) },
    { firstName: "Isaiah", lastName: "Crawford", email: "isaiah.c@email.com", phone: "(512) 555-1038", campus: north, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "young-adult"], dob: new Date("2002-04-20"), lastActivity: daysAgo(0) },
    { firstName: "Leah", lastName: "Sullivan", email: "leah.s@email.com", phone: "(512) 555-1039", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1990-06-11"), lastActivity: daysAgo(2) },
    { firstName: "Caleb", lastName: "Fernandez", email: "caleb.f@email.com", phone: "(512) 555-1040", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1988-09-25"), lastActivity: daysAgo(0) },
    { firstName: "Naomi", lastName: "Perry", email: "naomi.p@email.com", phone: "(512) 555-1041", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "invited-by-member"], dob: new Date("1997-01-30"), lastActivity: daysAgo(1) },
    { firstName: "Ryan", lastName: "Ortiz", email: "ryan.o@email.com", phone: "(512) 555-1042", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1984-10-08"), lastActivity: daysAgo(0) },
    { firstName: "Abigail", lastName: "Ruiz", email: "abigail.r@email.com", phone: "(512) 555-1043", campus: north, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1995-02-14"), lastActivity: daysAgo(0) },
    { firstName: "Noah", lastName: "Fleming", email: "noah.f@email.com", phone: "(512) 555-1044", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "young-adult"], dob: new Date("2003-08-17"), lastActivity: daysAgo(1) },
    { firstName: "Chloe", lastName: "Jensen", email: "chloe.j@email.com", phone: "(512) 555-1045", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1991-04-02"), lastActivity: daysAgo(0) },
    { firstName: "Elijah", lastName: "Harper", email: "elijah.h@email.com", phone: "(512) 555-1046", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1986-12-21"), lastActivity: daysAgo(2) },
    { firstName: "Lily", lastName: "Walsh", email: "lily.w@email.com", phone: "(512) 555-1047", campus: north, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "invited-by-member"], dob: new Date("1998-10-05"), lastActivity: daysAgo(0) },
    { firstName: "Luke", lastName: "Powers", email: "luke.p@email.com", phone: "(512) 555-1048", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1993-07-13"), lastActivity: daysAgo(0) },
    { firstName: "Zoe", lastName: "Reeves", email: "zoe.r@email.com", phone: "(512) 555-1049", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("2001-03-09"), lastActivity: daysAgo(1) },
    { firstName: "Nathan", lastName: "Cross", email: "nathan.c@email.com", phone: "(512) 555-1050", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "young-adult"], dob: new Date("2000-11-28"), lastActivity: daysAgo(0) },
    { firstName: "Maya", lastName: "Steele", email: "maya.s@email.com", phone: "(512) 555-1051", campus: north, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1989-05-16"), lastActivity: daysAgo(0) },
    { firstName: "Jaden", lastName: "Price", email: "jaden.p@email.com", phone: "(512) 555-1052", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1997-08-03"), lastActivity: daysAgo(2) },
    { firstName: "Savannah", lastName: "Blake", email: "savannah.b@email.com", phone: "(512) 555-1053", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "invited-by-member"], dob: new Date("1994-09-21"), lastActivity: daysAgo(0) },
    { firstName: "Aaron", lastName: "Hunt", email: "aaron.h@email.com", phone: "(512) 555-1054", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1986-04-07"), lastActivity: daysAgo(1) },
    { firstName: "Gabriella", lastName: "Fox", email: "gabriella.f@email.com", phone: "(512) 555-1055", campus: north, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1992-01-12"), lastActivity: daysAgo(0) },
    { firstName: "Tyler", lastName: "Mendez", email: "tyler.m@email.com", phone: "(512) 555-1056", campus: downtown, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time", "young-adult"], dob: new Date("2002-06-30"), lastActivity: daysAgo(0) },
    { firstName: "Autumn", lastName: "Bell", email: "autumn.b@email.com", phone: "(512) 555-1057", campus: westside, family: null, familyRole: null, status: MembershipStatus.VISITOR, score: 5, tier: EngagementTier.CASUAL, memberSince: null, tags: ["first-time"], dob: new Date("1990-10-18"), lastActivity: daysAgo(1) },
  ];

  const members = await Promise.all(
    memberData.map((m) =>
      prisma.member.create({
        data: {
          churchId: church.id,
          primaryCampusId: m.campus.id,
          familyUnitId: m.family?.id ?? undefined,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          dateOfBirth: m.dob,
          membershipStatus: m.status,
          memberSince: m.memberSince,
          engagementScore: m.score,
          engagementTier: m.tier,
          tags: m.tags,
          lastActivityAt: (m as any).lastActivity ?? daysAgo(randomBetween(1, 14)),
        },
      })
    )
  );
  console.log(`Created ${members.length} members`);

  // Map members by lastName for easy reference
  const memberMap = Object.fromEntries(members.map((m, i) => [memberData[i].firstName + "_" + memberData[i].lastName, m]));
  const m = (first: string, last: string) => memberMap[`${first}_${last}`];

  // ─── Family Members ──────────────────────────────────────
  const familyMemberData = memberData.filter((md) => md.family && md.familyRole);
  await Promise.all(
    familyMemberData.map((md) => {
      const member = m(md.firstName, md.lastName);
      return prisma.familyMember.create({
        data: {
          familyUnitId: md.family!.id,
          memberId: member.id,
          role: md.familyRole!,
        },
      });
    })
  );
  console.log("Created family member links");

  // ─── Service Summaries (12 weeks x 4 campuses = 48) ─────
  // Growth formula: oldest week (12) is lowest, newest week (1) is highest
  // Steady upward trend — every week is higher than the last, no dips
  function growingCount(base: number, week: number, growthPerWeek: number): number {
    // week=12 is oldest (lowest), week=1 is newest (highest)
    const growth = (12 - week) * growthPerWeek;
    // Positive-only jitter so we never dip below prior week
    const maxJitter = Math.max(0, Math.floor(growthPerWeek * 0.4));
    const jitter = maxJitter > 0 ? randomBetween(0, maxJitter) : 0;
    return Math.max(1, Math.round(base + growth + jitter));
  }

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

  // Compute totalCount
  for (const s of serviceSummaries) {
    s.totalCount = s.adultCount + s.childCount + s.onlineCount;
  }

  await prisma.serviceSummary.createMany({ data: serviceSummaries });
  console.log(`Created ${serviceSummaries.length} service summaries`);

  // ─── Contributions (60+) ─────────────────────────────────
  const funds = ["General", "Missions", "Building Fund", "Benevolence", "Youth Ministry"];
  const methods: ContributionMethod[] = [ContributionMethod.ONLINE, ContributionMethod.ACH, ContributionMethod.CHECK, ContributionMethod.CASH, ContributionMethod.CREDIT_CARD];
  const sources: ContributionSource[] = [ContributionSource.VANCO, ContributionSource.PUSHPAY, ContributionSource.CASH_CHECK];

  const contributionData: any[] = [];

  // Regular tithers — Champions and Engaged
  const regularGivers = [
    m("David", "Thompson"), m("Lisa", "Thompson"), m("Sarah", "Kim"),
    m("Carlos", "Martinez"), m("Angela", "Williams"), m("Maria", "Martinez"),
    m("James", "Robinson"), m("Daniel", "Garcia"), m("Marcus", "Williams"),
  ];

  // Assign each giver a stable base amount — boosted for healthy giving numbers
  const giverBases = [425, 300, 350, 500, 275, 225, 280, 200, 325];
  for (let gi = 0; gi < regularGivers.length; gi++) {
    const giver = regularGivers[gi];
    const giverBase = giverBases[gi % giverBases.length];
    // 3 months of regular giving — amounts grow each month (oldest month lowest)
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      // monthOffset 0 = this month (highest), 2 = oldest (lowest)
      const growthMultiplier = 1 + (2 - monthOffset) * 0.06; // +12% for this month vs 2 months ago
      for (let weekInMonth = 0; weekInMonth < 4; weekInMonth++) {
        const d = new Date();
        d.setMonth(d.getMonth() - monthOffset);
        d.setDate(7 + weekInMonth * 7);
        if (d > new Date()) continue;

        // Positive-leaning jitter (0-5%) so giving never dips week to week
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

  // Explicit this-week contributions — strongest week yet to show upward trend
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
      transactionDate: daysAgo(0), // today — ensures it falls within "this week"
    });
  }

  await prisma.contribution.createMany({ data: contributionData });
  console.log(`Created ${contributionData.length} contributions`);

  // ─── Groups (10) ─────────────────────────────────────────
  const groups = await Promise.all([
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Downtown Men's Group", type: GroupType.SMALL_GROUP, category: "Men", leaderId: m("David", "Thompson").id, meetingDay: "Tuesday", meetingTime: "7:00 PM", healthScore: 82, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Women of Faith", type: GroupType.SMALL_GROUP, category: "Women", leaderId: m("Angela", "Williams").id, meetingDay: "Wednesday", meetingTime: "6:30 PM", healthScore: 91, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Young Adults", type: GroupType.SMALL_GROUP, category: "Young Adults", leaderId: m("Rachel", "Davis").id, meetingDay: "Thursday", meetingTime: "7:00 PM", healthScore: 75, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: westside.id, name: "Marriage Builders", type: GroupType.SUPPORT, category: "Couples", leaderId: m("Carlos", "Martinez").id, meetingDay: "Friday", meetingTime: "6:30 PM", healthScore: 88, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Alpha Course", type: GroupType.CLASS, category: "Outreach", leaderId: m("Sarah", "Kim").id, meetingDay: "Monday", meetingTime: "7:00 PM", healthScore: 95, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Sunday School K-5", type: GroupType.SUNDAY_SCHOOL, category: "Children", leaderId: m("Sophia", "Garcia").id, meetingDay: "Sunday", meetingTime: "10:00 AM", healthScore: 70, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Youth Bible Study", type: GroupType.BIBLE_STUDY, category: "Youth", leaderId: m("James", "Robinson").id, meetingDay: "Wednesday", meetingTime: "6:00 PM", healthScore: 68, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Worship Team", type: GroupType.MINISTRY_TEAM, category: "Worship", leaderId: m("Lisa", "Thompson").id, meetingDay: "Saturday", meetingTime: "4:00 PM", healthScore: 85, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "Prayer Warriors", type: GroupType.INTEREST, category: "Prayer", leaderId: m("Angela", "Williams").id, meetingDay: "Saturday", meetingTime: "7:00 AM", healthScore: 90, isActive: true } }),
    prisma.group.create({ data: { churchId: church.id, campusId: downtown.id, name: "New Members Class", type: GroupType.CLASS, category: "Membership", leaderId: m("David", "Thompson").id, meetingDay: "Sunday", meetingTime: "12:30 PM", healthScore: 92, isActive: true } }),
  ]);
  console.log(`Created ${groups.length} groups`);

  // ─── Group Memberships (30+) ─────────────────────────────
  const gm = (groupIdx: number, first: string, last: string, role: GroupRole = GroupRole.MEMBER) => ({
    groupId: groups[groupIdx].id,
    memberId: m(first, last).id,
    role,
    isActive: true,
  });

  const groupMembershipData = [
    // Men's Group
    gm(0, "David", "Thompson", GroupRole.LEADER),
    gm(0, "Carlos", "Martinez"),
    gm(0, "Marcus", "Williams"),
    gm(0, "James", "Robinson"),
    gm(0, "Daniel", "Garcia"),
    // Women of Faith
    gm(1, "Angela", "Williams", GroupRole.LEADER),
    gm(1, "Lisa", "Thompson"),
    gm(1, "Maria", "Martinez"),
    gm(1, "Sophia", "Garcia"),
    gm(1, "Rachel", "Davis"),
    // Young Adults
    gm(2, "Rachel", "Davis", GroupRole.LEADER),
    gm(2, "Chris", "Patterson"),
    gm(2, "Emily", "Foster"),
    gm(2, "Natalie", "Chen"),
    // Marriage Builders
    gm(3, "Carlos", "Martinez", GroupRole.LEADER),
    gm(3, "Maria", "Martinez", GroupRole.CO_LEADER),
    gm(3, "David", "Thompson"),
    gm(3, "Lisa", "Thompson"),
    gm(3, "Daniel", "Garcia"),
    gm(3, "Sophia", "Garcia"),
    // Alpha Course
    gm(4, "Sarah", "Kim", GroupRole.LEADER),
    gm(4, "Emily", "Foster"),
    gm(4, "Chris", "Patterson"),
    gm(4, "Brandon", "Scott"),
    // Sunday School K-5
    gm(5, "Sophia", "Garcia", GroupRole.LEADER),
    gm(5, "Tyler", "Kim"),
    gm(5, "Jessica", "Davis"),
    // Youth Bible Study
    gm(6, "James", "Robinson", GroupRole.LEADER),
    gm(6, "Tyler", "Kim"),
    gm(6, "Jessica", "Davis"),
    // Worship Team
    gm(7, "Lisa", "Thompson", GroupRole.LEADER),
    gm(7, "Rachel", "Davis"),
    gm(7, "Natalie", "Chen"),
    // Prayer Warriors
    gm(8, "Angela", "Williams", GroupRole.LEADER),
    gm(8, "Sarah", "Kim"),
    gm(8, "David", "Thompson"),
    gm(8, "Maria", "Martinez"),
    // New Members Class
    gm(9, "David", "Thompson", GroupRole.LEADER),
    gm(9, "Tanya", "Robinson"),
    gm(9, "Brandon", "Scott"),
  ];

  await prisma.groupMembership.createMany({ data: groupMembershipData });
  console.log(`Created ${groupMembershipData.length} group memberships`);

  // ─── Volunteer Teams (6) ─────────────────────────────────
  const volunteerTeams = await Promise.all([
    prisma.volunteerTeam.create({ data: { churchId: church.id, campusId: downtown.id, name: "Worship", ministryArea: "Worship Arts", leaderId: m("Lisa", "Thompson").id, requiresBackgroundCheck: false } }),
    prisma.volunteerTeam.create({ data: { churchId: church.id, campusId: downtown.id, name: "Kids Ministry", ministryArea: "Children", leaderId: m("Sophia", "Garcia").id, requiresBackgroundCheck: true } }),
    prisma.volunteerTeam.create({ data: { churchId: church.id, campusId: downtown.id, name: "Greeting/Ushers", ministryArea: "Guest Services", leaderId: m("Marcus", "Williams").id, requiresBackgroundCheck: false } }),
    prisma.volunteerTeam.create({ data: { churchId: church.id, campusId: downtown.id, name: "Tech/AV", ministryArea: "Production", leaderId: m("James", "Robinson").id, requiresBackgroundCheck: false } }),
    prisma.volunteerTeam.create({ data: { churchId: church.id, campusId: downtown.id, name: "Parking", ministryArea: "Guest Services", leaderId: m("Daniel", "Garcia").id, requiresBackgroundCheck: false } }),
    prisma.volunteerTeam.create({ data: { churchId: church.id, campusId: downtown.id, name: "Prayer Team", ministryArea: "Prayer", leaderId: m("Angela", "Williams").id, requiresBackgroundCheck: false } }),
  ]);
  console.log(`Created ${volunteerTeams.length} volunteer teams`);

  // ─── Volunteer Positions (20) ────────────────────────────
  const vp = (teamIdx: number, first: string, last: string, role: string, status: VolunteerPositionStatus, burnout: BurnoutRisk, hours: number, bgCheck?: boolean) => ({
    teamId: volunteerTeams[teamIdx].id,
    memberId: m(first, last).id,
    role,
    status,
    burnoutRisk: burnout,
    hoursLogged: hours,
    backgroundCheckDate: bgCheck ? monthsAgo(6) : undefined,
    backgroundCheckExpiry: bgCheck ? monthsAgo(-18) : undefined,
  });

  const volunteerPositionData = [
    // Worship
    vp(0, "Lisa", "Thompson", "Worship Leader", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 240),
    vp(0, "Rachel", "Davis", "Vocalist", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 120),
    vp(0, "Natalie", "Chen", "Keyboard", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 90),
    // Kids Ministry
    vp(1, "Sophia", "Garcia", "Lead Teacher", VolunteerPositionStatus.ACTIVE, BurnoutRisk.MODERATE, 180, true),
    vp(1, "Maria", "Martinez", "Assistant Teacher", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 110, true),
    vp(1, "Emily", "Foster", "Check-In", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 60, true),
    // Greeting/Ushers
    vp(2, "Marcus", "Williams", "Head Usher", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 200),
    vp(2, "Carlos", "Martinez", "Greeter", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 150),
    vp(2, "Robert", "Johnson", "Usher", VolunteerPositionStatus.INACTIVE, BurnoutRisk.LOW, 80),
    // Tech/AV
    vp(3, "James", "Robinson", "Production Lead", VolunteerPositionStatus.ACTIVE, BurnoutRisk.MODERATE, 280),
    vp(3, "Chris", "Patterson", "Camera Operator", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 70),
    vp(3, "Brandon", "Scott", "Sound Tech", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 55),
    // Parking
    vp(4, "Daniel", "Garcia", "Parking Lead", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 160),
    vp(4, "Michael", "Brooks", "Parking Attendant", VolunteerPositionStatus.INACTIVE, BurnoutRisk.LOW, 40),
    // Prayer Team
    vp(5, "Angela", "Williams", "Prayer Team Lead", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 220),
    vp(5, "Sarah", "Kim", "Intercessor", VolunteerPositionStatus.ACTIVE, BurnoutRisk.HIGH, 310),
    vp(5, "David", "Thompson", "Intercessor", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 180),
    vp(5, "Maria", "Martinez", "Intercessor", VolunteerPositionStatus.ACTIVE, BurnoutRisk.LOW, 100),
    // Cross-team positions (Sarah Kim serving on 4 teams = burnout risk)
    vp(1, "Sarah", "Kim", "Volunteer Coordinator", VolunteerPositionStatus.ACTIVE, BurnoutRisk.HIGH, 200, true),
    vp(0, "Sarah", "Kim", "Vocalist", VolunteerPositionStatus.ACTIVE, BurnoutRisk.HIGH, 100),
  ];

  await prisma.volunteerPosition.createMany({ data: volunteerPositionData });
  console.log(`Created ${volunteerPositionData.length} volunteer positions`);

  // ─── Life Events (12) ────────────────────────────────────
  await Promise.all([
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Chris", "Patterson").id, campusId: downtown.id, type: EventType.BAPTISM, date: daysAgo(21), description: "Baptized during Sunday service — first step of faith", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Emily", "Foster").id, campusId: downtown.id, type: EventType.BAPTISM, date: daysAgo(42), description: "Baptized after completing Alpha Course", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Brandon", "Scott").id, campusId: north.id, type: EventType.BAPTISM, date: daysAgo(56), description: "Baptized at North Campus launch event", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Natalie", "Chen").id, campusId: westside.id, type: EventType.SALVATION, date: daysAgo(63), description: "Came to faith during Women of Faith retreat", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Rachel", "Davis").id, campusId: downtown.id, type: EventType.SALVATION, date: monthsAgo(8), description: "Salvation decision at youth conference", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Tanya", "Robinson").id, campusId: north.id, type: EventType.MEMBERSHIP, date: daysAgo(14), description: "Completed new members class", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("James", "Robinson").id, campusId: north.id, type: EventType.MEMBERSHIP, date: monthsAgo(4), description: "Officially joined as member", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Daniel", "Garcia").id, campusId: westside.id, type: EventType.MARRIAGE, date: monthsAgo(2), description: "Married Sophia at Westside campus", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Carlos", "Martinez").id, campusId: westside.id, type: EventType.BABY_DEDICATION, date: daysAgo(28), description: "Baby Lucia dedicated during Sunday service", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Angela", "Williams").id, campusId: downtown.id, type: EventType.DEATH, date: daysAgo(60), description: "Husband Gerald passed away — community support mobilized", isPublic: false } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Michael", "Brooks").id, campusId: westside.id, type: EventType.TRANSFER_IN, date: monthsAgo(18), description: "Transferred from previous church", isPublic: true } }),
    prisma.lifeEvent.create({ data: { churchId: church.id, memberId: m("Kevin", "Hart").id, campusId: downtown.id, type: EventType.RECOMMITMENT, date: monthsAgo(10), description: "Recommitment during revival week — has since disengaged again", isPublic: true } }),
  ]);
  console.log("Created 12 life events");

  // ─── Alert Events (5) ───────────────────────────────────
  const alerts = await Promise.all([
    prisma.alertEvent.create({
      data: {
        churchId: church.id,
        eventType: AlertEventType.ATTENDANCE_DROP,
        headline: "Johnson family attendance declined — no visits in 5 weeks",
        summary: "Robert and Karen Johnson have not attended any services in 5 weeks. Prior pattern was weekly attendance at Downtown 10:00 AM service. Last recorded attendance was 35 days ago.",
        severity: AlertSeverity.HIGH,
        dismissed: false,
        detectedAt: daysAgo(3),
      },
    }),
    prisma.alertEvent.create({
      data: {
        churchId: church.id,
        eventType: AlertEventType.GIVING_DECLINE,
        headline: "Martinez household giving dropped 60% this quarter",
        summary: "Carlos and Maria Martinez giving has decreased from an average of $800/month to $320/month over the past quarter. Previously consistent online recurring donors.",
        severity: AlertSeverity.MEDIUM,
        dismissed: false,
        detectedAt: daysAgo(5),
      },
    }),
    prisma.alertEvent.create({
      data: {
        churchId: church.id,
        eventType: AlertEventType.VOLUNTEER_BURNOUT,
        headline: "Sarah Kim serving 4 teams simultaneously — burnout risk HIGH",
        summary: "Sarah Kim is actively volunteering on Worship, Kids Ministry, Prayer Team, and Alpha Course. Total logged hours exceed 810 across teams. Multiple burnout risk flags triggered.",
        severity: AlertSeverity.CRITICAL,
        dismissed: false,
        detectedAt: daysAgo(1),
      },
    }),
    prisma.alertEvent.create({
      data: {
        churchId: church.id,
        eventType: AlertEventType.VISITOR_FOLLOWUP_MISSED,
        headline: "5 first-time guests from Sunday not yet contacted",
        summary: "Five first-time visitors from last Sunday's Downtown services have not been contacted. Average follow-up time is stretching to 4.2 days, above the 48-hour target.",
        severity: AlertSeverity.MEDIUM,
        dismissed: false,
        detectedAt: daysAgo(2),
      },
    }),
    prisma.alertEvent.create({
      data: {
        churchId: church.id,
        eventType: AlertEventType.GROUP_HEALTH_WARNING,
        headline: "Youth Bible Study attendance below 50% for 3 weeks",
        summary: "Youth Bible Study group has seen attendance drop below 50% capacity for 3 consecutive weeks. Current health score is 68, down from 82 six weeks ago.",
        severity: AlertSeverity.MEDIUM,
        dismissed: false,
        detectedAt: daysAgo(4),
      },
    }),
  ]);
  console.log(`Created ${alerts.length} alert events`);

  // ─── Alert Member Impacts ────────────────────────────────
  await Promise.all([
    // Attendance drop — Johnson family
    prisma.alertMemberImpact.create({ data: { alertEventId: alerts[0].id, memberId: m("Robert", "Johnson").id, churchId: church.id, impactDescription: "No attendance in 5 weeks — was regular weekly attender", urgencyScore: 85 } }),
    prisma.alertMemberImpact.create({ data: { alertEventId: alerts[0].id, memberId: m("Karen", "Johnson").id, churchId: church.id, impactDescription: "No attendance in 5 weeks — was regular weekly attender", urgencyScore: 85 } }),
    // Giving decline — Martinez
    prisma.alertMemberImpact.create({ data: { alertEventId: alerts[1].id, memberId: m("Carlos", "Martinez").id, churchId: church.id, impactDescription: "Giving decreased 60% quarter-over-quarter", urgencyScore: 65 } }),
    prisma.alertMemberImpact.create({ data: { alertEventId: alerts[1].id, memberId: m("Maria", "Martinez").id, churchId: church.id, impactDescription: "Household giving pattern change", urgencyScore: 55 } }),
    // Volunteer burnout — Sarah Kim
    prisma.alertMemberImpact.create({ data: { alertEventId: alerts[2].id, memberId: m("Sarah", "Kim").id, churchId: church.id, impactDescription: "Serving on 4 teams, 810+ hours logged, burnout risk critical", urgencyScore: 92 } }),
    // Group health — Youth Bible Study members
    prisma.alertMemberImpact.create({ data: { alertEventId: alerts[4].id, memberId: m("Tyler", "Kim").id, churchId: church.id, impactDescription: "Has not attended Youth Bible Study in 3 weeks", urgencyScore: 50 } }),
    prisma.alertMemberImpact.create({ data: { alertEventId: alerts[4].id, memberId: m("Jessica", "Davis").id, churchId: church.id, impactDescription: "Sporadic attendance, only 1 of last 4 meetings", urgencyScore: 45 } }),
  ]);
  console.log("Created alert member impacts");

  // ─── Integrations (8) ───────────────────────────────────
  await Promise.all([
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.CCB, status: IntegrationStatus.CONNECTED, lastSyncAt: daysAgo(0), recordCount: 14832 } }),
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.PLANNING_CENTER, status: IntegrationStatus.CONNECTED, lastSyncAt: daysAgo(0), recordCount: 2340 } }),
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.MAILCHIMP, status: IntegrationStatus.CONNECTED, lastSyncAt: daysAgo(1), recordCount: 9450 } }),
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.TEXT_IN_CHURCH, status: IntegrationStatus.CONNECTED, lastSyncAt: daysAgo(0), recordCount: 4120 } }),
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.MICROSOFT_365, status: IntegrationStatus.CONNECTED, lastSyncAt: daysAgo(0), recordCount: 34 } }),
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.SUBSPLASH, status: IntegrationStatus.CONNECTED, lastSyncAt: daysAgo(0), recordCount: 3200 } }),
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.QUICKBOOKS, status: IntegrationStatus.ERROR, lastSyncAt: daysAgo(3), recordCount: 1247, config: { error: "Authentication token expired" } } }),
    prisma.integration.create({ data: { churchId: church.id, type: IntegrationType.VANCO, status: IntegrationStatus.CONNECTED, lastSyncAt: daysAgo(0), recordCount: 892 } }),
  ]);
  console.log("Created 8 integrations");

  // ─── Growth Track (12) ─────────────────────────────────
  await Promise.all([
    // Completed the full track
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Sarah", "Kim").id, campusId: downtown.id, currentStep: GrowthTrackStep.COMPLETED, status: GrowthTrackStatus.COMPLETED, connectStartedAt: monthsAgo(6), connectCompletedAt: monthsAgo(5), discoverStartedAt: monthsAgo(5), discoverCompletedAt: monthsAgo(3), serveStartedAt: monthsAgo(3), serveCompletedAt: monthsAgo(1) } }),
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Carlos", "Martinez").id, campusId: westside.id, currentStep: GrowthTrackStep.COMPLETED, status: GrowthTrackStatus.COMPLETED, connectStartedAt: monthsAgo(8), connectCompletedAt: monthsAgo(7), discoverStartedAt: monthsAgo(7), discoverCompletedAt: monthsAgo(5), serveStartedAt: monthsAgo(5), serveCompletedAt: monthsAgo(2) } }),
    // Currently in SERVE step
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("James", "Robinson").id, campusId: north.id, currentStep: GrowthTrackStep.SERVE, status: GrowthTrackStatus.ACTIVE, connectStartedAt: monthsAgo(4), connectCompletedAt: monthsAgo(3), discoverStartedAt: monthsAgo(3), discoverCompletedAt: monthsAgo(1), serveStartedAt: monthsAgo(1) } }),
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Rachel", "Davis").id, campusId: downtown.id, currentStep: GrowthTrackStep.SERVE, status: GrowthTrackStatus.ACTIVE, connectStartedAt: monthsAgo(5), connectCompletedAt: monthsAgo(4), discoverStartedAt: monthsAgo(4), discoverCompletedAt: monthsAgo(2), serveStartedAt: monthsAgo(2) } }),
    // Currently in DISCOVER step
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Daniel", "Garcia").id, campusId: westside.id, currentStep: GrowthTrackStep.DISCOVER, status: GrowthTrackStatus.ACTIVE, connectStartedAt: monthsAgo(3), connectCompletedAt: monthsAgo(2), discoverStartedAt: monthsAgo(2) } }),
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Chris", "Patterson").id, campusId: downtown.id, currentStep: GrowthTrackStep.DISCOVER, status: GrowthTrackStatus.ACTIVE, connectStartedAt: monthsAgo(2), connectCompletedAt: monthsAgo(1), discoverStartedAt: monthsAgo(1) } }),
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Sophia", "Garcia").id, campusId: westside.id, currentStep: GrowthTrackStep.DISCOVER, status: GrowthTrackStatus.ACTIVE, connectStartedAt: monthsAgo(3), connectCompletedAt: monthsAgo(2), discoverStartedAt: monthsAgo(2) } }),
    // Currently in CONNECT step
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Emily", "Foster").id, campusId: downtown.id, currentStep: GrowthTrackStep.CONNECT, status: GrowthTrackStatus.ACTIVE, connectStartedAt: weeksAgo(3) } }),
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Brandon", "Scott").id, campusId: north.id, currentStep: GrowthTrackStep.CONNECT, status: GrowthTrackStatus.ACTIVE, connectStartedAt: weeksAgo(2) } }),
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Natalie", "Chen").id, campusId: westside.id, currentStep: GrowthTrackStep.CONNECT, status: GrowthTrackStatus.ACTIVE, connectStartedAt: weeksAgo(1) } }),
    // Stalled
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Marcus", "Williams").id, campusId: downtown.id, currentStep: GrowthTrackStep.DISCOVER, status: GrowthTrackStatus.STALLED, connectStartedAt: monthsAgo(5), connectCompletedAt: monthsAgo(4), discoverStartedAt: monthsAgo(4), notes: "Hasn't attended Discover class in 6 weeks" } }),
    // Dropped
    prisma.growthTrack.create({ data: { churchId: church.id, memberId: m("Tanya", "Robinson").id, campusId: north.id, currentStep: GrowthTrackStep.CONNECT, status: GrowthTrackStatus.DROPPED, connectStartedAt: monthsAgo(4), notes: "Moved out of area" } }),
  ]);
  console.log("Created 12 growth track entries");

  // ─── Custom Thresholds (4) ──────────────────────────────
  await Promise.all([
    prisma.customThreshold.create({
      data: {
        churchId: church.id,
        createdById: users[4].id, // Jordan Rivera (YOUTH_PASTOR)
        name: "Youth group attendance below 30",
        metric: ThresholdMetric.GROUP_ATTENDANCE,
        operator: ThresholdOperator.LESS_THAN,
        value: 30,
        scope: ThresholdScope.GROUP,
        scopeId: groups[6].id, // Youth Bible Study
        severity: AlertSeverity.HIGH,
      },
    }),
    prisma.customThreshold.create({
      data: {
        churchId: church.id,
        createdById: users[6].id, // Derek Hayes (WORSHIP_LEADER)
        name: "Worship team fill rate below 80%",
        metric: ThresholdMetric.VOLUNTEER_FILL_RATE,
        operator: ThresholdOperator.LESS_THAN,
        value: 80,
        scope: ThresholdScope.TEAM,
        scopeId: volunteerTeams[0].id, // Worship
        severity: AlertSeverity.HIGH,
      },
    }),
    prisma.customThreshold.create({
      data: {
        churchId: church.id,
        createdById: users[0].id, // Pastor Mike (SENIOR_PASTOR)
        name: "Weekend attendance below 800",
        metric: ThresholdMetric.ATTENDANCE_TOTAL,
        operator: ThresholdOperator.LESS_THAN,
        value: 800,
        scope: ThresholdScope.CHURCH_WIDE,
        severity: AlertSeverity.CRITICAL,
      },
    }),
    prisma.customThreshold.create({
      data: {
        churchId: church.id,
        createdById: users[1].id, // Sarah Mitchell (CAMPUS_PASTOR)
        name: "Westside visitors below 3 per week",
        metric: ThresholdMetric.VISITOR_COUNT,
        operator: ThresholdOperator.LESS_THAN,
        value: 3,
        scope: ThresholdScope.CAMPUS,
        scopeId: westside.id,
        severity: AlertSeverity.MEDIUM,
      },
    }),
  ]);
  console.log("Created 4 custom thresholds");

  // ─── Insights (AI-generated + Leader-shared) ──────────
  // AI-generated insights
  await prisma.insight.create({
    data: {
      churchId: church.id,
      type: InsightType.STAFFING_GAP,
      source: InsightSource.AI_GENERATED,
      priority: InsightPriority.URGENT,
      title: "Kids Ministry needs 2 volunteers for Sunday 10:30 AM",
      body: "Kids Ministry currently has 3 active volunteers but typically needs 5 for the 10:30 AM service. Two positions (Check-In helper and Classroom Assistant) are unfilled this week.",
      suggestion: "Emily Foster is available and already background-checked. Chris Patterson expressed interest in kids ministry during his Alpha Course. Both are good candidates.",
      createdAt: daysAgo(1),
      recipients: {
        create: [
          { userId: users[1].id }, // Sarah Mitchell (Campus Pastor)
        ],
      },
    },
  });

  await prisma.insight.create({
    data: {
      churchId: church.id,
      type: InsightType.PATTERN_DETECTED,
      source: InsightSource.AI_GENERATED,
      priority: InsightPriority.IMPORTANT,
      title: "Parking team has been understaffed 4 of last 6 weeks",
      body: "The Parking team only has 2 active members (Daniel Garcia and 1 inactive). This creates a recurring gap every week where the team operates at 50% capacity.",
      suggestion: "Consider a targeted volunteer recruitment ask during Sunday announcements, or merge parking duties with the Greeting/Ushers team temporarily.",
      createdAt: daysAgo(2),
      recipients: {
        create: [
          { userId: users[0].id, readAt: daysAgo(1), reaction: "on-it" }, // Pastor Mike
        ],
      },
    },
  });

  await prisma.insight.create({
    data: {
      churchId: church.id,
      type: InsightType.TREND_ALERT,
      source: InsightSource.AI_GENERATED,
      priority: InsightPriority.IMPORTANT,
      title: "Youth Bible Study attendance dropped 3 straight weeks",
      body: "Youth Bible Study group attendance has declined from 12 to 9 to 6 over the last three weeks. Tyler Kim and Jessica Davis haven't attended recently. The group health score dropped from 82 to 68.",
      suggestion: "Jordan Rivera should connect with Tyler and Jessica individually. Consider a youth group social event to re-engage students.",
      createdAt: daysAgo(3),
      recipients: {
        create: [
          { userId: users[4].id }, // Jordan Rivera (Youth Pastor)
        ],
      },
    },
  });

  await prisma.insight.create({
    data: {
      churchId: church.id,
      type: InsightType.CELEBRATION,
      source: InsightSource.AI_GENERATED,
      priority: InsightPriority.FYI,
      title: "3 baptisms this month across 2 campuses",
      body: "Chris Patterson (Downtown), Emily Foster (Downtown), and Brandon Scott (North Campus) were all baptized this month. Chris and Emily both came through the Alpha Course. This is the highest baptism month in the last quarter.",
      suggestion: "Consider a celebration moment in this Sunday's service. These stories could also encourage other members exploring faith.",
      createdAt: daysAgo(1),
      recipients: {
        create: [
          { userId: users[0].id, readAt: daysAgo(0), reaction: "thanks" }, // Pastor Mike
          { userId: users[1].id }, // Sarah Mitchell
          { userId: users[4].id, readAt: daysAgo(0) }, // Jordan Rivera
          { userId: users[6].id }, // Derek Hayes
        ],
      },
    },
  });

  await prisma.insight.create({
    data: {
      churchId: church.id,
      type: InsightType.MEMBER_CARE,
      source: InsightSource.AI_GENERATED,
      priority: InsightPriority.URGENT,
      title: "Garcia family may need pastoral attention",
      body: "Daniel Garcia's attendance dropped from weekly to bi-weekly over the past month, and Maria hasn't been to a service in 3 weeks. Their giving pattern also shifted. This may indicate a family situation that warrants a pastoral check-in.",
      suggestion: "A pastoral care visit from Sarah Mitchell (their campus pastor) would be appropriate. Consider reaching out before Sunday.",
      createdAt: daysAgo(0),
      recipients: {
        create: [
          { userId: users[0].id }, // Pastor Mike
          { userId: users[1].id }, // Sarah Mitchell
        ],
      },
    },
  });

  await prisma.insight.create({
    data: {
      churchId: church.id,
      type: InsightType.RECOMMENDATION,
      source: InsightSource.AI_GENERATED,
      priority: InsightPriority.IMPORTANT,
      title: "5 first-time visitors from Sunday need follow-up",
      body: "Jordan Mitchell, Priya Patel, Ethan Brooks, Megan Lewis, and Derek Washington visited for the first time last Sunday. None have been contacted yet — current follow-up time is averaging 4.2 days, above the 48-hour target.",
      suggestion: "Assign follow-up: Sarah Mitchell (Westside) can contact Priya Patel. Marcus Johnson can handle the Downtown visitors. Megan Lewis at North Campus needs a local contact.",
      createdAt: daysAgo(1),
      recipients: {
        create: [
          { userId: users[0].id }, // Pastor Mike
          { userId: users[1].id, readAt: daysAgo(0), reaction: "on-it" }, // Sarah Mitchell
          { userId: users[2].id }, // Marcus Johnson
        ],
      },
    },
  });

  // Leader-shared insights
  await prisma.insight.create({
    data: {
      churchId: church.id,
      authorId: users[4].id, // Jordan Rivera
      type: InsightType.TREND_ALERT,
      source: InsightSource.LEADER_SHARED,
      priority: InsightPriority.IMPORTANT,
      title: "Youth attendance trending down — losing post-graduation seniors",
      body: "We went from 45 to 38 to 31 over the last three Sundays. I think we're losing some of the high school seniors post-graduation. Might be worth a targeted connect event. Wanted to flag this for the groups team too.",
      createdAt: daysAgo(2),
      recipients: {
        create: [
          { userId: users[0].id }, // Pastor Mike
          { userId: users[2].id, readAt: daysAgo(1), reaction: "on-it" }, // Marcus Johnson
        ],
      },
    },
  });

  await prisma.insight.create({
    data: {
      churchId: church.id,
      authorId: users[6].id, // Derek Hayes
      type: InsightType.CELEBRATION,
      source: InsightSource.LEADER_SHARED,
      priority: InsightPriority.FYI,
      title: "New drummer locked in for Westside campus",
      body: "Marcus Williams has been crushing it in rehearsals. He's committed to both Sunday services starting next week. This fills our last gap in the Westside rotation.",
      createdAt: daysAgo(1),
      recipients: {
        create: [
          { userId: users[1].id }, // Sarah Mitchell (Campus Pastor)
          { userId: users[0].id, readAt: daysAgo(0), reaction: "thanks" }, // Pastor Mike
        ],
      },
    },
  });

  await prisma.insight.create({
    data: {
      churchId: church.id,
      authorId: users[1].id, // Sarah Mitchell
      type: InsightType.MEMBER_CARE,
      source: InsightSource.LEADER_SHARED,
      priority: InsightPriority.URGENT,
      title: "Can someone check on the Garcia family?",
      body: "Maria Garcia mentioned they're going through a rough patch. I don't have details but she seemed really stressed after service. Carlos hasn't been in 2 weeks either. This might need a pastoral care visit.",
      createdAt: daysAgo(0),
      recipients: {
        create: [
          { userId: users[0].id }, // Pastor Mike
        ],
      },
    },
  });

  console.log("Created 9 insights (6 AI-generated, 3 leader-shared)");

  // ─── Audit Log (10) ─────────────────────────────────────
  await Promise.all([
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[0].id, action: "LOGIN", resource: "session", details: { method: "credentials" }, ip: "10.0.1.10", createdAt: daysAgo(0) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[0].id, action: "VIEW_MEMBER", resource: m("Robert", "Johnson").id, details: { memberName: "Robert Johnson" }, ip: "10.0.1.10", createdAt: daysAgo(0) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[1].id, action: "LOGIN", resource: "session", details: { method: "credentials" }, ip: "10.0.1.22", createdAt: daysAgo(1) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[1].id, action: "VIEW_MEMBER", resource: m("Carlos", "Martinez").id, details: { memberName: "Carlos Martinez" }, ip: "10.0.1.22", createdAt: daysAgo(1) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[0].id, action: "ALERT_REVIEWED", resource: alerts[0].id, details: { headline: alerts[0].headline }, ip: "10.0.1.10", createdAt: daysAgo(1) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[2].id, action: "LOGIN", resource: "session", details: { method: "credentials" }, ip: "10.0.1.35", createdAt: daysAgo(2) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[2].id, action: "EXPORT_MEMBERS", resource: "members", details: { format: "csv", count: 25 }, ip: "10.0.1.35", createdAt: daysAgo(2) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[0].id, action: "UPDATE_NOTES", resource: m("Angela", "Williams").id, details: { memberName: "Angela Williams" }, ip: "10.0.1.10", createdAt: daysAgo(3) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[1].id, action: "VIEW_ALERT", resource: alerts[2].id, details: { headline: alerts[2].headline }, ip: "10.0.1.22", createdAt: daysAgo(3) } }),
    prisma.auditLog.create({ data: { churchId: church.id, userId: users[0].id, action: "VIEW_DASHBOARD", resource: "dashboard", ip: "10.0.1.10", createdAt: daysAgo(4) } }),
  ]);
  console.log("Created 10 audit log entries");

  // ─── Care Workflows ────────────────────────────────────
  // Clean up any existing workflows first
  await prisma.workflowStepExecution.deleteMany({ where: { execution: { churchId: church.id } } });
  await prisma.workflowExecution.deleteMany({ where: { churchId: church.id } });
  await prisma.workflowStep.deleteMany({ where: { workflow: { churchId: church.id } } });
  await prisma.workflow.deleteMany({ where: { churchId: church.id } });

  // Create 3 active workflows from templates
  const workflow1 = await prisma.workflow.create({
    data: {
      churchId: church.id,
      name: "Attendance Drop — Personal Check-In",
      description: "When a member misses 3+ weeks, send a caring text, wait 3 days, then email, then create a pastor follow-up task.",
      trigger: WorkflowTrigger.ALERT_ATTENDANCE_DROP,
      status: WorkflowStatus.ACTIVE,
      createdById: users[0].id,
      steps: {
        create: [
          { sortOrder: 1, type: WorkflowStepType.SEND_SMS, config: { body: "Hey {{firstName}}, we've missed you at Crossroads! Just checking in — is everything okay? We're here for you. 💜" } },
          { sortOrder: 2, type: WorkflowStepType.WAIT_DAYS, config: { days: 3 } },
          { sortOrder: 3, type: WorkflowStepType.SEND_EMAIL, config: { subject: "We miss you, {{firstName}}!", body: "Hi {{firstName}},\n\nWe noticed you haven't been at services recently and just wanted to reach out.\n\nWith love,\nCrossroads Church" } },
          { sortOrder: 4, type: WorkflowStepType.WAIT_DAYS, config: { days: 4 } },
          { sortOrder: 5, type: WorkflowStepType.CREATE_TASK, config: { task: "Personal follow-up call — member absent 3+ weeks", assignTo: "Campus Pastor" } },
          { sortOrder: 6, type: WorkflowStepType.UPDATE_TAG, config: { tagName: "care:follow-up-sent" } },
        ],
      },
    },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });

  const workflow2 = await prisma.workflow.create({
    data: {
      churchId: church.id,
      name: "Visitor Welcome Journey",
      description: "When a first-time visitor is detected, send a welcome text, email the next day, then invite to Growth Track.",
      trigger: WorkflowTrigger.ALERT_VISITOR_FOLLOWUP_MISSED,
      status: WorkflowStatus.ACTIVE,
      createdById: users[0].id,
      steps: {
        create: [
          { sortOrder: 1, type: WorkflowStepType.SEND_SMS, config: { body: "Hi {{firstName}}! 👋 So glad you visited Crossroads! We'd love to help you feel at home." } },
          { sortOrder: 2, type: WorkflowStepType.WAIT_DAYS, config: { days: 1 } },
          { sortOrder: 3, type: WorkflowStepType.SEND_EMAIL, config: { subject: "Welcome to Crossroads, {{firstName}}!", body: "Thank you for visiting! Here's how to get connected..." } },
          { sortOrder: 4, type: WorkflowStepType.WAIT_DAYS, config: { days: 5 } },
          { sortOrder: 5, type: WorkflowStepType.ENROLL_GROWTH_TRACK, config: {} },
          { sortOrder: 6, type: WorkflowStepType.NOTIFY_STAFF, config: { title: "New visitor follow-up complete", body: "Automated welcome journey finished." } },
        ],
      },
    },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });

  const workflow3 = await prisma.workflow.create({
    data: {
      churchId: church.id,
      name: "Volunteer Burnout Prevention",
      description: "When burnout risk is detected, notify the team leader and send a supportive message.",
      trigger: WorkflowTrigger.ALERT_VOLUNTEER_BURNOUT,
      status: WorkflowStatus.ACTIVE,
      createdById: users[0].id,
      steps: {
        create: [
          { sortOrder: 1, type: WorkflowStepType.NOTIFY_STAFF, config: { title: "Volunteer burnout risk detected", body: "Consider lightening their load." } },
          { sortOrder: 2, type: WorkflowStepType.WAIT_DAYS, config: { days: 2 } },
          { sortOrder: 3, type: WorkflowStepType.SEND_EMAIL, config: { subject: "You're amazing, {{firstName}}", body: "We see how much you give and want to make sure you're thriving." } },
          { sortOrder: 4, type: WorkflowStepType.UPDATE_TAG, config: { tagName: "care:burnout-outreach" } },
        ],
      },
    },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });

  console.log("Created 3 care workflows");

  // Create demo workflow executions (mix of completed and running)
  const execMembers = [
    m("Angela", "Williams"),
    m("David", "Lee"),
    m("Carlos", "Martinez"),
    m("Priya", "Patel"),
    m("James", "Thompson"),
    m("Sarah", "Kim"),
  ].filter(Boolean);

  for (let i = 0; i < Math.min(execMembers.length, 4); i++) {
    const member = execMembers[i];
    const wf = i < 2 ? workflow1 : workflow2;
    const isCompleted = i < 2;

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: wf.id,
        churchId: church.id,
        memberId: member.id,
        status: isCompleted ? WorkflowExecutionStatus.COMPLETED : WorkflowExecutionStatus.RUNNING,
        startedAt: daysAgo(isCompleted ? 14 - i * 3 : 3 - i),
        completedAt: isCompleted ? daysAgo(7 - i * 2) : undefined,
      },
    });

    // Create step executions
    for (let s = 0; s < wf.steps.length; s++) {
      const step = wf.steps[s];
      const completed = isCompleted || s < 2;
      await prisma.workflowStepExecution.create({
        data: {
          executionId: execution.id,
          stepId: step.id,
          status: completed
            ? WorkflowStepExecutionStatus.COMPLETED
            : s === 2
              ? WorkflowStepExecutionStatus.WAITING
              : WorkflowStepExecutionStatus.PENDING,
          scheduledFor: !completed && s === 2 ? daysAgo(-2) : undefined,
          executedAt: completed ? daysAgo(isCompleted ? 10 - s : 2 - s) : undefined,
          result: completed
            ? { status: "delivered", simulatedAt: new Date().toISOString() }
            : undefined,
        },
      });
    }
  }
  console.log("Created demo workflow executions");

  console.log("\nSeed complete!");
  console.log("Login credentials: admin / modern2024!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
