import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { traceUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.traceRecord.findUnique({
    where: { id },
    include: {
      stages: { orderBy: { stageOrder: "asc" } },
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
  const result = await validateBody(request, traceUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "Traceability", recordId: id });
  await prisma.traceRecord.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
