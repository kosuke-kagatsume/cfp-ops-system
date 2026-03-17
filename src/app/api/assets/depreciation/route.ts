import { prisma } from "@/lib/db";
import { executeDepreciation, generateDepreciationSchedule } from "@/lib/depreciation";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET: 減価償却スケジュール一覧
 * ?assetId=xxx → 特定資産のスケジュール
 * ?year=2026 → 年度の全償却記録
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("assetId");
  const year = searchParams.get("year");

  if (assetId) {
    // 特定資産の償却スケジュール（シミュレーション）
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const schedule = generateDepreciationSchedule({
      acquisitionCost: asset.acquisitionCost,
      residualValue: asset.residualValue,
      usefulLife: asset.usefulLife,
      method: asset.depreciationMethod as "STRAIGHT_LINE" | "DECLINING_BALANCE",
      depreciationRate: asset.depreciationRate ?? undefined,
      acquisitionDate: asset.acquisitionDate,
    });

    // 実績データ
    const actuals = await prisma.assetDepreciation.findMany({
      where: { assetId },
      orderBy: { fiscalYear: "asc" },
    });

    return NextResponse.json({ asset, schedule, actuals });
  }

  if (year) {
    // 特定年度の全償却記録
    const records = await prisma.assetDepreciation.findMany({
      where: { fiscalYear: parseInt(year) },
      include: {
        asset: { select: { assetNumber: true, name: true, category: true } },
      },
      orderBy: { asset: { assetNumber: "asc" } },
    });
    return NextResponse.json(records);
  }

  // デフォルト: 全資産一覧
  const assets = await prisma.asset.findMany({
    where: { isDisposed: false },
    include: { depreciations: { orderBy: { fiscalYear: "desc" }, take: 1 } },
    orderBy: { assetNumber: "asc" },
  });

  return NextResponse.json(assets);
}

/**
 * POST: 減価償却一括計算
 * body.fiscalYear: number
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const fiscalYear = body.fiscalYear;

  if (!fiscalYear) {
    return NextResponse.json(
      { error: "fiscalYear is required" },
      { status: 400 }
    );
  }

  const results = await executeDepreciation(fiscalYear);

  return NextResponse.json({
    success: true,
    processedCount: results.length,
    results,
  });
}
