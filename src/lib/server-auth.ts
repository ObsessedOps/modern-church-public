import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveRolePermissions } from "@/lib/rbac/resolve";
import { ROLE_PERMISSIONS } from "@/lib/rbac/roles";

/**
 * Demo mode: always returns the first SENIOR_PASTOR user.
 * No real authentication — this is the public demo instance.
 * Supports demo_role cookie to simulate different roles.
 */
export async function getServerSession() {
  const church = await prisma.church.findFirst();
  if (!church) {
    throw new Error("No church found. Run `npx prisma db seed` first.");
  }

  const user = await prisma.user.findFirst({
    where: { churchId: church.id, role: "SENIOR_PASTOR" },
  });

  // Check for demo role override
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value ?? "";
  const effectiveRole = (demoRole && ROLE_PERMISSIONS[demoRole]) ? demoRole : "SENIOR_PASTOR";

  return {
    userId: user?.id ?? "demo",
    churchId: church.id,
    campusId: user?.campusId ?? null,
    name: user?.name ?? "Demo User",
    role: effectiveRole,
    username: user?.username ?? "demo",
    permissions: resolveRolePermissions(effectiveRole),
  };
}
