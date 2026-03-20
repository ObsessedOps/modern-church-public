import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();

    const users = await prisma.user.findMany({
      where: {
        churchId: session.churchId,
        id: { not: session.userId },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("Staff GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
