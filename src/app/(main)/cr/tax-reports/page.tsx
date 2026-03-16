"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { FileText, Download, Calculator, AlertTriangle, CheckCircle, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TaxReportStatus = "DRAFT" | "FILED" | "ACCEPTED";

const statusLabel: Record<TaxReportStatus, string> = {
  DRAFT: "作成中",
  FILED: "提出済",
  ACCEPTED: "受理済",
};

const statusColors: Record<TaxReportStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  FILED: "bg-emerald-50 text-emerald-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
};

type TaxReportData = {
  id: string;
  reportType: string;
  period: string;
  totalSales: number;
  totalTax: number;
  filingDate: string | null;
  status: TaxReportStatus;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
};

export default function TaxReportsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (typeFilter !== "all") params.set("reportType", typeFilter);

  const { data: taxReports, isLoading } = useSWR<TaxReportData[]>(
    `/api/cr/tax-reports?${params.toString()}`,
    fetcher
  );

  // For summary, get all reports
  const { data: allReports } = useSWR<TaxReportData[]>("/api/cr/tax-reports", fetcher);

  const reports = taxReports ?? [];
  const all = allReports ?? [];
  const selected = reports.find((r) => r.id === showDetail);

  const totalTax = all.reduce((sum, r) => sum + r.totalTax, 0);

  if (isLoading) {
    return (
      <>
        <Header title="税務帳票" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </>
    );
  }

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
            <p className="text-xs text-text-tertiary">税額合計</p>
            <p className="text-2xl font-bold text-text">¥{totalTax.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">提出済</p>
            <p className="text-2xl font-bold text-emerald-600">{all.filter((r) => r.status === "FILED" || r.status === "ACCEPTED").length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">作成中</p>
            <p className="text-2xl font-bold text-amber-600">{all.filter((r) => r.status === "DRAFT").length}件</p>
          </div>
        </div>

        {/* フィルタ */}
        <div className="flex items-center gap-2">
          {["all", "揮発油税", "軽油引取税", "消費税", "法人税"].map((type) => (
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
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">売上額</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">税額</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">提出日</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${r.reportType === "揮発油税" ? "bg-orange-100 text-orange-800" : r.reportType === "軽油引取税" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{r.reportType}</span></td>
                  <td className="px-4 py-3 text-sm font-medium text-text">{r.period}</td>
                  <td className="px-4 py-3 text-sm text-right text-text-secondary">¥{r.totalSales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-text">¥{r.totalTax.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{r.filingDate ? new Date(r.filingDate).toLocaleDateString("ja-JP") : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[r.status]}`}>
                      {r.status === "FILED" || r.status === "ACCEPTED" ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {statusLabel[r.status]}
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
          ※ 体積(L) = 重量(kg) / 比重(研究所データ)。揮発油税は出荷時の体積基準で課税。
        </div>
      </div>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `${selected.reportType} ${selected.period}` : ""}
        footer={<>
          <button onClick={() => showToast("税務帳票PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Download className="w-4 h-4" />PDF出力</button>
          {selected?.status === "DRAFT" && <button onClick={() => { setShowDetail(null); showToast("提出済にしました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">提出済にする</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">税種別</p><p className="text-sm font-medium text-text">{selected.reportType}</p></div>
              <div><p className="text-xs text-text-tertiary">対象期間</p><p className="text-sm text-text">{selected.period}</p></div>
              <div><p className="text-xs text-text-tertiary">提出日</p><p className="text-sm text-text">{selected.filingDate ? new Date(selected.filingDate).toLocaleDateString("ja-JP") : "未提出"}</p></div>
              <div><p className="text-xs text-text-tertiary">状態</p><p className="text-sm text-text">{statusLabel[selected.status]}</p></div>
            </div>
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-3">税額計算</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">売上額</span><span className="font-mono">¥{selected.totalSales.toLocaleString()}</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-bold"><span className="text-text">税額</span><span className="font-mono">¥{selected.totalTax.toLocaleString()}</span></div>
              </div>
            </div>
            {selected.note && (
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">備考</p>
                <p className="text-sm text-text">{selected.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
