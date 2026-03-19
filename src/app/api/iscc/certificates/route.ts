import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { isccCertCreate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { certNumber: { contains: search, mode: "insensitive" } },
      { holderName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.isccCertificate.findMany({
    where,
    include: {
      partner: { select: { id: true, name: true } },
      _count: { select: { massBalances: true } },
    },
    orderBy: { expiryDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.isccCertificate.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: data, total, page, limit });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, isccCertCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const record = await prisma.isccCertificate.create({
    data: {
      certNumber: body.certNumber,
      partnerId: body.partnerId || undefined,
      holderName: body.holderName,
      scope: body.scope,
      issueDate: new Date(body.issueDate),
      expiryDate: new Date(body.expiryDate),
      status: body.status ?? "ACTIVE",
      pdfPath: body.pdfPath,
    },
    include: {
      partner: { select: { id: true, name: true } },
      _count: { select: { massBalances: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
