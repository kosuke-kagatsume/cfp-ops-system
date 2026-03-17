import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/file-storage";
import { extractReceiptData } from "@/lib/ocr";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET: 電子帳簿保存データ一覧 + 検索3要件対応
 * ?dateFrom=2026-01-01&dateTo=2026-03-31 → 日付範囲
 * ?amountFrom=1000&amountTo=50000 → 金額範囲
 * ?partner=xxx → 取引先名
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const amountFrom = searchParams.get("amountFrom");
  const amountTo = searchParams.get("amountTo");
  const partner = searchParams.get("partner");
  const docType = searchParams.get("type");

  const where: Record<string, unknown> = {};

  // 検索要件1: 日付範囲
  if (dateFrom || dateTo) {
    where.transactionDate = {};
    if (dateFrom) {
      (where.transactionDate as Record<string, unknown>).gte = new Date(
        dateFrom
      );
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      (where.transactionDate as Record<string, unknown>).lte = to;
    }
  }

  // 検索要件2: 金額範囲
  if (amountFrom || amountTo) {
    where.amount = {};
    if (amountFrom) {
      (where.amount as Record<string, unknown>).gte = parseFloat(amountFrom);
    }
    if (amountTo) {
      (where.amount as Record<string, unknown>).lte = parseFloat(amountTo);
    }
  }

  // 検索要件3: 取引先名
  if (partner) {
    where.partnerName = { contains: partner, mode: "insensitive" };
  }

  if (docType) {
    where.documentType = docType;
  }

  const documents = await prisma.electronicDocument.findMany({
    where,
    orderBy: { transactionDate: "desc" },
  });

  return NextResponse.json(documents);
}

/**
 * POST: 電子帳簿保存 + OCR
 * multipart/form-data: file, transactionDate, amount, partnerName, documentType
 * fileがある場合はOCRを実行して自動入力
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // ファイルアップロード + OCR
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    // アップロード
    const uploadResult = await uploadFile(file, `electronic-docs/${Date.now()}_${file.name}`);

    // OCR実行（画像ファイルの場合）
    let ocrData = null;
    if (file.type.startsWith("image/")) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      ocrData = await extractReceiptData(base64, file.type);
    }

    // フォームデータから手動入力値を取得（OCR結果より優先）
    const transactionDate =
      (formData.get("transactionDate") as string) ||
      ocrData?.transactionDate ||
      new Date().toISOString().slice(0, 10);

    const amount =
      parseFloat((formData.get("amount") as string) || "") ||
      ocrData?.amount ||
      0;

    const partnerName =
      (formData.get("partnerName") as string) ||
      ocrData?.partnerName ||
      "";

    const documentType =
      (formData.get("documentType") as string) ||
      ocrData?.documentType ||
      "領収書";

    const doc = await prisma.electronicDocument.create({
      data: {
        transactionDate: new Date(transactionDate),
        amount,
        partnerName,
        documentType,
        originalFileName: file.name,
        filePath: uploadResult.url,
        mimeType: uploadResult.contentType,
        fileSize: uploadResult.size,
        ocrData: ocrData ? (ocrData as Record<string, unknown>) : undefined,
        note: (formData.get("note") as string) || null,
      },
    });

    return NextResponse.json({ document: doc, ocrData }, { status: 201 });
  }

  // JSON形式（手動登録）
  const body = await request.json();

  const doc = await prisma.electronicDocument.create({
    data: {
      transactionDate: new Date(body.transactionDate),
      amount: body.amount,
      partnerName: body.partnerName,
      documentType: body.documentType ?? "領収書",
      originalFileName: body.originalFileName ?? "-",
      filePath: body.filePath ?? "",
      mimeType: body.mimeType ?? null,
      fileSize: body.fileSize ?? null,
      ocrData: body.ocrData ?? null,
      relatedTransactionType: body.relatedTransactionType ?? null,
      relatedTransactionId: body.relatedTransactionId ?? null,
      note: body.note ?? null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

/**
 * DELETE: 電子帳簿保存データ削除
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.electronicDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
