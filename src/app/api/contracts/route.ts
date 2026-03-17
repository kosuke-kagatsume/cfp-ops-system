import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { contractNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { partner: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(contracts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const seq = await prisma.numberSequence.upsert({
    where: { prefix_year: { prefix: "CNT", year: new Date().getFullYear() } },
    update: { currentNumber: { increment: 1 } },
    create: { prefix: "CNT", year: new Date().getFullYear(), currentNumber: 1 },
  });
  const contractNumber = `CNT-${seq.year}-${String(seq.currentNumber).padStart(4, "0")}`;

  const record = await prisma.contract.create({
    data: {
      contractNumber,
      partnerId: body.partnerId,
      title: body.title,
      contractType: body.contractType,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      autoRenewal: body.autoRenewal ?? false,
      renewalNoticeDays: body.renewalNoticeDays,
      status: body.status ?? "DRAFT",
      filePath: body.filePath,
      note: body.note,
    },
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
