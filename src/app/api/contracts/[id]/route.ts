import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.contract.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, code: true, name: true } },
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
  if (body.partnerId !== undefined) data.partnerId = body.partnerId;
  if (body.title !== undefined) data.title = body.title;
  if (body.contractType !== undefined) data.contractType = body.contractType || null;
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.autoRenewal !== undefined) data.autoRenewal = body.autoRenewal;
  if (body.renewalNoticeDays !== undefined) data.renewalNoticeDays = body.renewalNoticeDays;
  if (body.status !== undefined) data.status = body.status;
  if (body.filePath !== undefined) data.filePath = body.filePath || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.contract.update({
    where: { id },
    data,
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
