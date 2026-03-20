import { NextResponse } from "next/server";

// Demo mode: no-op analytics endpoint
export async function POST() {
  return NextResponse.json({ ok: true });
}
