import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { paymentPayableCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";
import { createAndLinkApproval, linkApprovalToRecord } from "@/lib/approval-guard";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.paymentPayable.findMany({
    where,
    include: {
      supplier: { select: { id: true, code: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.paymentPayable.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: payments, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(payments, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, paymentPayableCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const paymentNumber = await getNextNumber("PAY");

  const payment = await prisma.paymentPayable.create({
    data: {
      paymentNumber,
      supplierId: body.supplierId,
      paymentDate: new Date(body.paymentDate),
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      isReconciled: false,
      note: body.note || null,
    },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
    },
  });

  try {
    const approvalId = await createAndLinkApproval({
      recordId: payment.id,
      tableName: "PaymentPayable",
      category: "PAYMENT",
      title: `支払 ${paymentNumber}`,
      description: `${payment.supplier?.name}: ¥${body.amount.toLocaleString()}`,
      amount: body.amount,
      requesterId: body.createdBy,
    });
    await linkApprovalToRecord("PaymentPayable", payment.id, approvalId);
  } catch {}

  await createAuditLog({ action: "CREATE", tableName: "PaymentPayable", recordId: payment.id, newData: payment });

  return NextResponse.json(payment, { status: 201 });
});
