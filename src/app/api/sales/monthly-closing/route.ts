import { prisma } from "@/lib/db";
import {
  preCheckMonthlyClosing,
  executeMonthlyClosing,
  reopenMonthlyClosing,
} from "@/lib/monthly-closing";
import { validateBody } from "@/lib/validate";
import { monthlyClosingAction } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

/**
 * GET: 月次締め一覧 or プレチェック
 * ?check=true&year=2026&month=3 → プレチェック
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const check = searchParams.get("check");

  if (check === "true") {
    const year = parseInt(searchParams.get("year") ?? "0");
    const month = parseInt(searchParams.get("month") ?? "0");

    if (!year || !month) {
      return NextResponse.json(
        { error: "year and month are required" },
        { status: 400 }
      );
    }

    const result = await preCheckMonthlyClosing(year, month);
    return NextResponse.json(result, { headers: cacheHeaders("TRANSACTION") });
  }

  // 一覧を返す（直近12ヶ月分を生成して返す）
  const closings = await prisma.monthlyClosing.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      closedByUser: { select: { name: true } },
    },
  });

  // 既存データがない月もカードとして表示するため12ヶ月分を生成
  const now = new Date();
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const existing = closings.find(
      (c) => c.year === year && c.month === month
    );
    months.push(
      existing ?? {
        id: `placeholder-${year}-${month}`,
        companyId: "CFP",
        year,
        month,
        isClosed: false,
        closedAt: null,
        closedBy: null,
        closedByUser: null,
        note: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  return NextResponse.json(months, { headers: cacheHeaders("TRANSACTION") });
});

/**
 * POST: 月次締め実行 or 締め解除
 * body.action = "close" + body.year, body.month → 締め実行
 * body.action = "reopen" + body.year, body.month → 締め解除
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, monthlyClosingAction);
  if ("error" in result) return result.error;
  const body = result.data;
  const { year, month, action } = body;

  if (!year || !month || !action) {
    return NextResponse.json(
      { error: "year, month, and action are required" },
      { status: 400 }
    );
  }

  if (action === "close") {
    const result = await executeMonthlyClosing(year, month);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (action === "reopen") {
    const result = await reopenMonthlyClosing(year, month);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
