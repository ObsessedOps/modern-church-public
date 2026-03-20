"use server";

import { revalidatePath } from "next/cache";

// ─── Demo Mode ──────────────────────────────────────────
// All write actions are no-ops in the public demo.
// The UI still works (buttons respond, paths revalidate)
// but no data is mutated.

export async function signOutAction() {
  // No-op in demo — there's no real session
}

export async function dismissAlert(_alertId: string) {
  revalidatePath("/alerts");
  revalidatePath("/");
}

export async function markAlertReviewed(_alertId: string) {
  revalidatePath("/alerts");
  revalidatePath("/");
}

export async function updateMemberNotes(_memberId: string, _notes: string) {
  revalidatePath("/members");
}
