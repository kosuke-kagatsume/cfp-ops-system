import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.labSample.findUnique({
    where: { id },
    include: {
      product: { include: { name: true } },
      analysisResults: true,
      analysisCertificates: true,
      externalAnalyses: true,
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
  if (body.sampleName !== undefined) data.sampleName = body.sampleName;
  if (body.productId !== undefined) data.productId = body.productId || null;
  if (body.source !== undefined) data.source = body.source || null;
  if (body.receivedDate !== undefined) data.receivedDate = new Date(body.receivedDate);
  if (body.status !== undefined) data.status = body.status;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.labSample.update({
    where: { id },
    data,
    include: {
      product: { include: { name: true } },
      _count: { select: { analysisResults: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.labSample.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
