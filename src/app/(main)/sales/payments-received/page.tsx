"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { paymentsReceived, type PaymentReceivedStatus } from "@/lib/dummy-data-phase2";
import { Upload, Search, Eye, Zap } from "lucide-react";
import { useState } from "react";

const statusColors: Record<PaymentReceivedStatus, string> = { "未消込": "bg-red-50 text-red-700", "消込済": "bg-amber-50 text-amber-700", "確定": "bg-emerald-50 text-emerald-700" };

export default function PaymentsReceivedPage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = paymentsReceived.filter((p) => {
    if (search) {
      const s = search.toLowerCase();
      return p.customer.includes(s) || p.bankRef.toLowerCase().includes(s);
    }
    return true;
  });

  const selected = paymentsReceived.find((p) => p.id === showDetail);

  return (
    <>
      <Header title="入金管理" />
      <div className="p-6 space-y-4">
        {/* CSV取込エリア */}
        <div className="p-6 border-2 border-dashed border-border rounded-xl bg-surface text-center">
          <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-1">銀行CSVファイルをドラッグ＆ドロップ</p>
          <p className="text-xs text-text-tertiary mb-3">または</p>
          <button onClick={() => showToast("CSVファイルを選択してください（モック）", "info")} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            ファイルを選択
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="顧客名、銀行参照で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => showToast("自動消込を実行しました（モック）：1件マッチ", "success")} className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors">
            <Zap className="w-4 h-4" />自動消込
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">入金日</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">銀行参照</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">消込請求書</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text">{p.customer}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.date}</td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">¥{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{p.bankRef}</td>
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.matchedInvoice || "—"}</td>
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
            <p className="text-xs text-text-tertiary">{filtered.length}件</p>
            <p className="text-xs text-text-secondary">合計: ¥{filtered.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="入金詳細"
        footer={<>
          {selected?.status === "未消込" && <button onClick={() => { setShowDetail(null); showToast("手動消込画面へ（開発中）", "info"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">手動消込</button>}
          {selected?.status === "消込済" && <button onClick={() => { setShowDetail(null); showToast("確定しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">確定する</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">{selected.customer}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">入金日</p><p className="text-sm text-text">{selected.date}</p></div>
              <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-primary-700">¥{selected.amount.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">銀行参照</p><p className="text-sm font-mono text-text">{selected.bankRef}</p></div>
              <div><p className="text-xs text-text-tertiary">消込請求書</p><p className="text-sm font-mono text-text">{selected.matchedInvoice || "未消込"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
