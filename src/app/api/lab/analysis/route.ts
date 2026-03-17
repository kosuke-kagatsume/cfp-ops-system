import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { testItem: { contains: search, mode: "insensitive" } },
      {
        sample: {
          sampleNumber: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const data = await prisma.analysisResult.findMany({
    where,
    include: {
      sample: {
        include: {
          product: { include: { name: true } },
        },
      },
    },
    orderBy: { analysisDate: "desc" },
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const record = await prisma.analysisResult.create({
    data: {
      sampleId: body.sampleId,
      testItem: body.testItem,
      testMethod: body.testMethod,
      result: body.result,
      unit: body.unit,
      standard: body.standard,
      isPassed: body.isPassed,
      analysisDate: new Date(body.analysisDate),
      analyst: body.analyst,
    },
    include: {
      sample: { include: { product: { include: { name: true } } } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
