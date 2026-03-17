import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.contractor = { contains: search, mode: "insensitive" };
  }

  const residues = await prisma.residue.findMany({
    where,
    orderBy: { disposalDate: "desc" },
  });

  return NextResponse.json(residues);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const record = await prisma.residue.create({
    data: {
      disposalDate: new Date(body.disposalDate),
      quantity: body.quantity,
      disposalMethod: body.disposalMethod,
      disposalCost: body.disposalCost,
      contractor: body.contractor,
      note: body.note,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
