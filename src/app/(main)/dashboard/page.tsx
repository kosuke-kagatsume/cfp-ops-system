"use client";

import { Header } from "@/components/header";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Package,
  Factory,
  Droplets,
  ArrowRight,
  BarChart3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Period = "month" | "quarter" | "year";

type DashboardData = {
  currentMonth: string;
  period: Period;
  revenue: { total: number; prevMonth: number; target: number };
  cost: { total: number; prevMonth: number };
  grossProfit: { total: number; prevMonth: number; margin: number };
  inventory: { totalKg: number; valuationJpy: number; turnover: number };
  production: {
    mr: Array<{ plant: string; produced: number; unit: string; yieldRate: number }>;
    cr: Array<{
      plant: string;
      inputKg: number;
      outputOilKg: number;
      outputResidueKg: number;
      yieldRate: number;
    }>;
  };
  monthlyTrend: Array<{ month: string; revenue: number; cost: number; profit: number }>;
  tankUtilization: Array<{ name: string; percentage: number; plant: string }>;
  pendingApprovals: Array<{
    id: string;
    title: string;
    applicant: string;
    amount: number | null;
    status: string;
  }>;
};

const periodLabels: Record<Period, string> = {
  month: "月次",
  quarter: "四半期",
  year: "年次",
};

const comparisonLabels: Record<Period, string> = {
  month: "前月比",
  quarter: "前四半期比",
  year: "前年比",
};

function formatJpy(n: number) {
  if (n >= 10000000) return `¥${(n / 10000000).toFixed(1)}千万`;
  if (n >= 10000) return `¥${Math.round(n / 10000).toLocaleString()}万`;
  return `¥${n.toLocaleString()}`;
}

function changeRate(current: number, prev: number) {
  if (prev === 0) return { rate: "0.0", isUp: true };
  const rate = ((current - prev) / prev) * 100;
  return { rate: rate.toFixed(1), isUp: rate >= 0 };
}

function formatTrendLabel(key: string, period: Period): string {
  switch (period) {
    case "month": {
      const parts = key.split("-");
      return `${parts[1]}月`;
    }
    case "quarter":
      return key.split("-")[1] ?? key; // "Q1" etc.
    case "year":
      return `${key}年`;
  }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading } = useSWR<DashboardData>(`/api/dashboard?period=${period}`);

  if (isLoading || !data) {
    return (
      <>
        <Header title="経営ダッシュボード" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-text-secondary">ダッシュボードを読み込み中...</span>
        </div>
      </>
    );
  }

  const d = data;
  const pendingApprovals = d.pendingApprovals;
  const compLabel = comparisonLabels[period];

  const revenueChange = changeRate(d.revenue.total, d.revenue.prevMonth);
  const costChange = changeRate(d.cost.total, d.cost.prevMonth);
  const profitChange = changeRate(d.grossProfit.total, d.grossProfit.prevMonth);

  return (
    <>
      <Header title="経営ダッシュボード" />
      <div className="p-4 md:p-6 space-y-6">
        {/* 期間表示 */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">{d.currentMonth}</h2>
            <p className="text-xs text-text-tertiary">経営KPI概要</p>
          </div>
          <div className="flex items-center gap-2">
            {(["month", "quarter", "year"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${period === p ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* 主要KPI 4カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary">売上高</p>
                <p className="text-2xl font-bold text-text mt-1">{formatJpy(d.revenue.total)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {revenueChange.isUp ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span className={`text-xs font-medium ${revenueChange.isUp ? "text-emerald-600" : "text-red-600"}`}>{revenueChange.isUp ? "+" : ""}{revenueChange.rate}%</span>
                  <span className="text-xs text-text-tertiary">{compLabel}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
                <span>目標達成率</span><span>{d.revenue.target > 0 ? Math.round((d.revenue.total / d.revenue.target) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-surface-tertiary rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${d.revenue.target > 0 ? Math.min(100, (d.revenue.total / d.revenue.target) * 100) : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary">仕入高</p>
                <p className="text-2xl font-bold text-text mt-1">{formatJpy(d.cost.total)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {!costChange.isUp ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : <TrendingUp className="w-3 h-3 text-red-500" />}
                  <span className={`text-xs font-medium ${!costChange.isUp ? "text-emerald-600" : "text-red-600"}`}>{costChange.isUp ? "+" : ""}{costChange.rate}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary">粗利</p>
                <p className="text-2xl font-bold text-text mt-1">{formatJpy(d.grossProfit.total)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {profitChange.isUp ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span className={`text-xs font-medium ${profitChange.isUp ? "text-emerald-600" : "text-red-600"}`}>{profitChange.isUp ? "+" : ""}{profitChange.rate}%</span>
                  <span className="text-xs text-text-tertiary">粗利率 {d.grossProfit.margin}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-tertiary">在庫評価額</p>
                <p className="text-2xl font-bold text-text mt-1">{formatJpy(d.inventory.valuationJpy)}</p>
                <p className="text-xs text-text-tertiary mt-1">{(d.inventory.totalKg / 1000).toFixed(0)}t / 回転率 {d.inventory.turnover}ヶ月</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 売上推移チャート */}
          <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5">
            <h3 className="text-sm font-medium text-text mb-4">売上・仕入・粗利 推移</h3>
            {d.monthlyTrend.length > 0 ? (
              <>
                <div className="flex items-end gap-3 h-40">
                  {d.monthlyTrend.map((m) => {
                    const maxVal = Math.max(...d.monthlyTrend.map((t) => Math.max(t.revenue, 1)));
                    const revenueH = (m.revenue / maxVal) * 100;
                    const costH = (m.cost / maxVal) * 100;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end gap-0.5 h-32">
                          <div className="flex-1 bg-blue-200 rounded-t" style={{ height: `${revenueH}%` }} title={`売上: ¥${m.revenue.toLocaleString()}`} />
                          <div className="flex-1 bg-orange-200 rounded-t" style={{ height: `${costH}%` }} title={`仕入: ¥${m.cost.toLocaleString()}`} />
                        </div>
                        <span className="text-xs text-text-tertiary">{formatTrendLabel(m.month, period)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-200 rounded" />売上</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-200 rounded" />仕入</div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-text-tertiary">データなし</div>
            )}
          </div>

          {/* 承認待ち */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-medium text-text">承認待ち</h3>
              <span className="ml-auto bg-warning/10 text-warning text-xs font-bold px-2 py-0.5 rounded-full">{pendingApprovals.length}件</span>
            </div>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 4).map((item) => (
                <Link key={item.id} href="/approvals"
                  className="flex items-center gap-3 p-2.5 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                  <div className="w-2 h-2 bg-warning rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{item.title}</p>
                    <p className="text-xs text-text-tertiary">{item.applicant}</p>
                  </div>
                  {item.amount && <span className="text-xs font-medium text-text">¥{(item.amount / 10000).toFixed(0)}万</span>}
                </Link>
              ))}
              {pendingApprovals.length === 0 && (
                <p className="text-xs text-text-tertiary text-center py-4">承認待ちの案件はありません</p>
              )}
            </div>
            <Link href="/approvals" className="flex items-center justify-center gap-1 mt-3 text-xs text-primary-600 hover:underline">
              すべて見る<ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* MR生産実績 */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Factory className="w-5 h-5 text-text-secondary" />
              <h3 className="text-sm font-medium text-text">MR事業部 生産実績</h3>
            </div>
            {d.production.mr.length > 0 ? (
              <div className="space-y-3">
                {d.production.mr.map((p) => (
                  <div key={p.plant} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-text-secondary">{p.plant}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-text">{(p.produced / 1000).toFixed(0)}t</span>
                        <span className="text-text-tertiary">歩留 {p.yieldRate}%</span>
                      </div>
                      <div className="h-2 bg-surface-tertiary rounded-full">
                        <div className="h-2 bg-primary-500 rounded-full" style={{ width: `${(p.produced / 50000) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-tertiary text-center py-4">生産実績データなし</p>
            )}
          </div>

          {/* CR生産実績 */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-5 h-5 text-text-secondary" />
              <h3 className="text-sm font-medium text-text">CR事業部 油化実績</h3>
            </div>
            {d.production.cr.length > 0 ? (
              <div className="space-y-3">
                {d.production.cr.map((p) => (
                  <div key={p.plant}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">{p.plant}</span>
                      <span className="text-xs font-medium text-text">収率 {p.yieldRate}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-blue-600">投入</p>
                        <p className="font-medium text-blue-800">{(p.inputKg / 1000).toFixed(0)}t</p>
                      </div>
                      <div className="p-2 bg-amber-50 rounded">
                        <p className="text-amber-600">生成油</p>
                        <p className="font-medium text-amber-800">{(p.outputOilKg / 1000).toFixed(1)}t</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded">
                        <p className="text-gray-600">残渣</p>
                        <p className="font-medium text-gray-800">{(p.outputResidueKg / 1000).toFixed(1)}t</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-tertiary text-center py-4">油化実績データなし</p>
            )}
          </div>
        </div>

        {/* タンク稼働率 */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-5 h-5 text-text-secondary" />
            <h3 className="text-sm font-medium text-text">タンク稼働率</h3>
            <Link href="/cr/tanks" className="ml-auto text-xs text-primary-600 hover:underline">
              詳細 →
            </Link>
          </div>
          {d.tankUtilization.length > 0 ? (
            <div className="flex items-end gap-4">
              {d.tankUtilization.map((tank) => (
                <div key={tank.name} className="flex-1 text-center">
                  <div className="relative h-24 bg-surface-tertiary rounded-lg mx-auto w-full max-w-[60px] overflow-hidden">
                    <div className={`absolute bottom-0 left-0 right-0 rounded-b-lg ${
                      tank.percentage >= 80 ? "bg-red-200" : tank.percentage <= 20 ? "bg-amber-200" : "bg-blue-200"
                    }`} style={{ height: `${tank.percentage}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-text">{tank.percentage}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{tank.name}</p>
                  <p className="text-xs text-text-tertiary">{tank.plant}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-tertiary text-center py-4">タンクデータなし</p>
          )}
        </div>
      </div>
    </>
  );
}
