import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { analysisUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.analysisResult.findUnique({
    where: { id },
    include: {
      sample: { include: { product: { include: { name: true } } } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, analysisUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "AnalysisResult", recordId: id });
  await prisma.analysisResult.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
