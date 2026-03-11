"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { taxReports, type TaxReportType } from "@/lib/dummy-data-phase3";
import { FileText, Download, Calculator, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { useState } from "react";

export default function TaxReportsPage() {
  const [typeFilter, setTypeFilter] = useState<TaxReportType | "all">("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = taxReports.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  const selected = taxReports.find((r) => r.id === showDetail);

  const totalTax = taxReports.filter((r) => r.period === "2026-03").reduce((sum, r) => sum + r.taxAmount, 0);

  return (
    <>
      <Header title="税務帳票" />
      <div className="p-6 space-y-4">
        {/* 説明バナー */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Calculator className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">揮発油税・軽油引取税の自動算出</p>
            <p className="text-xs text-amber-600">製造量・出荷量から税額を自動計算。ISCC・税務関係は「出荷日」起算（売上計上日とは異なります）。</p>
          </div>
        </div>

        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">当月税額合計</p>
            <p className="text-2xl font-bold text-text">¥{totalTax.toLocaleString()}</p>
            <p className="text-xs text-text-tertiary">2026年3月分</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">揮発油税</p>
            <p className="text-2xl font-bold text-text">¥{taxReports.filter((r) => r.period === "2026-03" && r.type === "揮発油税").reduce((s, r) => s + r.taxAmount, 0).toLocaleString()}</p>
            <p className="text-xs text-text-tertiary">税率: ¥53.8/L</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">軽油引取税</p>
            <p className="text-2xl font-bold text-text">¥{taxReports.filter((r) => r.period === "2026-03" && r.type === "軽油引取税").reduce((s, r) => s + r.taxAmount, 0).toLocaleString()}</p>
            <p className="text-xs text-text-tertiary">税率: ¥32.1/L</p>
          </div>
        </div>

        {/* フィルタ */}
        <div className="flex items-center gap-2">
          {(["all", "揮発油税", "軽油引取税"] as (TaxReportType | "all")[]).map((type) => (
            <button key={type} onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${typeFilter === type ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
              {type === "all" ? "すべて" : type}
            </button>
          ))}
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">期間</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">工場</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">製造量(L)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷量(L)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">税額</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">期限</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${r.type === "揮発油税" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}>{r.type}</span></td>
                  <td className="px-4 py-3 text-sm font-medium text-text">{r.period}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{r.plant}</td>
                  <td className="px-4 py-3 text-sm text-right text-text-secondary">{r.productionLiters.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-text-secondary">{r.shipmentLiters.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-text">¥{r.taxAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{r.dueDate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${r.status === "提出済" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {r.status === "提出済" ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(r.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 換算説明 */}
        <div className="bg-surface-secondary rounded-xl p-4 text-xs text-text-tertiary">
          ※ 体積(L) = 重量(kg) ÷ 比重(研究所データ)。揮発油税は出荷時の体積基準で課税。
        </div>
      </div>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `${selected.type} ${selected.period}` : ""}
        footer={<>
          <button onClick={() => showToast("税務帳票PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Download className="w-4 h-4" />PDF出力</button>
          {selected?.status === "作成中" && <button onClick={() => { setShowDetail(null); showToast("提出済にしました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">提出済にする</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">税種別</p><p className="text-sm font-medium text-text">{selected.type}</p></div>
              <div><p className="text-xs text-text-tertiary">対象期間</p><p className="text-sm text-text">{selected.period}</p></div>
              <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant}</p></div>
              <div><p className="text-xs text-text-tertiary">提出期限</p><p className="text-sm text-text">{selected.dueDate}</p></div>
            </div>
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-3">税額計算</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">製造量</span><span className="font-mono">{selected.productionLiters.toLocaleString()} L</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">出荷量（課税対象）</span><span className="font-mono">{selected.shipmentLiters.toLocaleString()} L</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">税率</span><span className="font-mono">¥{selected.taxRate}/L</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-bold"><span className="text-text">税額</span><span className="font-mono">¥{selected.taxAmount.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
