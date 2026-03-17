"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Download, Upload, CheckCircle, AlertTriangle, Eye, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type JournalEntry = {
  id: string;
  companyId: string;
  entryDate: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  description: string | null;
  sourceType: string | null;
  sourceId: string | null;
  isExported: boolean;
  exportedAt: string | null;
  createdAt: string;
  createdBy: string | null;
};

type ExportedFilter = "all" | "true" | "false";

const statusLabel = (isExported: boolean) => isExported ? "連携済" : "未連携";
const statusColor = (isExported: boolean) => isExported ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";

export default function JournalEntriesPage() {
  const [statusFilter, setStatusFilter] = useState<ExportedFilter>("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("exported", statusFilter);

  const { items: entries, total, page, limit, isLoading, onPageChange } = usePaginated<JournalEntry>(
    `/api/sales/journal-entries?${params.toString(
  )}`
  );

  // Fetch all for summary
  const { data: allEntries } = useSWR<JournalEntry[]>("/api/sales/journal-entries");

  const selected = entries.find((j) => j.id === showDetail);
  const unlinked = allEntries?.filter((j) => !j.isExported).length ?? 0;
  const linked = allEntries?.filter((j) => j.isExported).length ?? 0;

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ja-JP");
  };

  return (
    <>
      <Header title="仕訳データ連携" />
      <div className="p-6 space-y-4">
        {/* 説明バナー */}
        <div className="bg-surface-secondary rounded-xl p-4 flex items-start gap-3">
          <Upload className="w-5 h-5 text-text-secondary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-text">会計ソフト向け仕訳データ出力</p>
            <p className="text-xs text-text-tertiary">売上・仕入・入金・支払から自動生成された仕訳データを、弥生会計/freee/マネーフォワード等へCSV連携します。</p>
          </div>
        </div>

        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">未連携</p>
            <p className="text-2xl font-bold text-amber-600">{unlinked}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">連携済（当月）</p>
            <p className="text-2xl font-bold text-emerald-600">{linked}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">対象会社</p>
            <div className="flex items-center gap-2 mt-1">
              {["CFP", "RE"].map((co) => (
                <span key={co} className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">{co}</span>
              ))}
            </div>
          </div>
        </div>

        {/* アクションバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {([["all", "すべて"], ["false", "未連携"], ["true", "連携済"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val as ExportedFilter)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === val ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("仕訳データを再生成しました（モック）", "success")} className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">
              <RefreshCw className="w-4 h-4" />再生成
            </button>
            <button onClick={() => showToast("CSVをダウンロードしました（モック）", "success")} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4" />CSVエクスポート
            </button>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">会社</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">借方</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">貸方</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">摘要</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((j) => (
                  <tr key={j.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(j.entryDate)}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">{j.companyId}</span></td>
                    <td className="px-4 py-3 text-sm text-text">{j.debitAccount}</td>
                    <td className="px-4 py-3 text-sm text-text">{j.creditAccount}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">{"\u00a5"}{j.debitAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary max-w-[200px] truncate">{j.description ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(j.isExported)}`}>
                        {j.isExported ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {statusLabel(j.isExported)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setShowDetail(j.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                    </td>
                  </tr>
                ))}
                {(!entries || entries.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-tertiary">仕訳データがありません</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        
              <div className="px-4 py-3 border-t border-border">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
</div>

        {/* 科目マッピング説明 */}
        <div className="bg-surface-secondary rounded-xl p-4 text-xs text-text-tertiary">
          ※ 科目コードは弥生会計の標準科目体系に準拠。freee/マネーフォワードへの連携時は自動変換します。
        </div>
      </div>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `仕訳詳細` : ""}
        footer={<>
          {selected && !selected.isExported && <button onClick={() => { setShowDetail(null); showToast("連携しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">連携実行</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{formatDate(selected.entryDate)}</p></div>
              <div><p className="text-xs text-text-tertiary">会社</p><p className="text-sm text-text">{selected.companyId}</p></div>
              <div><p className="text-xs text-text-tertiary">元伝票種別</p><p className="text-sm font-mono text-primary-600">{selected.sourceType ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">元伝票ID</p><p className="text-sm font-mono text-text-secondary">{selected.sourceId ?? "-"}</p></div>
            </div>
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">借方</p>
                  <p className="text-sm font-medium text-blue-800">{selected.debitAccount}</p>
                  <p className="text-sm font-bold text-blue-800 mt-1">{"\u00a5"}{selected.debitAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-600">貸方</p>
                  <p className="text-sm font-medium text-emerald-800">{selected.creditAccount}</p>
                  <p className="text-sm font-bold text-emerald-800 mt-1">{"\u00a5"}{selected.creditAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div><p className="text-xs text-text-tertiary">摘要</p><p className="text-sm text-text">{selected.description ?? "-"}</p></div>
          </div>
        )}
      </Modal>
    </>
  );
}
