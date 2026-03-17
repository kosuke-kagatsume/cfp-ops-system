import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

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
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.analysisCertificate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
