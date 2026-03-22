import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { businessCardCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";
import { extractBusinessCardData } from "@/lib/ocr";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { personName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.businessCard.findMany({
      where,
      include: {
        partner: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.businessCard.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(items, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const contentType = request.headers.get("content-type") ?? "";

  // OCRモード: multipart/form-dataで画像を受信
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "画像ファイルが必要です" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageBase64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // OCR実行
    const ocrResult = await extractBusinessCardData(imageBase64, mimeType);

    // データURI形式で画像を保存（小さい名刺画像なので問題なし）
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    const record = await prisma.businessCard.create({
      data: {
        companyName: ocrResult.companyName,
        department: ocrResult.department,
        position: ocrResult.position,
        personName: ocrResult.personName ?? "不明",
        email: ocrResult.email,
        phone: ocrResult.phone,
        mobile: ocrResult.mobile,
        fax: ocrResult.fax,
        address: ocrResult.address,
        website: ocrResult.website,
        imageUrl,
        status: "NEW",
      },
    });

    await createAuditLog({ action: "CREATE", tableName: "BusinessCard", recordId: record.id, newData: record });

    return NextResponse.json({ ...record, ocrResult }, { status: 201 });
  }

  // 手動登録モード: JSON
  const result = await validateBody(request, businessCardCreate);
  if ("error" in result) return result.error;
  const body = result.data as Record<string, unknown>;

  const record = await prisma.businessCard.create({
    data: {
      companyName: body.companyName as string | undefined,
      department: body.department as string | undefined,
      position: body.position as string | undefined,
      personName: body.personName as string,
      email: body.email as string | undefined,
      phone: body.phone as string | undefined,
      mobile: body.mobile as string | undefined,
      fax: body.fax as string | undefined,
      address: body.address as string | undefined,
      website: body.website as string | undefined,
      imageUrl: body.imageUrl as string | undefined,
      note: body.note as string | undefined,
      partnerId: body.partnerId as string | undefined,
      status: (body.status as string) ?? "NEW",
    },
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "BusinessCard", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
