"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { invoices, invoiceStatusColors, siteLabels, type InvoiceStatus } from "@/lib/dummy-data-phase2";
import { Download, Search, Eye, FileText } from "lucide-react";
import { useState } from "react";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return inv.number.toLowerCase().includes(s) || inv.customer.includes(s);
    }
    return true;
  });

  const selected = invoices.find((inv) => inv.id === showDetail);

  return (
    <>
      <Header title="請求管理" />
      <div className="p-6 space-y-4">
        {/* 注意 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800">消費税は伝票単位で計算されます（請求書上での合算ではなく、各売上伝票の消費税を積み上げ）</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {(["下書き", "発行済", "送付済", "入金済"] as InvoiceStatus[]).map((st) => {
            const count = invoices.filter((inv) => inv.status === st).length;
            return (
              <button key={st} onClick={() => setStatusFilter(statusFilter === st ? "all" : st)}
                className={`p-3 rounded-xl border text-center transition-colors ${statusFilter === st ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{st}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="請求番号、顧客名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("一括PDF生成しました（モック）", "success")} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <FileText className="w-4 h-4" />一括PDF生成
            </button>
            <button onClick={() => showToast("CSVダウンロードしました", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <Download className="w-4 h-4" />CSV出力
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">請求番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">サイト</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">締日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">発行日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払期限</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">請求額</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{inv.number}</td>
                  <td className="px-4 py-3 text-sm text-text">{inv.customer}</td>
                  <td className="px-4 py-3 text-center text-xs text-text-secondary">{siteLabels[inv.site]}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{inv.closingDate}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{inv.issueDate}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">¥{inv.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${invoiceStatusColors[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(inv.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {invoices.length}件</p>
            <p className="text-xs text-text-secondary">請求合計: ¥{filtered.reduce((s, inv) => s + inv.total, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `請求詳細: ${selected.number}` : ""}
        footer={<>
          {selected?.status === "下書き" && <button onClick={() => { setShowDetail(null); showToast("請求書を発行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">発行する</button>}
          <button onClick={() => { showToast("PDFプレビューを表示します（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">PDFプレビュー</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.number}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${invoiceStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer}</p></div>
              <div><p className="text-xs text-text-tertiary">サイト</p><p className="text-sm text-text">{siteLabels[selected.site]}</p></div>
              <div><p className="text-xs text-text-tertiary">締日</p><p className="text-sm text-text">{selected.closingDate}</p></div>
              <div><p className="text-xs text-text-tertiary">支払期限</p><p className="text-sm text-text">{selected.dueDate}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-2">
              <p className="text-xs font-medium text-text-secondary">繰越残高方式 内訳</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-text-tertiary">前回請求残高</span><span className="text-text">¥{selected.prevBalance.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-tertiary">入金額</span><span className="text-emerald-600">- ¥{selected.paymentReceived.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm border-t border-border pt-1"><span className="text-text-tertiary">繰越残高</span><span className="text-text font-medium">¥{selected.carryover.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-tertiary">今回売上（税抜）</span><span className="text-text">¥{selected.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-tertiary">消費税</span><span className="text-text">¥{selected.tax.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm border-t border-border pt-1 font-bold"><span className="text-text">今回請求額</span><span className="text-primary-700">¥{selected.total.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
