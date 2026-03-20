import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveRolePermissions } from "@/lib/rbac/resolve";

/**
 * Demo mode: always returns the first SENIOR_PASTOR user.
 * No real authentication — this is the public demo instance.
 */
export async function getServerSession() {
  const church = await prisma.church.findFirst();
  if (!church) {
    throw new Error("No church found. Run `npx prisma db seed` first.");
  }

  const user = await prisma.user.findFirst({
    where: { churchId: church.id, role: "SENIOR_PASTOR" },
  });

  return {
    userId: user?.id ?? "demo",
    churchId: church.id,
    campusId: user?.campusId ?? null,
    name: user?.name ?? "Demo User",
    role: user?.role ?? ("SENIOR_PASTOR" as const),
    username: user?.username ?? "demo",
    permissions: resolveRolePermissions("SENIOR_PASTOR"),
  };
}
