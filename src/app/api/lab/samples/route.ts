import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { sampleNumber: { contains: search, mode: "insensitive" } },
      { sampleName: { contains: search, mode: "insensitive" } },
    ];
  }

  const data = await prisma.labSample.findMany({
    where,
    include: {
      product: {
        include: { name: true },
      },
      _count: {
        select: { analysisResults: true },
      },
    },
    orderBy: { receivedDate: "desc" },
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const seq = await prisma.numberSequence.upsert({
    where: { prefix_year: { prefix: "SMP", year: new Date().getFullYear() } },
    update: { currentNumber: { increment: 1 } },
    create: { prefix: "SMP", year: new Date().getFullYear(), currentNumber: 1 },
  });
  const sampleNumber = `SMP-${seq.year}-${String(seq.currentNumber).padStart(4, "0")}`;

  const record = await prisma.labSample.create({
    data: {
      sampleNumber,
      sampleName: body.sampleName,
      productId: body.productId || undefined,
      source: body.source,
      receivedDate: new Date(body.receivedDate),
      status: body.status ?? "RECEIVED",
      note: body.note,
    },
    include: {
      product: { include: { name: true } },
      _count: { select: { analysisResults: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
