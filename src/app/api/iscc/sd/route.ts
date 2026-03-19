import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { sdCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
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

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [data, total] = await Promise.all([
    prisma.sustainabilityDeclaration.findMany({
    where,
    orderBy: { issueDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.sustainabilityDeclaration.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: data, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(data, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, sdCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const record = await prisma.sustainabilityDeclaration.create({
    data: {
      sdNumber: body.sdNumber,
      issueDate: new Date(body.issueDate),
      rawMaterial: body.rawMaterial,
      countryOfOrigin: body.countryOfOrigin,
      ghgValue: body.ghgValue,
      pdfPath: body.pdfPath,
      note: body.note,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
