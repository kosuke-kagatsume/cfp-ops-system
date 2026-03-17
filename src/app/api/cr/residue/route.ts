import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.contractor = { contains: search, mode: "insensitive" };
  }

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [residues, total] = await Promise.all([
    prisma.residue.findMany({
    where,
    orderBy: { disposalDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.residue.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: residues, total, page, limit });
  }
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
