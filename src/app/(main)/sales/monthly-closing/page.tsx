"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Lock, Unlock, ArrowRight, CheckCircle, Loader2, AlertTriangle, XCircle, BarChart3 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MonthlyClosing = {
  id: string;
  companyId: string;
  year: number;
  month: number;
  isClosed: boolean;
  closedAt: string | null;
  closedBy: string | null;
  closedByUser: { name: string | null } | null;
  note: string | null;
};

type PreCheckResult = {
  canClose: boolean;
  warnings: string[];
  errors: string[];
  summary: {
    unreconciledPayments: number;
    unreconciledAmount: number;
    journalBalance: { debit: number; credit: number; balanced: boolean };
    revenueCount: number;
    revenueAmount: number;
    purchaseCount: number;
    purchaseAmount: number;
  };
};

export default function MonthlyClosingPage() {
  const { showToast } = useToast();
  const [showPreCheck, setShowPreCheck] = useState<{ year: number; month: number } | null>(null);
  const [preCheckResult, setPreCheckResult] = useState<PreCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const { data: closings, isLoading, mutate } = useSWR<MonthlyClosing[]>(
    "/api/sales/monthly-closing",
    fetcher
  );

  const formatYearMonth = (year: number, month: number) =>
    `${year}年${month}月`;

  const handlePreCheck = async (year: number, month: number) => {
    setShowPreCheck({ year, month });
    setIsChecking(true);
    setPreCheckResult(null);
    try {
      const res = await fetch(
        `/api/sales/monthly-closing?check=true&year=${year}&month=${month}`
      );
      const result = await res.json();
      setPreCheckResult(result);
    } catch {
      showToast("プレチェックに失敗しました", "error");
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = async () => {
    if (!showPreCheck) return;
    setIsClosing(true);
    try {
      const res = await fetch("/api/sales/monthly-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          year: showPreCheck.year,
          month: showPreCheck.month,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`${formatYearMonth(showPreCheck.year, showPreCheck.month)}を締めました`, "success");
        mutate();
        setShowPreCheck(null);
      } else {
        showToast(result.errors?.[0] ?? "締め処理に失敗しました", "error");
      }
    } catch {
      showToast("締め処理に失敗しました", "error");
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopen = async (year: number, month: number) => {
    if (!confirm(`${formatYearMonth(year, month)}の締めを解除しますか？`)) return;
    try {
      const res = await fetch("/api/sales/monthly-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen", year, month }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`${formatYearMonth(year, month)}の締めを解除しました`, "success");
        mutate();
      }
    } catch {
      showToast("締め解除に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="月次締め" />
      <div className="p-4 md:p-6 space-y-4">
        {/* 締めフロー */}
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs font-medium text-text-secondary mb-3">月次締めフロー</p>
          <div className="flex items-center gap-2 flex-wrap">
            {["売上確定", "請求確定", "入金消込確定", "月次更新"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="w-4 h-4 text-text-tertiary" />}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-tertiary rounded-lg border border-border">
                  <CheckCircle className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text font-medium">{step}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {closings?.map((mc) => {
              const isOpen = !mc.isClosed;
              return (
                <div key={mc.id} className={`p-5 rounded-xl border ${isOpen ? "border-primary-300 bg-primary-50/30" : "border-border bg-surface"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isOpen ? <Unlock className="w-5 h-5 text-primary-600" /> : <Lock className="w-5 h-5 text-text-tertiary" />}
                      <h3 className="text-lg font-bold text-text">{formatYearMonth(mc.year, mc.month)}</h3>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${isOpen ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {isOpen ? "オープン" : "クローズ"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <button
                          onClick={() => handlePreCheck(mc.year, mc.month)}
                          className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                          月次締め実行
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReopen(mc.year, mc.month)}
                          className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
                        >
                          締め解除
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-surface border border-border">
                      <p className="text-xs text-text-tertiary mb-1">会社</p>
                      <p className="text-lg font-bold text-text">{mc.companyId}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-border">
                      <p className="text-xs text-text-tertiary mb-1">締め実行者</p>
                      <p className="text-sm text-text">{mc.closedByUser?.name ?? mc.closedBy ?? "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-border">
                      <p className="text-xs text-text-tertiary mb-1">締め実行日</p>
                      <p className="text-sm text-text">{mc.closedAt ? new Date(mc.closedAt).toLocaleDateString("ja-JP") : "-"}</p>
                    </div>
                  </div>
                  {mc.note && (
                    <div className="mt-3 text-xs text-text-secondary">備考: {mc.note}</div>
                  )}
                </div>
              );
            })}
            {(!closings || closings.length === 0) && (
              <div className="text-center py-12 text-sm text-text-tertiary">月次締めデータがありません</div>
            )}
          </div>
        )}
      </div>

      {/* プレチェック結果モーダル */}
      <Modal
        isOpen={!!showPreCheck}
        onClose={() => setShowPreCheck(null)}
        title={showPreCheck ? `月次締めチェック: ${formatYearMonth(showPreCheck.year, showPreCheck.month)}` : ""}
        footer={
          <>
            {preCheckResult?.canClose && (
              <button
                onClick={handleClose}
                disabled={isClosing}
                className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isClosing ? "締め処理中..." : "締めを実行する"}
              </button>
            )}
            <button
              onClick={() => setShowPreCheck(null)}
              className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              閉じる
            </button>
          </>
        }
      >
        {isChecking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">チェック中...</span>
          </div>
        ) : preCheckResult ? (
          <div className="space-y-4">
            {/* エラー */}
            {preCheckResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">エラー（締め不可）</span>
                </div>
                {preCheckResult.errors.map((e, i) => (
                  <p key={i} className="text-sm text-red-700 ml-6">{e}</p>
                ))}
              </div>
            )}

            {/* 警告 */}
            {preCheckResult.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">警告</span>
                </div>
                {preCheckResult.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-amber-700 ml-6">{w}</p>
                ))}
              </div>
            )}

            {/* OK */}
            {preCheckResult.canClose && preCheckResult.errors.length === 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">チェック通過: 締め実行可能です</span>
              </div>
            )}

            {/* サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">売上</p>
                <p className="text-sm font-bold text-text">
                  {preCheckResult.summary.revenueCount}件 / ¥{preCheckResult.summary.revenueAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">仕入</p>
                <p className="text-sm font-bold text-text">
                  {preCheckResult.summary.purchaseCount}件 / ¥{preCheckResult.summary.purchaseAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">未消込入金</p>
                <p className={`text-sm font-bold ${preCheckResult.summary.unreconciledPayments > 0 ? "text-amber-600" : "text-text"}`}>
                  {preCheckResult.summary.unreconciledPayments}件 / ¥{preCheckResult.summary.unreconciledAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">仕訳貸借</p>
                <p className={`text-sm font-bold ${preCheckResult.summary.journalBalance.balanced ? "text-emerald-600" : "text-red-600"}`}>
                  {preCheckResult.summary.journalBalance.balanced ? "一致" : "不一致"}
                  <span className="text-xs font-normal text-text-tertiary ml-1">
                    (借方: ¥{preCheckResult.summary.journalBalance.debit.toLocaleString()} / 貸方: ¥{preCheckResult.summary.journalBalance.credit.toLocaleString()})
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
