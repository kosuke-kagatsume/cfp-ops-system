import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { quotationCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { name: true } },
    },
    orderBy: { quotationDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.quotation.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: quotations, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(quotations, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, quotationCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const quotationNumber = await getNextNumber("QUO");

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      customerId: body.customerId,
      quotationDate: new Date(body.quotationDate),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      subject: body.subject || null,
      items: body.items ?? [],
      subtotal: body.subtotal ?? 0,
      taxAmount: body.taxAmount ?? 0,
      total: body.total ?? 0,
      currency: body.currency ?? "JPY",
      status: "DRAFT",
      note: body.note || null,
    },
    include: {
      customer: { select: { name: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "Quotation", recordId: quotation.id, newData: quotation });

  return NextResponse.json(quotation, { status: 201 });
});
