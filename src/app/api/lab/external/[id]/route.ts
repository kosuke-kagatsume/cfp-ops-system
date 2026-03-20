import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { externalAnalysisUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.externalAnalysis.findUnique({
    where: { id },
    include: { sample: true },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, externalAnalysisUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.sampleId !== undefined) data.sampleId = body.sampleId;
  if (body.laboratoryName !== undefined) data.laboratoryName = body.laboratoryName;
  if (body.requestDate !== undefined) data.requestDate = new Date(body.requestDate);
  if (body.resultDate !== undefined) data.resultDate = body.resultDate ? new Date(body.resultDate) : null;
  if (body.reportPath !== undefined) data.reportPath = body.reportPath || null;
  if (body.cost !== undefined) data.cost = body.cost;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.externalAnalysis.update({
    where: { id },
    data,
    include: { sample: true },
  });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "ExternalAnalysis", recordId: id });
  await prisma.externalAnalysis.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
