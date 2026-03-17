import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [colors, total] = await Promise.all([
    prisma.productColor.findMany({
 orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.productColor.count(),
  ]);
  if (pageParam) {
    return NextResponse.json({ items: colors, total, page, limit }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  }
  return NextResponse.json(colors, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const item = await prisma.productColor.create({
    data: { code: body.code, name: body.name },
  });

  return NextResponse.json(item, { status: 201 });
}
