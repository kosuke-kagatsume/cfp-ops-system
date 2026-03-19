import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { isccCertUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.isccCertificate.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, name: true } },
      _count: { select: { massBalances: true } },
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
  const result = await validateBody(request, isccCertUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.certNumber !== undefined) data.certNumber = body.certNumber;
  if (body.partnerId !== undefined) data.partnerId = body.partnerId || null;
  if (body.holderName !== undefined) data.holderName = body.holderName;
  if (body.scope !== undefined) data.scope = body.scope || null;
  if (body.issueDate !== undefined) data.issueDate = new Date(body.issueDate);
  if (body.expiryDate !== undefined) data.expiryDate = new Date(body.expiryDate);
  if (body.status !== undefined) data.status = body.status;
  if (body.pdfPath !== undefined) data.pdfPath = body.pdfPath || null;

  const record = await prisma.isccCertificate.update({
    where: { id },
    data,
    include: {
      partner: { select: { id: true, name: true } },
      _count: { select: { massBalances: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.isccCertificate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
