import { prisma } from "@/lib/db";
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
      { certificateNumber: { contains: search, mode: "insensitive" } },
      {
        sample: {
          sampleNumber: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.analysisCertificate.findMany({
    where,
    include: {
      sample: {
        include: {
          product: { include: { name: true } },
          analysisResults: true,
        },
      },
    },
    orderBy: { issueDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.analysisCertificate.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: data, total, page, limit });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const seq = await prisma.numberSequence.upsert({
    where: { prefix_year: { prefix: "ACT", year: new Date().getFullYear() } },
    update: { currentNumber: { increment: 1 } },
    create: { prefix: "ACT", year: new Date().getFullYear(), currentNumber: 1 },
  });
  const certificateNumber = `ACT-${seq.year}-${String(seq.currentNumber).padStart(4, "0")}`;

  const record = await prisma.analysisCertificate.create({
    data: {
      certificateNumber,
      sampleId: body.sampleId,
      issueDate: new Date(body.issueDate),
      pdfPath: body.pdfPath,
      note: body.note,
    },
    include: {
      sample: {
        include: {
          product: { include: { name: true } },
          analysisResults: true,
        },
      },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
