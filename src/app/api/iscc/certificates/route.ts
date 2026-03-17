import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { certNumber: { contains: search, mode: "insensitive" } },
      { holderName: { contains: search, mode: "insensitive" } },
    ];
  }

  const data = await prisma.isccCertificate.findMany({
    where,
    include: {
      partner: { select: { id: true, name: true } },
      _count: { select: { massBalances: true } },
    },
    orderBy: { expiryDate: "desc" },
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

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
