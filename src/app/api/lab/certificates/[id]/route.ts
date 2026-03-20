import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { certificateUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.analysisCertificate.findUnique({
    where: { id },
    include: {
      sample: {
        include: {
          product: { include: { name: true } },
          analysisResults: true,
        },
      },
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
  const result = await validateBody(request, certificateUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.sampleId !== undefined) data.sampleId = body.sampleId;
  if (body.issueDate !== undefined) data.issueDate = new Date(body.issueDate);
  if (body.pdfPath !== undefined) data.pdfPath = body.pdfPath || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.analysisCertificate.update({
    where: { id },
    data,
    include: {
      sample: {
        include: {
          product: { include: { name: true } },
          analysisResults: true,
        },
      },
    },
  });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "AnalysisCertificate", recordId: id });
  await prisma.analysisCertificate.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
