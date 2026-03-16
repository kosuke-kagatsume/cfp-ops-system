import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const exported = searchParams.get("exported");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { debitAccount: { contains: search, mode: "insensitive" } },
      { creditAccount: { contains: search, mode: "insensitive" } },
    ];
  }

  if (exported === "true") {
    where.isExported = true;
  } else if (exported === "false") {
    where.isExported = false;
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: { entryDate: "desc" },
  });

  return NextResponse.json(entries);
}
