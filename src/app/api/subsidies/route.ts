import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { subsidyCreate, subsidyUpdate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

/**
 * GET: 補助金書類一覧
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
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

  return NextResponse.json(documents, { headers: cacheHeaders("TRANSACTION") });
});

/**
 * POST: 補助金書類登録
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, subsidyCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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

  await createAuditLog({ action: "CREATE", tableName: "Subsidy", recordId: doc.id, newData: doc });

  return NextResponse.json(doc, { status: 201 });
});

/**
 * PUT: 補助金書類更新
 */
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const raw = await request.json();

  if (!raw.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const parsed = subsidyUpdate.safeParse(raw);
  if (!parsed.success) {
    const messages = (parsed.error.issues as any[]).map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    return NextResponse.json(
      { error: "バリデーションエラー", details: messages },
      { status: 400 }
    );
  }
  const body = parsed.data as any;

  const doc = await prisma.subsidyDocument.update({
    where: { id: raw.id },
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
});

/**
 * DELETE: 補助金書類削除
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.subsidyDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
