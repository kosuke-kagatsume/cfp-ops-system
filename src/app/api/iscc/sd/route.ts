import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { sdNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const data = await prisma.sustainabilityDeclaration.findMany({
    where,
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(data);
}
