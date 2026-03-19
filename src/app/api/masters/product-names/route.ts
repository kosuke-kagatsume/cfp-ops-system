import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { productNameCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [names, total] = await Promise.all([
    prisma.productName.findMany({
 orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.productName.count(),
  ]);
  if (pageParam) {
    return NextResponse.json({ items: names, total, page, limit }, { headers: cacheHeaders("MASTER") });
  }
  return NextResponse.json(names, { headers: cacheHeaders("MASTER") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, productNameCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const item = await prisma.productName.create({
    data: {
      code: body.code,
      name: body.name,
      isccManageName: body.isccManageName,
      mixedProductCode: body.mixedProductCode,
      mixedRatio: body.mixedRatio,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
