// ─── Runtime Permission Checks ───────────────────────────
// Used in server components, server actions, and API routes.

import { decodeBitfield } from "./bitfield";

const WILDCARD = "*";

export interface SessionWithPermissions {
  userId: string;
  churchId: string;
  campusId?: string | null;
  role: string;
  permissions: string; // bitfield-encoded
}

/**
 * Check if user has a specific permission.
 * SUPER_ADMIN (wildcard) always returns true.
 */
export function can(
  session: SessionWithPermissions,
  permission: string
): boolean {
  const perms = decodeBitfield(session.permissions);
  return perms.has(WILDCARD) || perms.has(permission);
}

/**
 * Check if user has ALL of the specified permissions (AND logic).
 */
export function canAll(
  session: SessionWithPermissions,
  permissions: string[]
): boolean {
  const perms = decodeBitfield(session.permissions);
  if (perms.has(WILDCARD)) return true;
  return permissions.every((p) => perms.has(p));
}

/**
 * Check if user has ANY of the specified permissions (OR logic).
 */
export function canAny(
  session: SessionWithPermissions,
  permissions: string[]
): boolean {
  const perms = decodeBitfield(session.permissions);
  if (perms.has(WILDCARD)) return true;
  return permissions.some((p) => perms.has(p));
}

/**
 * Throw if user lacks the required permission.
 * Use in server actions and API routes.
 */
export function authorize(
  session: SessionWithPermissions,
  permission: string
): void {
  if (!can(session, permission)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }
}

/**
 * Get the full decoded permission set (for client-side use).
 */
export function getPermissionSet(
  session: SessionWithPermissions
): Set<string> {
  return decodeBitfield(session.permissions);
}
