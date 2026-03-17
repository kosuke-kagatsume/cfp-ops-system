// =============================================================================
// 入金消込ロジック
// 入金データと請求データを金額・取引先でマッチングする
// =============================================================================
import { prisma } from "./db";
import { generatePaymentReceivedJournal } from "./journal";

type ReconciliationResult = {
  matched: { paymentId: string; invoiceId: string; paymentNumber: string; invoiceNumber: string; amount: number }[];
  unmatched: { paymentId: string; paymentNumber: string; customerName: string; amount: number; reason: string }[];
};

/**
 * 自動消込
 * 未消込の入金と未払い（ISSUED/SENT）の請求書を金額・取引先で完全一致マッチング
 */
export async function autoReconcile(): Promise<ReconciliationResult> {
  // 未消込の入金一覧を取得
  const unreconciledPayments = await prisma.paymentReceived.findMany({
    where: { isReconciled: false },
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { paymentDate: "asc" },
  });

  // 未払い請求書一覧を取得
  const unpaidInvoices = await prisma.invoice.findMany({
    where: { status: { in: ["ISSUED", "SENT"] } },
    orderBy: { billingDate: "asc" },
  });

  const result: ReconciliationResult = { matched: [], unmatched: [] };
  const usedInvoiceIds = new Set<string>();

  for (const payment of unreconciledPayments) {
    // 同一取引先 + 金額完全一致で検索
    const matchingInvoice = unpaidInvoices.find(
      (inv) =>
        inv.customerId === payment.customerId &&
        inv.total === payment.amount &&
        !usedInvoiceIds.has(inv.id)
    );

    if (matchingInvoice) {
      usedInvoiceIds.add(matchingInvoice.id);

      // 消込実行
      await prisma.$transaction([
        prisma.paymentReceived.update({
          where: { id: payment.id },
          data: { isReconciled: true },
        }),
        prisma.invoice.update({
          where: { id: matchingInvoice.id },
          data: { status: "PAID" },
        }),
      ]);

      // 入金仕訳生成
      await generatePaymentReceivedJournal({
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
      });

      result.matched.push({
        paymentId: payment.id,
        invoiceId: matchingInvoice.id,
        paymentNumber: payment.paymentNumber,
        invoiceNumber: matchingInvoice.invoiceNumber,
        amount: payment.amount,
      });
    } else {
      // マッチング不可の理由を判定
      const sameCustomerInvoices = unpaidInvoices.filter(
        (inv) => inv.customerId === payment.customerId && !usedInvoiceIds.has(inv.id)
      );

      let reason = "該当する請求書なし";
      if (sameCustomerInvoices.length > 0) {
        const closestInvoice = sameCustomerInvoices[0];
        if (payment.amount > closestInvoice.total) {
          reason = "過入金の可能性";
        } else if (payment.amount < closestInvoice.total) {
          reason = "入金不足の可能性";
        } else {
          reason = "金額不一致";
        }
      }

      result.unmatched.push({
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        customerName: payment.customer.name,
        amount: payment.amount,
        reason,
      });
    }
  }

  return result;
}

/**
 * 手動消込
 * 指定した入金と請求書を紐付ける
 */
export async function manualReconcile(paymentId: string, invoiceId: string) {
  const payment = await prisma.paymentReceived.findUnique({
    where: { id: paymentId },
  });
  if (!payment) throw new Error("入金が見つかりません");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("請求書が見つかりません");

  await prisma.$transaction([
    prisma.paymentReceived.update({
      where: { id: paymentId },
      data: { isReconciled: true },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    }),
  ]);

  // 入金仕訳生成
  await generatePaymentReceivedJournal({
    id: payment.id,
    paymentNumber: payment.paymentNumber,
    paymentDate: payment.paymentDate,
    amount: payment.amount,
  });

  return { paymentId, invoiceId };
}
