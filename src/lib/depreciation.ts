// =============================================================================
// 減価償却計算ロジック
// 定額法・定率法に対応、月割計算あり
// =============================================================================
import { prisma } from "./db";

type DepreciationScheduleItem = {
  fiscalYear: number;
  amount: number;
  accumulated: number;
  bookValue: number;
};

/**
 * 定額法による年間償却額計算
 * (取得価額 - 残存価額) / 耐用年数
 */
export function calcStraightLine(
  acquisitionCost: number,
  residualValue: number,
  usefulLife: number
): number {
  return Math.floor((acquisitionCost - residualValue) / usefulLife);
}

/**
 * 定率法による年間償却額計算
 * 期首帳簿価額 × 償却率
 */
export function calcDecliningBalance(
  bookValue: number,
  depreciationRate: number,
  residualValue: number
): number {
  const amount = Math.floor(bookValue * depreciationRate);
  // 帳簿価額が残存価額を下回らないよう調整
  return Math.min(amount, Math.max(0, bookValue - residualValue));
}

/**
 * 月割計算
 * 期中取得の場合、取得月から期末までの月数で按分
 */
export function calcMonthlyProration(
  annualAmount: number,
  monthsInService: number
): number {
  return Math.floor((annualAmount * monthsInService) / 12);
}

/**
 * 減価償却スケジュールを生成（プレビュー用）
 * 耐用年数分のシミュレーション
 */
export function generateDepreciationSchedule(params: {
  acquisitionCost: number;
  residualValue: number;
  usefulLife: number;
  method: "STRAIGHT_LINE" | "DECLINING_BALANCE";
  depreciationRate?: number;
  acquisitionDate: Date;
}): DepreciationScheduleItem[] {
  const {
    acquisitionCost,
    residualValue,
    usefulLife,
    method,
    depreciationRate,
    acquisitionDate,
  } = params;

  const schedule: DepreciationScheduleItem[] = [];
  let accumulated = 0;
  let bookValue = acquisitionCost;
  const startYear = acquisitionDate.getFullYear();
  const startMonth = acquisitionDate.getMonth() + 1; // 1-12

  for (let year = 0; year <= usefulLife; year++) {
    if (bookValue <= residualValue) break;

    let annualAmount: number;

    if (method === "STRAIGHT_LINE") {
      annualAmount = calcStraightLine(
        acquisitionCost,
        residualValue,
        usefulLife
      );
    } else {
      annualAmount = calcDecliningBalance(
        bookValue,
        depreciationRate ?? 2 / usefulLife,
        residualValue
      );
    }

    // 初年度の月割計算（取得月〜3月 = 期末が3月の場合）
    if (year === 0 && startMonth > 1) {
      const monthsInService = 13 - startMonth; // 取得月〜12月
      annualAmount = calcMonthlyProration(annualAmount, monthsInService);
    }

    // 最終年は残存価額まで
    if (bookValue - annualAmount < residualValue) {
      annualAmount = bookValue - residualValue;
    }

    if (annualAmount <= 0) break;

    accumulated += annualAmount;
    bookValue -= annualAmount;

    schedule.push({
      fiscalYear: startYear + year,
      amount: annualAmount,
      accumulated,
      bookValue,
    });
  }

  return schedule;
}

/**
 * 指定期間の減価償却一括計算・記録
 */
export async function executeDepreciation(fiscalYear: number) {
  const assets = await prisma.asset.findMany({
    where: {
      isDisposed: false,
      bookValue: { gt: 1 }, // 残存価額以下は償却しない
    },
  });

  const results = [];

  for (const asset of assets) {
    // 既に当年度の償却済みかチェック
    const existing = await prisma.assetDepreciation.findUnique({
      where: {
        assetId_fiscalYear_fiscalMonth: {
          assetId: asset.id,
          fiscalYear,
          fiscalMonth: 0, // 年次一括は0
        },
      },
    });

    if (existing) continue;

    let annualAmount: number;

    if (asset.depreciationMethod === "DECLINING_BALANCE") {
      const rate = asset.depreciationRate ?? 2 / asset.usefulLife;
      annualAmount = calcDecliningBalance(
        asset.bookValue,
        rate,
        asset.residualValue
      );
    } else {
      annualAmount = calcStraightLine(
        asset.acquisitionCost,
        asset.residualValue,
        asset.usefulLife
      );
    }

    // 取得初年度の月割
    const acquYear = asset.acquisitionDate.getFullYear();
    if (acquYear === fiscalYear) {
      const startMonth = asset.acquisitionDate.getMonth() + 1;
      const monthsInService = 13 - startMonth;
      annualAmount = calcMonthlyProration(annualAmount, monthsInService);
    }

    // 帳簿価額が残存価額を下回らないよう調整
    if (asset.bookValue - annualAmount < asset.residualValue) {
      annualAmount = Math.max(0, asset.bookValue - asset.residualValue);
    }

    if (annualAmount <= 0) continue;

    const newAccumulated = asset.accumulatedDepreciation + annualAmount;
    const newBookValue = asset.bookValue - annualAmount;

    await prisma.$transaction([
      prisma.assetDepreciation.create({
        data: {
          assetId: asset.id,
          fiscalYear,
          fiscalMonth: 0,
          depreciationAmount: annualAmount,
          accumulatedAmount: newAccumulated,
          bookValueAfter: newBookValue,
        },
      }),
      prisma.asset.update({
        where: { id: asset.id },
        data: {
          accumulatedDepreciation: newAccumulated,
          bookValue: newBookValue,
        },
      }),
    ]);

    results.push({
      assetNumber: asset.assetNumber,
      name: asset.name,
      depreciationAmount: annualAmount,
      bookValueAfter: newBookValue,
    });
  }

  return results;
}
