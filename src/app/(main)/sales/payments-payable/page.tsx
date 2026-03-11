"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Download, Eye, ArrowRight, CheckCircle } from "lucide-react";
import { useState } from "react";

type PayableStatus = "未承認" | "承認済" | "振込済";
const statusColors: Record<PayableStatus, string> = { "未承認": "bg-amber-50 text-amber-700", "承認済": "bg-blue-50 text-blue-700", "振込済": "bg-emerald-50 text-emerald-700" };

const payables = [
  { id: "1", number: "AP-2026-0034", supplier: "九州リサイクル株式会社", category: "原料仕入", amount: 680000, dueDate: "2026-03-31", approvedBy: null, status: "未承認" as PayableStatus },
  { id: "2", number: "AP-2026-0033", supplier: "中国運輸株式会社", category: "運賃", amount: 153000, dueDate: "2026-03-31", approvedBy: null, status: "未承認" as PayableStatus },
  { id: "3", number: "AP-2026-0032", supplier: "広島産業廃棄物処理株式会社", category: "原料仕入", amount: 412500, dueDate: "2026-03-25", approvedBy: "高橋 健二", status: "承認済" as PayableStatus },
  { id: "4", number: "AP-2026-0031", supplier: "北陸ポリマー株式会社", category: "原料仕入", amount: 297000, dueDate: "2026-03-20", approvedBy: "高橋 健二", status: "振込済" as PayableStatus },
];

export default function PaymentsPayablePage() {
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();
  const selected = payables.find((p) => p.id === showDetail);

  return (
    <>
      <Header title="支払管理" />
      <div className="p-6 space-y-4">
        {/* フロー */}
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs font-medium text-text-secondary mb-2">支払フロー</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
              <CheckCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">買掛計上</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">承認</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">振込実行</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={() => showToast("全銀データ（FBデータ）を出力しました（モック）", "success")} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Download className="w-4 h-4" />全銀データ出力
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">区分</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払期限</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">承認者</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.number}</td>
                  <td className="px-4 py-3 text-sm text-text">{p.supplier}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.category}</td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">¥{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.dueDate}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.approvedBy || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(p.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
            <p className="text-xs text-text-tertiary">{payables.length}件</p>
            <p className="text-xs text-text-secondary">合計: ¥{payables.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `支払詳細: ${selected.number}` : ""}
        footer={<>
          {selected?.status === "未承認" && <button onClick={() => { setShowDetail(null); showToast("承認しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">承認する</button>}
          {selected?.status === "承認済" && <button onClick={() => { setShowDetail(null); showToast("振込実行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">振込実行</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.number}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">仕入先</p><p className="text-sm text-text">{selected.supplier}</p></div>
              <div><p className="text-xs text-text-tertiary">区分</p><p className="text-sm text-text">{selected.category}</p></div>
              <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-primary-700">¥{selected.amount.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">支払期限</p><p className="text-sm text-text">{selected.dueDate}</p></div>
              <div><p className="text-xs text-text-tertiary">承認者</p><p className="text-sm text-text">{selected.approvedBy || "未承認"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
