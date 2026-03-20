import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — resolve church info by slug (public, no auth)
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const church = await prisma.church.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      campuses: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { isMainCampus: "desc" },
      },
    },
  });

  if (!church) {
    return NextResponse.json({ error: "Church not found" }, { status: 404 });
  }

  return NextResponse.json(church);
}

// POST — submit a connect card (public, no auth)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, firstName, lastName, email, phone, campusId, howHeard, prayerRequest, interests } = body;

    if (!slug || !firstName || !lastName) {
      return NextResponse.json({ error: "First name, last name, and church are required" }, { status: 400 });
    }

    const church = await prisma.church.findUnique({
      where: { slug },
      select: {
        id: true,
        campuses: {
          where: { isMainCampus: true },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // Resolve campus: use selected, fall back to main campus
    const resolvedCampusId = campusId || church.campuses[0]?.id;
    if (!resolvedCampusId) {
      return NextResponse.json({ error: "No campus available" }, { status: 400 });
    }

    // Create submission + member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing member by email or phone
      let member = null;
      if (email) {
        member = await tx.member.findFirst({
          where: { churchId: church.id, email },
        });
      }
      if (!member && phone) {
        member = await tx.member.findFirst({
          where: { churchId: church.id, phone },
        });
      }

      // Create member if new
      if (!member) {
        member = await tx.member.create({
          data: {
            churchId: church.id,
            primaryCampusId: resolvedCampusId,
            firstName,
            lastName,
            email: email || null,
            phone: phone || null,
            membershipStatus: "VISITOR",
            tags: interests?.length ? interests : [],
          },
        });
      }

      // Create the submission record
      const submission = await tx.connectCardSubmission.create({
        data: {
          churchId: church.id,
          campusId: resolvedCampusId,
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          howHeard: howHeard || null,
          prayerRequest: prayerRequest || null,
          interests: interests ?? [],
          memberId: member.id,
        },
      });

      return { submission, member, isNew: !email || !phone };
    });

    return NextResponse.json(
      { id: result.submission.id, memberId: result.member.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Connect card POST error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
