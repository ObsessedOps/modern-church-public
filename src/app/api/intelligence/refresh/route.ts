import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runIntelligenceRefresh } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const church = await prisma.church.findFirst({ select: { id: true } });
    if (!church) {
      return NextResponse.json({ error: "No church found" }, { status: 404 });
    }

    const result = await runIntelligenceRefresh(church.id);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Intelligence refresh error:", err);
    return NextResponse.json(
      { error: "Intelligence refresh failed" },
      { status: 500 }
    );
  }
}
