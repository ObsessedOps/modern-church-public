import { AppShell } from "@/components/layout/AppShell";
import { PermissionsProvider } from "@/components/providers/PermissionsProvider";
import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import PageViewTracker from "@/components/analytics/PageViewTracker";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  const campuses = session
    ? await prisma.campus.findMany({
        where: { churchId: session.churchId, status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { isMainCampus: "desc" },
      })
    : [];

  return (
    <PermissionsProvider
      permissions={session?.permissions ?? ""}
      role={session?.role ?? ""}
      userName={session?.name ?? ""}
      userEmail={session?.username ?? ""}
    >
      <AppShell campuses={campuses}>
        <PageViewTracker />
        {children}
      </AppShell>
    </PermissionsProvider>
  );
}
