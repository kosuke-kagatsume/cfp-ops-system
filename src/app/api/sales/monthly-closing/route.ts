import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const closings = await prisma.monthlyClosing.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      closedByUser: { select: { name: true } },
    },
  });

  return NextResponse.json(closings);
}
