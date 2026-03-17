import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.traceRecord.findUnique({
    where: { id },
    include: {
      stages: { orderBy: { stageOrder: "asc" } },
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
  if (body.sourceType !== undefined) data.sourceType = body.sourceType;
  if (body.sourceId !== undefined) data.sourceId = body.sourceId;

  const record = await prisma.traceRecord.update({
    where: { id },
    data,
    include: {
      stages: { orderBy: { stageOrder: "asc" } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.traceRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
