import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { assetCreate, assetUpdate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

/**
 * GET: 固定資産一覧
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const disposed = searchParams.get("disposed");

  const where: Record<string, unknown> = {};

  if (category) {
    where.category = category;
  }
  if (disposed === "true") {
    where.isDisposed = true;
  } else if (disposed !== "all") {
    where.isDisposed = false;
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      depreciations: { orderBy: { fiscalYear: "desc" }, take: 1 },
    },
    orderBy: { assetNumber: "asc" },
  });

  return NextResponse.json(assets, { headers: cacheHeaders("TRANSACTION") });
});

/**
 * POST: 固定資産登録
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, assetCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  // 自動採番
  const last = await prisma.asset.findFirst({
    orderBy: { assetNumber: "desc" },
  });
  const nextNum = last
    ? String(parseInt(last.assetNumber.replace(/\D/g, "") || "0") + 1).padStart(5, "0")
    : "00001";
  const assetNumber = `FA-${nextNum}`;

  const asset = await prisma.asset.create({
    data: {
      assetNumber,
      name: body.name,
      category: body.category,
      acquisitionDate: new Date(body.acquisitionDate),
      acquisitionCost: body.acquisitionCost,
      residualValue: body.residualValue ?? 1,
      usefulLife: body.usefulLife,
      depreciationMethod: body.depreciationMethod ?? "STRAIGHT_LINE",
      depreciationRate: body.depreciationRate ?? null,
      bookValue: body.acquisitionCost, // 初期帳簿価額 = 取得価額
      location: body.location ?? null,
      note: body.note ?? null,
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "Asset", recordId: asset.id, newData: asset });

  return NextResponse.json(asset, { status: 201 });
});

/**
 * PUT: 固定資産更新
 */
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const raw = await request.json();
  const { id, ...rest } = raw;
  const parsed = assetUpdate.safeParse(rest);
  if (!parsed.success) {
    const messages = (parsed.error.issues as any[]).map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    return NextResponse.json(
      { error: "バリデーションエラー", details: messages },
      { status: 400 }
    );
  }
  const data = parsed.data as any;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (data.acquisitionDate) {
    data.acquisitionDate = new Date(data.acquisitionDate as string);
  }

  const asset = await prisma.asset.update({
    where: { id },
    data,
  });

  return NextResponse.json(asset);
});

/**
 * DELETE: 固定資産除却
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      isDisposed: true,
      disposedAt: new Date(),
    },
  });

  return NextResponse.json(asset);
});
