import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET: 補助金書類一覧
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { subsidyName: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const documents = await prisma.subsidyDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

/**
 * POST: 補助金書類登録
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const doc = await prisma.subsidyDocument.create({
    data: {
      subsidyName: body.subsidyName,
      documentType: body.documentType,
      title: body.title,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status ?? "DRAFT",
      filePath: body.filePath ?? null,
      relatedInvoiceId: body.relatedInvoiceId ?? null,
      relatedQuotationId: body.relatedQuotationId ?? null,
      note: body.note ?? null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

/**
 * PUT: 補助金書類更新
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const doc = await prisma.subsidyDocument.update({
    where: { id: body.id },
    data: {
      subsidyName: body.subsidyName,
      documentType: body.documentType,
      title: body.title,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status,
      filePath: body.filePath,
      relatedInvoiceId: body.relatedInvoiceId ?? null,
      relatedQuotationId: body.relatedQuotationId ?? null,
      note: body.note ?? null,
    },
  });

  return NextResponse.json(doc);
}

/**
 * DELETE: 補助金書類削除
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.subsidyDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
