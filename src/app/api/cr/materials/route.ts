import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { materialNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
      { materialName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const materials = await prisma.crMaterial.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { arrivalDate: "desc" },
  });

  return NextResponse.json(materials);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 採番
  const seq = await prisma.numberSequence.upsert({
    where: { prefix_year: { prefix: "CRM", year: new Date().getFullYear() } },
    update: { currentNumber: { increment: 1 } },
    create: { prefix: "CRM", year: new Date().getFullYear(), currentNumber: 1 },
  });
  const materialNumber = `CRM-${seq.year}-${String(seq.currentNumber).padStart(4, "0")}`;

  const record = await prisma.crMaterial.create({
    data: {
      materialNumber,
      supplierId: body.supplierId,
      materialName: body.materialName,
      quantity: body.quantity,
      arrivalDate: new Date(body.arrivalDate),
      inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : undefined,
      status: body.status ?? "PENDING",
      chlorineContent: body.chlorineContent,
      moistureContent: body.moistureContent,
      foreignMatter: body.foreignMatter,
      note: body.note,
    },
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
