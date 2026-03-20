import { prisma } from "@/lib/db";
import { autoReconcile, manualReconcile } from "@/lib/reconciliation";
import { validateBody } from "@/lib/validate";
import { reconciliationAction } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

/**
 * GET: 未消込一覧取得
 */
export const GET = withErrorHandler(async () => {
  const unreconciledPayments = await prisma.paymentReceived.findMany({
    where: { isReconciled: false },
    include: { customer: { select: { id: true, name: true, code: true } } },
    orderBy: { paymentDate: "asc" },
  });

  // 未消込入金ごとに候補請求書を取得
  const paymentWithCandidates = await Promise.all(
    unreconciledPayments.map(async (payment) => {
      const candidates = await prisma.invoice.findMany({
        where: {
          customerId: payment.customerId,
          status: { in: ["ISSUED", "SENT"] },
        },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          billingDate: true,
        },
        orderBy: { billingDate: "desc" },
      });

      return {
        ...payment,
        candidates,
      };
    })
  );

  return NextResponse.json(paymentWithCandidates, { headers: cacheHeaders("TRANSACTION") });
});

/**
 * POST: 消込実行
 * body.action = "auto" → 自動消込
 * body.action = "manual" + body.paymentId, body.invoiceId → 手動消込
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, reconciliationAction);
  if ("error" in result) return result.error;
  const body = result.data;

  if (body.action === "auto") {
    const result = await autoReconcile();
    return NextResponse.json(result);
  }

  if (body.action === "manual") {
    if (!body.paymentId || !body.invoiceId) {
      return NextResponse.json(
        { error: "paymentId and invoiceId are required" },
        { status: 400 }
      );
    }
    const result = await manualReconcile(body.paymentId, body.invoiceId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
