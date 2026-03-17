// =============================================================================
// 月次締め処理ロジック
// =============================================================================
import { prisma } from "./db";

type PreCheckResult = {
  canClose: boolean;
  warnings: string[];
  errors: string[];
  summary: {
    unreconciledPayments: number;
    unreconciledAmount: number;
    journalBalance: { debit: number; credit: number; balanced: boolean };
    revenueCount: number;
    revenueAmount: number;
    purchaseCount: number;
    purchaseAmount: number;
  };
};

/**
 * 月次締めプレチェック
 * 締め前に未消込チェック・仕訳残高チェックを行う
 */
export async function preCheckMonthlyClosing(
  year: number,
  month: number
): Promise<PreCheckResult> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const warnings: string[] = [];
  const errors: string[] = [];

  // 既に締め済みかチェック
  const existing = await prisma.monthlyClosing.findUnique({
    where: { companyId_year_month: { companyId: "CFP", year, month } },
  });
  if (existing?.isClosed) {
    errors.push(`${year}年${month}月は既に締め済みです`);
  }

  // 未消込入金チェック
  const unreconciledPayments = await prisma.paymentReceived.findMany({
    where: {
      isReconciled: false,
      paymentDate: { gte: startDate, lte: endDate },
    },
  });

  const unreconciledAmount = unreconciledPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  if (unreconciledPayments.length > 0) {
    warnings.push(
      `未消込入金が${unreconciledPayments.length}件（¥${unreconciledAmount.toLocaleString()}）あります`
    );
  }

  // 仕訳残高チェック（貸借一致）
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      entryDate: { gte: startDate, lte: endDate },
    },
  });

  const totalDebit = journalEntries.reduce((sum, j) => sum + j.debitAmount, 0);
  const totalCredit = journalEntries.reduce(
    (sum, j) => sum + j.creditAmount,
    0
  );
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  if (!balanced) {
    errors.push(
      `仕訳の貸借が一致しません（借方: ¥${totalDebit.toLocaleString()} / 貸方: ¥${totalCredit.toLocaleString()}）`
    );
  }

  // 売上件数
  const revenues = await prisma.revenue.findMany({
    where: { revenueDate: { gte: startDate, lte: endDate } },
  });
  const revenueAmount = revenues.reduce((sum, r) => sum + r.amount, 0);

  // 仕入件数
  const purchases = await prisma.purchase.findMany({
    where: { purchaseDate: { gte: startDate, lte: endDate } },
  });
  const purchaseAmount = purchases.reduce((sum, p) => sum + p.amount, 0);

  return {
    canClose: errors.length === 0,
    warnings,
    errors,
    summary: {
      unreconciledPayments: unreconciledPayments.length,
      unreconciledAmount,
      journalBalance: { debit: totalDebit, credit: totalCredit, balanced },
      revenueCount: revenues.length,
      revenueAmount,
      purchaseCount: purchases.length,
      purchaseAmount,
    },
  };
}

/**
 * 月次締め実行
 */
export async function executeMonthlyClosing(year: number, month: number) {
  const preCheck = await preCheckMonthlyClosing(year, month);

  if (!preCheck.canClose) {
    return { success: false, errors: preCheck.errors };
  }

  // 月次締めレコード作成 or 更新
  await prisma.monthlyClosing.upsert({
    where: {
      companyId_year_month: { companyId: "CFP", year, month },
    },
    create: {
      companyId: "CFP",
      year,
      month,
      isClosed: true,
      closedAt: new Date(),
    },
    update: {
      isClosed: true,
      closedAt: new Date(),
    },
  });

  return {
    success: true,
    warnings: preCheck.warnings,
    summary: preCheck.summary,
  };
}

/**
 * 月次締め解除
 */
export async function reopenMonthlyClosing(year: number, month: number) {
  await prisma.monthlyClosing.update({
    where: {
      companyId_year_month: { companyId: "CFP", year, month },
    },
    data: {
      isClosed: false,
      closedAt: null,
      closedBy: null,
    },
  });

  return { success: true };
}

/**
 * 指定月が締め済みかチェック（データ編集ガード用）
 */
export async function isMonthClosed(date: Date): Promise<boolean> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const closing = await prisma.monthlyClosing.findUnique({
    where: {
      companyId_year_month: { companyId: "CFP", year, month },
    },
  });

  return closing?.isClosed ?? false;
}
