import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { simpleCodeName } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [grades, total] = await Promise.all([
    prisma.productGrade.findMany({
 orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.productGrade.count(),
  ]);
  if (pageParam) {
    return NextResponse.json({ items: grades, total, page, limit }, { headers: cacheHeaders("MASTER") });
  }
  return NextResponse.json(grades, { headers: cacheHeaders("MASTER") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, simpleCodeName);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const item = await prisma.productGrade.create({
    data: { code: body.code, name: body.name },
  });

  return NextResponse.json(item, { status: 201 });
}
