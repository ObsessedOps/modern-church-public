import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionsProvider } from "@/components/providers/PermissionsProvider";
import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import PageViewTracker from "@/components/analytics/PageViewTracker";

export const dynamic = "force-dynamic";

const DEMO_ROLES: Record<string, string> = {
  SENIOR_PASTOR: "Lead Pastor",
  CAMPUS_PASTOR: "Campus Pastor",
  YOUTH_PASTOR: "Youth Pastor",
  KIDS_PASTOR: "Kids Pastor",
  WORSHIP_LEADER: "Worship Leader",
  GROUPS_DIRECTOR: "Groups Director",
  OUTREACH_DIRECTOR: "Outreach Director",
  ACCOUNTING: "Accounting",
  VOLUNTEER_LEADER: "Volunteer Leader",
  READ_ONLY: "Read Only",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value ?? "";
  const activeDemoRoleLabel = DEMO_ROLES[demoRole] ?? "";

  const rawCampuses = session
    ? await prisma.campus.findMany({
        where: { churchId: session.churchId, status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { isMainCampus: "desc" },
      })
    : [];

  const campuses = rawCampuses.map((c) => ({
    ...c,
    slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  }));

  return (
    <PermissionsProvider
      permissions={session?.permissions ?? ""}
      role={session?.role ?? ""}
      userName={session?.name ?? ""}
      userEmail={session?.username ?? ""}
    >
      <AppShell campuses={campuses} demoRoles={DEMO_ROLES} activeDemoRole={demoRole} activeDemoRoleLabel={activeDemoRoleLabel}>
        <PageViewTracker />
        {children}
      </AppShell>
    </PermissionsProvider>
  );
}
