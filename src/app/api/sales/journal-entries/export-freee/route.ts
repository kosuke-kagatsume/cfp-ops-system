import { prisma } from "@/lib/db";
import { ACCOUNT_NAMES } from "@/lib/journal";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

/** CSVフィールドのエスケープ（ダブルクォート含む文字列対応） */
function csvEscape(val: string): string {
  if (val.includes('"') || val.includes(",") || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return `"${val}"`;
}

/**
 * Freee会計 仕訳インポート形式のCSV出力
 * POST /api/sales/journal-entries/export-freee
 * body: { from: "2026-01-01", to: "2026-03-31" }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to parameters are required" },
      { status: 400 }
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json(
      { error: "from and to must be valid dates (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  toDate.setHours(23, 59, 59, 999);

  const entries = await prisma.journalEntry.findMany({
    where: {
      entryDate: { gte: fromDate, lte: toDate },
    },
    orderBy: { entryDate: "asc" },
  });

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No journal entries found for the specified period" },
      { status: 404 }
    );
  }

  // Look up AccountTitle freeeCodes for mapping
  const accountTitles = await prisma.accountTitle.findMany({
    where: { isActive: true },
  });
  const codeToFreee: Record<string, string> = {};
  const codeToName: Record<string, string> = {};
  for (const at of accountTitles) {
    if (at.freeeCode) codeToFreee[at.code] = at.freeeCode;
    codeToName[at.code] = at.name;
  }

  // Freee仕訳インポートCSVヘッダー
  const header = [
    "取引日",
    "借方勘定科目",
    "借方補助科目",
    "借方税区分",
    "借方金額",
    "借方税額",
    "貸方勘定科目",
    "貸方補助科目",
    "貸方税区分",
    "貸方金額",
    "貸方税額",
    "摘要",
  ].join(",");

  const rows = entries.map((entry) => {
    const date = entry.entryDate;
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

    const debitName =
      codeToFreee[entry.debitAccount] ??
      codeToName[entry.debitAccount] ??
      ACCOUNT_NAMES[entry.debitAccount] ??
      entry.debitAccount;
    const creditName =
      codeToFreee[entry.creditAccount] ??
      codeToName[entry.creditAccount] ??
      ACCOUNT_NAMES[entry.creditAccount] ??
      entry.creditAccount;

    return [
      dateStr,                                     // 取引日
      csvEscape(debitName),                        // 借方勘定科目
      "",                                          // 借方補助科目
      '"対象外"',                                   // 借方税区分
      String(Math.round(entry.debitAmount)),        // 借方金額
      "0",                                         // 借方税額
      csvEscape(creditName),                       // 貸方勘定科目
      "",                                          // 貸方補助科目
      '"対象外"',                                   // 貸方税区分
      String(Math.round(entry.creditAmount)),       // 貸方金額
      "0",                                         // 貸方税額
      csvEscape(entry.description ?? ""),           // 摘要
    ].join(",");
  });

  const csv = [header, ...rows].join("\r\n");

  // Mark entries as exported
  await prisma.journalEntry.updateMany({
    where: {
      id: { in: entries.map((e) => e.id) },
    },
    data: {
      isExported: true,
      exportedAt: new Date(),
    },
  });

  await createAuditLog({
    action: "CREATE",
    tableName: "JournalEntry_FreeeExport",
    recordId: "bulk",
    newData: { from, to, count: entries.length },
  });

  // UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const csvWithBom = bom + csv;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(csvWithBom);

  const fromStr = from.replace(/[^0-9]/g, "");
  const toStr = to.replace(/[^0-9]/g, "");

  return new Response(encoded, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="freee_journal_${fromStr}_${toStr}.csv"`,
    },
  });
});
