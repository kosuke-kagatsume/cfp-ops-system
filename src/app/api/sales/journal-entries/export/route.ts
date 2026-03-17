import { prisma } from "@/lib/db";
import { ACCOUNT_NAMES } from "@/lib/journal";
import { NextRequest, NextResponse } from "next/server";

/**
 * 弥生会計仕訳日記帳インポート形式のCSV出力
 * GET /api/sales/journal-entries/export?from=2026-01-01&to=2026-03-31&format=yayoi
 */
export async function GET(request: NextRequest) {
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

  // 弥生会計 仕訳日記帳インポートCSV形式
  // ヘッダー行
  const header = [
    "識別フラグ",
    "伝票No.",
    "決算",
    "取引日付",
    "借方勘定科目",
    "借方補助科目",
    "借方部門",
    "借方税区分",
    "借方金額",
    "借方税金額",
    "貸方勘定科目",
    "貸方補助科目",
    "貸方部門",
    "貸方税区分",
    "貸方金額",
    "貸方税金額",
    "摘要",
    "番号",
    "期日",
    "タイプ",
    "生成元",
    "仕訳メモ",
    "付箋1",
    "付箋2",
    "調整",
  ].join(",");

  // Look up AccountTitle yayoiCodes for mapping
  const accountTitles = await prisma.accountTitle.findMany({
    where: { isActive: true },
  });
  const codeToYayoi: Record<string, string> = {};
  const codeToName: Record<string, string> = {};
  for (const at of accountTitles) {
    if (at.yayoiCode) codeToYayoi[at.code] = at.yayoiCode;
    codeToName[at.code] = at.name;
  }

  const rows = entries.map((entry, index) => {
    const date = entry.entryDate;
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

    const debitName =
      codeToName[entry.debitAccount] ??
      ACCOUNT_NAMES[entry.debitAccount] ??
      entry.debitAccount;
    const creditName =
      codeToName[entry.creditAccount] ??
      ACCOUNT_NAMES[entry.creditAccount] ??
      entry.creditAccount;

    return [
      "2111",                                   // 識別フラグ (仕訳データ)
      String(index + 1),                        // 伝票No.
      "",                                       // 決算
      dateStr,                                  // 取引日付
      `"${debitName}"`,                         // 借方勘定科目
      "",                                       // 借方補助科目
      "",                                       // 借方部門
      '"対象外"',                                // 借方税区分
      String(Math.round(entry.debitAmount)),     // 借方金額
      "0",                                      // 借方税金額
      `"${creditName}"`,                        // 貸方勘定科目
      "",                                       // 貸方補助科目
      "",                                       // 貸方部門
      '"対象外"',                                // 貸方税区分
      String(Math.round(entry.creditAmount)),    // 貸方金額
      "0",                                      // 貸方税金額
      `"${entry.description ?? ""}"`,           // 摘要
      "",                                       // 番号
      "",                                       // 期日
      "0",                                      // タイプ
      '"CFP Ops"',                              // 生成元
      "",                                       // 仕訳メモ
      "0",                                      // 付箋1
      "0",                                      // 付箋2
      '"NO"',                                   // 調整
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

  // BOM for Excel compatibility + Shift_JIS would be ideal but
  // using UTF-8 with BOM for broader compatibility
  const bom = "\uFEFF";
  const csvWithBom = bom + csv;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(csvWithBom);

  const fromStr = from.replace(/-/g, "");
  const toStr = to.replace(/-/g, "");

  return new Response(encoded, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="yayoi_journal_${fromStr}_${toStr}.csv"`,
    },
  });
}
