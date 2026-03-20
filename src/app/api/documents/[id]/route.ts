import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.document.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.documentType !== undefined) data.documentType = body.documentType;
  if (body.title !== undefined) data.title = body.title;
  if (body.filePath !== undefined) data.filePath = body.filePath;
  if (body.fileSize !== undefined) data.fileSize = body.fileSize;
  if (body.mimeType !== undefined) data.mimeType = body.mimeType || null;
  if (body.sourceType !== undefined) data.sourceType = body.sourceType || null;
  if (body.sourceId !== undefined) data.sourceId = body.sourceId || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.document.update({ where: { id }, data });
  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "Document", recordId: id });
  await prisma.document.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
