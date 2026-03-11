"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { journalEntries, journalStatusColors, type JournalStatus } from "@/lib/dummy-data-phase3";
import { Download, Upload, CheckCircle, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function JournalEntriesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = journalEntries.filter((j) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    return true;
  });

  const selected = journalEntries.find((j) => j.id === showDetail);
  const unlinked = journalEntries.filter((j) => j.status === "未連携").length;

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
            <p className="text-2xl font-bold text-emerald-600">{journalEntries.filter((j) => j.status === "連携済").length}件</p>
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
            {(["all", "未連携", "連携済", "エラー"] as (JournalStatus | "all")[]).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === s ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
                {s === "all" ? "すべて" : s}
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕訳番号</th>
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
              {filtered.map((j) => (
                <tr key={j.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{j.number}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{j.date}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">{j.company}</span></td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-text">{j.debitAccount}</span>
                    <span className="text-xs text-text-tertiary ml-1">({j.debitCode})</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-text">{j.creditAccount}</span>
                    <span className="text-xs text-text-tertiary ml-1">({j.creditCode})</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">¥{j.debitAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary max-w-[200px] truncate">{j.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${journalStatusColors[j.status]}`}>
                      {j.status === "連携済" ? <CheckCircle className="w-3 h-3" /> : j.status === "エラー" ? <AlertTriangle className="w-3 h-3" /> : null}
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(j.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 科目マッピング説明 */}
        <div className="bg-surface-secondary rounded-xl p-4 text-xs text-text-tertiary">
          ※ 科目コードは弥生会計の標準科目体系に準拠。freee/マネーフォワードへの連携時は自動変換します。
        </div>
      </div>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `仕訳: ${selected.number}` : ""}
        footer={<>
          {selected?.status === "未連携" && <button onClick={() => { setShowDetail(null); showToast("連携しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">連携実行</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">仕訳番号</p><p className="text-sm font-mono text-text">{selected.number}</p></div>
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{selected.date}</p></div>
              <div><p className="text-xs text-text-tertiary">会社</p><p className="text-sm text-text">{selected.company}</p></div>
              <div><p className="text-xs text-text-tertiary">元伝票</p><p className="text-sm font-mono text-primary-600">{selected.source}</p></div>
            </div>
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">借方</p>
                  <p className="text-sm font-medium text-blue-800">{selected.debitAccount} ({selected.debitCode})</p>
                  <p className="text-sm font-bold text-blue-800 mt-1">¥{selected.debitAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-600">貸方</p>
                  <p className="text-sm font-medium text-emerald-800">{selected.creditAccount} ({selected.creditCode})</p>
                  <p className="text-sm font-bold text-emerald-800 mt-1">¥{selected.creditAmount.toLocaleString()}</p>
                </div>
              </div>
              {selected.taxAmount > 0 && (
                <div className="mt-2 text-xs text-text-secondary text-center">消費税: ¥{selected.taxAmount.toLocaleString()}</div>
              )}
            </div>
            <div><p className="text-xs text-text-tertiary">摘要</p><p className="text-sm text-text">{selected.description}</p></div>
          </div>
        )}
      </Modal>
    </>
  );
}
