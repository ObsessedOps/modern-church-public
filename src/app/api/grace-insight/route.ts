import { NextResponse } from "next/server";

// Demo mode: static AI insight — no real API calls
export async function GET() {
  const insight =
    "Weekend attendance up 3.2% across all campuses. Downtown led growth with 47 more attendees. " +
    "23 members showing early disengagement signals. Giving is 8.1% above last week and 4% over budget.";

  return NextResponse.json({ insight });
}
