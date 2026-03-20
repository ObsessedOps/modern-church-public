// ─── Bitfield Encoding for JWT ───────────────────────────
// Compresses a user's permission set into a short base64url
// string (~10 chars for ~50 permissions). Stored in JWT.
//
// IMPORTANT: ALL_PERMISSIONS order is append-only.
// Never reorder or remove entries.

import { ALL_PERMISSIONS } from "./permissions";

const WILDCARD = "*";

/**
 * Encode a list of permission strings into a base64url bitfield.
 * Wildcard '*' is stored as a single-char marker.
 */
export function encodeBitfield(permissions: string[]): string {
  if (permissions.includes(WILDCARD)) return WILDCARD;

  const byteCount = Math.ceil(ALL_PERMISSIONS.length / 8);
  const bits = new Uint8Array(byteCount);

  for (const perm of permissions) {
    const idx = ALL_PERMISSIONS.indexOf(perm);
    if (idx >= 0) {
      bits[Math.floor(idx / 8)] |= 1 << idx % 8;
    }
  }

  // Use btoa-compatible encoding for both Node and Edge
  return Buffer.from(bits).toString("base64url");
}

/**
 * Convert base64url to standard base64.
 */
function base64urlToBase64(str: string): string {
  return str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (str.length % 4)) % 4);
}

/**
 * Decode a base64url bitfield back into a Set of permission strings.
 * Works in both Node and browser environments.
 */
export function decodeBitfield(encoded: string): Set<string> {
  if (!encoded || encoded === WILDCARD) return new Set([WILDCARD]);

  const binary = atob(base64urlToBase64(encoded));
  const bits = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bits[i] = binary.charCodeAt(i);
  }
  const perms = new Set<string>();

  for (let i = 0; i < ALL_PERMISSIONS.length; i++) {
    const byteIdx = Math.floor(i / 8);
    if (byteIdx < bits.length && bits[byteIdx] & (1 << i % 8)) {
      perms.add(ALL_PERMISSIONS[i]);
    }
  }

  return perms;
}
