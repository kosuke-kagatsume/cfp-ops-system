import { prisma } from "@/lib/db";
import { generateZenginFB } from "@/lib/zengin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET: 支払予定一覧（未払買掛金 + 承認済み経費）
 */
export async function GET() {
  // 未消込の買掛金（PaymentPayable と紐付かない Purchase）
  const unpaidPurchases = await prisma.purchase.findMany({
    where: {
      status: { in: ["CONFIRMED", "RECEIVED"] },
    },
    include: {
      supplier: {
        select: {
          id: true,
          code: true,
          name: true,
          nameKana: true,
          bankCode: true,
          bankName: true,
          branchCode: true,
          branchName: true,
          accountType: true,
          accountNumber: true,
          accountHolder: true,
        },
      },
      product: { include: { name: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });

  // 承認済み・未払い経費
  const approvedExpenses = await prisma.expense.findMany({
    where: { status: "APPROVED" },
    include: { items: true },
    orderBy: { expenseDate: "desc" },
  });

  // 結果を統合
  const transferItems = [
    ...unpaidPurchases.map((p) => ({
      id: p.id,
      type: "PURCHASE" as const,
      number: p.purchaseNumber,
      date: p.purchaseDate,
      supplierName: p.supplier.name,
      supplierCode: p.supplier.code,
      amount: p.amount + (p.freightCost ?? 0),
      bankCode: p.supplier.bankCode,
      bankName: p.supplier.bankName,
      branchCode: p.supplier.branchCode,
      branchName: p.supplier.branchName,
      accountType: p.supplier.accountType,
      accountNumber: p.supplier.accountNumber,
      accountHolder: p.supplier.accountHolder ?? p.supplier.nameKana,
      hasBankInfo: !!(p.supplier.bankCode && p.supplier.branchCode && p.supplier.accountNumber),
    })),
    ...approvedExpenses.map((e) => ({
      id: e.id,
      type: "EXPENSE" as const,
      number: e.expenseNumber,
      date: e.expenseDate,
      supplierName: e.applicant,
      supplierCode: "-",
      amount: e.totalAmount,
      bankCode: null as string | null,
      bankName: null as string | null,
      branchCode: null as string | null,
      branchName: null as string | null,
      accountType: null as string | null,
      accountNumber: null as string | null,
      accountHolder: null as string | null,
      hasBankInfo: false,
    })),
  ];

  return NextResponse.json(transferItems);
}

/**
 * POST: 全銀FBファイル生成
 * body.ids: string[] - 振込対象のID
 * body.transferDate: string - 振込指定日（MMDD）
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const ids: string[] = body.ids ?? [];
  const transferDate: string = body.transferDate ?? "";

  if (ids.length === 0) {
    return NextResponse.json({ error: "ids is required" }, { status: 400 });
  }
  if (!transferDate || transferDate.length !== 4) {
    return NextResponse.json(
      { error: "transferDate (MMDD format) is required" },
      { status: 400 }
    );
  }

  // 振込対象の仕入先データを取得
  const purchases = await prisma.purchase.findMany({
    where: { id: { in: ids } },
    include: {
      supplier: {
        select: {
          bankCode: true,
          branchCode: true,
          accountType: true,
          accountNumber: true,
          accountHolder: true,
          nameKana: true,
        },
      },
    },
  });

  // 銀行情報がない取引先はスキップ
  const validRecords = purchases
    .filter(
      (p) =>
        p.supplier.bankCode &&
        p.supplier.branchCode &&
        p.supplier.accountNumber
    )
    .map((p) => ({
      bankCode: p.supplier.bankCode!,
      branchCode: p.supplier.branchCode!,
      accountType: p.supplier.accountType ?? "1",
      accountNumber: p.supplier.accountNumber!,
      accountHolder: p.supplier.accountHolder ?? p.supplier.nameKana ?? "",
      amount: p.amount + (p.freightCost ?? 0),
    }));

  if (validRecords.length === 0) {
    return NextResponse.json(
      { error: "振込先の銀行口座情報が登録されていません" },
      { status: 400 }
    );
  }

  // CFP の振込元口座情報
  const fbData = generateZenginFB(validRecords, {
    companyCode: "0000000001",
    companyName: "ｶﾌﾞｼｷｶﾞｲｼｬ ｼｰｴﾌﾋﾟｰ",
    transferDate,
    bankCode: "0005",        // 三菱UFJ（仮）
    branchCode: "001",       // 支店（仮）
    accountType: "1",        // 普通預金
    accountNumber: "1234567", // 口座番号（仮）
  });

  const encoder = new TextEncoder();
  const encoded = encoder.encode(fbData);

  return new Response(encoded, {
    headers: {
      "Content-Type": "text/plain; charset=shift_jis",
      "Content-Disposition": `attachment; filename="zengin_transfer_${transferDate}.txt"`,
    },
  });
}
