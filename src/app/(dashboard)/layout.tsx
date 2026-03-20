import { AppShell } from "@/components/layout/AppShell";
import { PermissionsProvider } from "@/components/providers/PermissionsProvider";
import { getServerSession } from "@/lib/server-auth";
import PageViewTracker from "@/components/analytics/PageViewTracker";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <PermissionsProvider
      permissions={session?.permissions ?? ""}
      role={session?.role ?? ""}
      userName={session?.name ?? ""}
      userEmail={session?.username ?? ""}
    >
      <AppShell>
        <PageViewTracker />
        {children}
      </AppShell>
    </PermissionsProvider>
  );
}
