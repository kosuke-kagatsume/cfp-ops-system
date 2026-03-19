import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { residueUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.residue.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await validateBody(request, residueUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.disposalDate !== undefined) data.disposalDate = new Date(body.disposalDate);
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.disposalMethod !== undefined) data.disposalMethod = body.disposalMethod || null;
  if (body.disposalCost !== undefined) data.disposalCost = body.disposalCost;
  if (body.contractor !== undefined) data.contractor = body.contractor || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.residue.update({ where: { id }, data });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.residue.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
