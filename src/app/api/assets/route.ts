import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET: 固定資産一覧
 */
export async function GET(request: NextRequest) {
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

  return NextResponse.json(assets);
}

/**
 * POST: 固定資産登録
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

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

  return NextResponse.json(asset, { status: 201 });
}

/**
 * PUT: 固定資産更新
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (data.acquisitionDate) {
    data.acquisitionDate = new Date(data.acquisitionDate);
  }

  const asset = await prisma.asset.update({
    where: { id },
    data,
  });

  return NextResponse.json(asset);
}

/**
 * DELETE: 固定資産除却
 */
export async function DELETE(request: NextRequest) {
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
}
