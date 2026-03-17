"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import { Download, Loader2, Building2, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TransferItem = {
  id: string;
  type: "PURCHASE" | "EXPENSE";
  number: string;
  date: string;
  supplierName: string;
  supplierCode: string;
  amount: number;
  bankCode: string | null;
  bankName: string | null;
  branchCode: string | null;
  branchName: string | null;
  accountType: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  hasBankInfo: boolean;
};

export default function BankTransferPage() {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [transferDate, setTransferDate] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: items, isLoading } = useSWR<TransferItem[]>(
    "/api/mr/bank-transfer",
    fetcher
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!items) return;
    const validItems = items.filter((i) => i.hasBankInfo);
    if (selectedIds.size === validItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validItems.map((i) => i.id)));
    }
  };

  const selectedTotal = items
    ?.filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + i.amount, 0) ?? 0;

  const handleGenerateFB = async () => {
    if (selectedIds.size === 0) {
      showToast("振込対象を選択してください", "error");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/mr/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          transferDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "生成に失敗しました");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zengin_transfer_${transferDate}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("FBファイルをダウンロードしました", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "生成に失敗しました", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const typeLabels: Record<string, string> = {
    PURCHASE: "仕入",
    EXPENSE: "経費",
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ja-JP");

  return (
    <>
      <Header title="振込データ作成" />
      <div className="p-4 md:p-6 space-y-4">
        {/* 説明バナー */}
        <div className="bg-surface-secondary rounded-xl p-4 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-text-secondary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-text">全銀フォーマット（FB）振込データ</p>
            <p className="text-xs text-text-tertiary">
              支払予定の仕入・経費から振込先を選択し、全銀協制定のFBファイル（総合振込）を生成します。
            </p>
          </div>
        </div>

        {/* コントロールバー */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-text-secondary">振込指定日（MMDD）:</label>
            <input
              type="text"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              maxLength={4}
              placeholder="0320"
              className="w-20 px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-mono"
            />
            <span className="text-xs text-text-tertiary">
              選択: {selectedIds.size}件 / 合計: ¥{selectedTotal.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleGenerateFB}
            disabled={isGenerating || selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            FBファイル生成
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        (items?.filter((i) => i.hasBankInfo).length ?? 0) > 0 &&
                        selectedIds.size === (items?.filter((i) => i.hasBankInfo).length ?? 0)
                      }
                      onChange={toggleAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">伝票番号</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払先</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">口座</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors ${!item.hasBankInfo ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        disabled={!item.hasBankInfo}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${item.type === "PURCHASE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                        {typeLabels[item.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{item.number}</td>
                    <td className="px-4 py-3 text-sm text-text">{item.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-sm text-text text-right font-medium">
                      ¥{item.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.hasBankInfo ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="w-3 h-3" />登録済
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" />未登録
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!items || items.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-tertiary">
                      支払予定データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="text-xs text-text-tertiary p-3 bg-surface-secondary rounded-lg">
          ※ FBファイルは全銀協制定フォーマット（固定長120バイト/行）で出力されます。銀行口座情報は取引先マスタから取得します。
        </div>
      </div>
    </>
  );
}
