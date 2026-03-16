import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.contractor = { contains: search, mode: "insensitive" };
  }

  const residues = await prisma.residue.findMany({
    where,
    orderBy: { disposalDate: "desc" },
  });

  return NextResponse.json(residues);
}
