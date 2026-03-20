// ─── Permission Resolution ───────────────────────────────
// Called once at login. Resolves the user's effective
// permissions from role defaults + per-user overrides.
// Result is encoded as a bitfield and cached in the JWT.

import { prisma } from "@/lib/prisma";
import { ROLE_PERMISSIONS } from "./roles";
import { encodeBitfield } from "./bitfield";

/**
 * Resolve the effective permission bitfield for a user.
 * 1. Start with role defaults
 * 2. Apply per-user overrides (grant/revoke)
 * 3. Encode as bitfield string
 */
export async function resolveUserPermissions(
  userId: string
): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      role: true,
      permissionOverrides: {
        select: { permission: true, granted: true },
      },
    },
  });

  // Start with role defaults
  const rolePerms = ROLE_PERMISSIONS[user.role] ?? [];

  // SUPER_ADMIN always gets wildcard
  if (rolePerms.includes("*")) {
    return encodeBitfield(["*"]);
  }

  const permissions = new Set(rolePerms);

  // Apply per-user overrides
  for (const override of user.permissionOverrides) {
    if (override.granted) {
      permissions.add(override.permission);
    } else {
      permissions.delete(override.permission);
    }
  }

  return encodeBitfield(Array.from(permissions));
}

/**
 * Resolve permissions for a role without DB lookup (for dev fallback).
 */
export function resolveRolePermissions(role: string): string {
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  return encodeBitfield(rolePerms);
}
