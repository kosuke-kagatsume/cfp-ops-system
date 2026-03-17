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

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
    where,
    orderBy: { entryDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.journalEntry.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: entries, total, page, limit });
  }
  return NextResponse.json(entries);
}
