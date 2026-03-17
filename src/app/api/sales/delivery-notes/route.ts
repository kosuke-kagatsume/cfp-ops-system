import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {
    documentType: { in: ["DELIVERY_NOTE_TEMP", "DELIVERY_NOTE_FINAL"] },
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
    ];
  }

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: documents, total, page, limit });
  }
  return NextResponse.json(documents);
}
