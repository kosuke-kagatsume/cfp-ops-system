import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { sdUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.sustainabilityDeclaration.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, sdUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.sdNumber !== undefined) data.sdNumber = body.sdNumber;
  if (body.issueDate !== undefined) data.issueDate = new Date(body.issueDate);
  if (body.rawMaterial !== undefined) data.rawMaterial = body.rawMaterial || null;
  if (body.countryOfOrigin !== undefined) data.countryOfOrigin = body.countryOfOrigin || null;
  if (body.ghgValue !== undefined) data.ghgValue = body.ghgValue;
  if (body.pdfPath !== undefined) data.pdfPath = body.pdfPath || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.sustainabilityDeclaration.update({ where: { id }, data });
  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "IsccSustainabilityDeclaration", recordId: id });
  await prisma.sustainabilityDeclaration.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
