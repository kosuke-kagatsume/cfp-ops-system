import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { simpleCodeName } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [shapes, total] = await Promise.all([
    prisma.productShape.findMany({
 orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.productShape.count(),
  ]);
  if (pageParam) {
    return NextResponse.json({ items: shapes, total, page, limit }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  }
  return NextResponse.json(shapes, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, simpleCodeName);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const item = await prisma.productShape.create({
    data: { code: body.code, name: body.name },
  });

  return NextResponse.json(item, { status: 201 });
}
