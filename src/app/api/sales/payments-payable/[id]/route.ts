import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { paymentPayableUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.paymentPayable.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
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
  const result = await validateBody(request, paymentPayableUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const data: Record<string, unknown> = {};
  if (body.supplierId !== undefined) data.supplierId = body.supplierId;
  if (body.paymentDate !== undefined) data.paymentDate = new Date(body.paymentDate);
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod;
  if (body.isReconciled !== undefined) data.isReconciled = body.isReconciled;
  if (body.note !== undefined) data.note = body.note;

  const record = await prisma.paymentPayable.update({ where: { id }, data });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.paymentPayable.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
