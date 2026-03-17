// =============================================================================
// 仕訳自動生成ロジック
// トランザクション登録時に対応する仕訳を自動生成する
// =============================================================================
import { prisma } from "./db";

// 標準勘定科目コード
const ACCOUNTS = {
  // 資産
  ACCOUNTS_RECEIVABLE: "1131",    // 売掛金
  CASH_AND_DEPOSITS: "1111",      // 普通預金
  // 負債
  ACCOUNTS_PAYABLE: "2111",       // 買掛金
  ACCRUED_EXPENSES: "2121",       // 未払金
  // 収益
  SALES: "4111",                  // 売上高
  // 費用
  PURCHASES: "5111",              // 仕入高
  // 経費科目マッピング
  TRAVEL: "7121",                 // 旅費交通費
  ACCOMMODATION: "7122",          // 宿泊費
  ENTERTAINMENT: "7131",          // 交際費
  OFFICE_SUPPLIES: "7141",        // 事務用品費
  CONSUMABLES: "7142",            // 消耗品費
  REPAIRS: "7151",                // 修繕費
  MISC_EXPENSE: "7199",           // 雑費
} as const;

const EXPENSE_CATEGORY_MAP: Record<string, string> = {
  "交通費": ACCOUNTS.TRAVEL,
  "旅費交通費": ACCOUNTS.TRAVEL,
  "宿泊費": ACCOUNTS.ACCOMMODATION,
  "接待費": ACCOUNTS.ENTERTAINMENT,
  "交際費": ACCOUNTS.ENTERTAINMENT,
  "事務用品": ACCOUNTS.OFFICE_SUPPLIES,
  "事務用品費": ACCOUNTS.OFFICE_SUPPLIES,
  "消耗品": ACCOUNTS.CONSUMABLES,
  "消耗品費": ACCOUNTS.CONSUMABLES,
  "修繕費": ACCOUNTS.REPAIRS,
};

type JournalInput = {
  entryDate: Date;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  description: string;
  sourceType: string;
  sourceId: string;
};

/**
 * 仕訳レコードを一括作成する
 */
async function createJournalEntries(entries: JournalInput[]) {
  if (entries.length === 0) return [];

  const results = await prisma.$transaction(
    entries.map((e) =>
      prisma.journalEntry.create({
        data: {
          entryDate: e.entryDate,
          debitAccount: e.debitAccount,
          debitAmount: e.debitAmount,
          creditAccount: e.creditAccount,
          creditAmount: e.creditAmount,
          description: e.description,
          sourceType: e.sourceType,
          sourceId: e.sourceId,
        },
      })
    )
  );

  return results;
}

/**
 * 売上計上時の仕訳生成
 * 借方: 売掛金  / 貸方: 売上高
 */
export async function generateRevenueJournal(revenue: {
  id: string;
  revenueNumber: string;
  revenueDate: Date;
  amount: number;
  taxAmount: number;
}) {
  const totalAmount = revenue.amount + revenue.taxAmount;
  return createJournalEntries([
    {
      entryDate: revenue.revenueDate,
      debitAccount: ACCOUNTS.ACCOUNTS_RECEIVABLE,
      debitAmount: totalAmount,
      creditAccount: ACCOUNTS.SALES,
      creditAmount: totalAmount,
      description: `売上計上 ${revenue.revenueNumber}`,
      sourceType: "REVENUE",
      sourceId: revenue.id,
    },
  ]);
}

/**
 * 仕入計上時の仕訳生成
 * 借方: 仕入高  / 貸方: 買掛金
 */
export async function generatePurchaseJournal(purchase: {
  id: string;
  purchaseNumber: string;
  purchaseDate: Date;
  amount: number;
  freightCost?: number | null;
}) {
  const totalAmount = purchase.amount + (purchase.freightCost ?? 0);
  return createJournalEntries([
    {
      entryDate: purchase.purchaseDate,
      debitAccount: ACCOUNTS.PURCHASES,
      debitAmount: totalAmount,
      creditAccount: ACCOUNTS.ACCOUNTS_PAYABLE,
      creditAmount: totalAmount,
      description: `仕入計上 ${purchase.purchaseNumber}`,
      sourceType: "PURCHASE",
      sourceId: purchase.id,
    },
  ]);
}

/**
 * 経費計上時の仕訳生成
 * 借方: 各経費科目  / 貸方: 未払金
 */
export async function generateExpenseJournal(expense: {
  id: string;
  expenseNumber: string;
  expenseDate: Date;
  totalAmount: number;
  items: { category?: string | null; amount: number; description: string }[];
}) {
  const entries: JournalInput[] = expense.items.map((item) => {
    const accountCode =
      EXPENSE_CATEGORY_MAP[item.category ?? ""] ?? ACCOUNTS.MISC_EXPENSE;
    return {
      entryDate: expense.expenseDate,
      debitAccount: accountCode,
      debitAmount: item.amount,
      creditAccount: ACCOUNTS.ACCRUED_EXPENSES,
      creditAmount: item.amount,
      description: `経費 ${expense.expenseNumber}: ${item.description}`,
      sourceType: "EXPENSE",
      sourceId: expense.id,
    };
  });

  // 明細がない場合は合計額で1仕訳
  if (entries.length === 0) {
    entries.push({
      entryDate: expense.expenseDate,
      debitAccount: ACCOUNTS.MISC_EXPENSE,
      debitAmount: expense.totalAmount,
      creditAccount: ACCOUNTS.ACCRUED_EXPENSES,
      creditAmount: expense.totalAmount,
      description: `経費 ${expense.expenseNumber}`,
      sourceType: "EXPENSE",
      sourceId: expense.id,
    });
  }

  return createJournalEntries(entries);
}

/**
 * 入金消込時の仕訳生成
 * 借方: 普通預金  / 貸方: 売掛金
 */
export async function generatePaymentReceivedJournal(payment: {
  id: string;
  paymentNumber: string;
  paymentDate: Date;
  amount: number;
}) {
  return createJournalEntries([
    {
      entryDate: payment.paymentDate,
      debitAccount: ACCOUNTS.CASH_AND_DEPOSITS,
      debitAmount: payment.amount,
      creditAccount: ACCOUNTS.ACCOUNTS_RECEIVABLE,
      creditAmount: payment.amount,
      description: `入金 ${payment.paymentNumber}`,
      sourceType: "PAYMENT_RECEIVED",
      sourceId: payment.id,
    },
  ]);
}

/**
 * 支払消込時の仕訳生成
 * 借方: 買掛金  / 貸方: 普通預金
 */
export async function generatePaymentPayableJournal(payment: {
  id: string;
  paymentNumber: string;
  paymentDate: Date;
  amount: number;
}) {
  return createJournalEntries([
    {
      entryDate: payment.paymentDate,
      debitAccount: ACCOUNTS.ACCOUNTS_PAYABLE,
      debitAmount: payment.amount,
      creditAccount: ACCOUNTS.CASH_AND_DEPOSITS,
      creditAmount: payment.amount,
      description: `支払 ${payment.paymentNumber}`,
      sourceType: "PAYMENT_PAYABLE",
      sourceId: payment.id,
    },
  ]);
}

// 勘定科目コード→名前の簡易マッピング（CSV出力用）
export const ACCOUNT_NAMES: Record<string, string> = {
  [ACCOUNTS.ACCOUNTS_RECEIVABLE]: "売掛金",
  [ACCOUNTS.CASH_AND_DEPOSITS]: "普通預金",
  [ACCOUNTS.ACCOUNTS_PAYABLE]: "買掛金",
  [ACCOUNTS.ACCRUED_EXPENSES]: "未払金",
  [ACCOUNTS.SALES]: "売上高",
  [ACCOUNTS.PURCHASES]: "仕入高",
  [ACCOUNTS.TRAVEL]: "旅費交通費",
  [ACCOUNTS.ACCOMMODATION]: "宿泊費",
  [ACCOUNTS.ENTERTAINMENT]: "交際費",
  [ACCOUNTS.OFFICE_SUPPLIES]: "事務用品費",
  [ACCOUNTS.CONSUMABLES]: "消耗品費",
  [ACCOUNTS.REPAIRS]: "修繕費",
  [ACCOUNTS.MISC_EXPENSE]: "雑費",
};
