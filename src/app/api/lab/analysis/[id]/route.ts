import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.analysisResult.findUnique({
    where: { id },
    include: {
      sample: { include: { product: { include: { name: true } } } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.sampleId !== undefined) data.sampleId = body.sampleId;
  if (body.testItem !== undefined) data.testItem = body.testItem;
  if (body.testMethod !== undefined) data.testMethod = body.testMethod || null;
  if (body.result !== undefined) data.result = body.result;
  if (body.unit !== undefined) data.unit = body.unit || null;
  if (body.standard !== undefined) data.standard = body.standard || null;
  if (body.isPassed !== undefined) data.isPassed = body.isPassed;
  if (body.analysisDate !== undefined) data.analysisDate = new Date(body.analysisDate);
  if (body.analyst !== undefined) data.analyst = body.analyst || null;

  const record = await prisma.analysisResult.update({
    where: { id },
    data,
    include: {
      sample: { include: { product: { include: { name: true } } } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.analysisResult.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
