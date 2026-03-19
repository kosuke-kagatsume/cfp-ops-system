import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { plantCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [plants, total] = await Promise.all([
    prisma.plant.findMany({

    include: {
      warehouses: true,
      tanks: true,
    },
    orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.plant.count(),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: plants, total, page, limit }, { headers: cacheHeaders("MASTER") });
  }
  return NextResponse.json(plants, { headers: cacheHeaders("MASTER") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, plantCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const plant = await prisma.plant.create({
    data: {
      code: body.code,
      name: body.name,
      companyId: body.companyId ?? "CFP",
      address: body.address,
      tel: body.tel,
    },
  });

  return NextResponse.json(plant, { status: 201 });
}
