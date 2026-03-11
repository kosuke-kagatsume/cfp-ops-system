"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { revenues, revenueStatusColors, siteLabels, siteColors, type Site } from "@/lib/dummy-data-phase2";
import { Download, Search, Eye } from "lucide-react";
import { useState } from "react";

export default function RevenuePage() {
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = revenues.filter((r) => {
    if (siteFilter !== "all" && r.site !== siteFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.number.toLowerCase().includes(s) || r.customer.includes(s) || r.product.includes(s);
    }
    return true;
  });

  const selected = revenues.find((r) => r.id === showDetail);
  const totalSales = filtered.reduce((s, r) => s + r.amount, 0);
  const totalTax = filtered.reduce((s, r) => s + r.tax, 0);

  return (
    <>
      <Header title="売上管理" />
      <div className="p-6 space-y-4">
        {/* サイトタブ */}
        <div className="flex items-center gap-2">
          <button onClick={() => setSiteFilter("all")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${siteFilter === "all" ? "bg-primary-600 text-text-inverse" : "bg-surface border border-border text-text-secondary hover:bg-surface-tertiary"}`}>
            全サイト
          </button>
          {(Object.keys(siteLabels) as Site[]).map((site) => (
            <button key={site} onClick={() => setSiteFilter(siteFilter === site ? "all" : site)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${siteFilter === site ? "border-2 border-primary-400" : "border border-border hover:border-primary-200"} ${siteColors[site]}`}>
              {siteLabels[site]}
              <span className="ml-1.5 text-xs">({revenues.filter((r) => r.site === site).length})</span>
            </button>
          ))}
        </div>

        {/* 集計 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">¥{totalSales.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">売上合計（税抜）</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">¥{totalTax.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">消費税合計</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">{filtered.length}</p>
            <p className="text-xs text-text-secondary">売上件数</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="売上番号、顧客名、品目で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => showToast("CSVダウンロードしました", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
            <Download className="w-4 h-4" />CSV出力
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">売上番号</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">サイト</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">単価</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">消費税</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{r.number}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${siteColors[r.site]}`}>{siteLabels[r.site]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text">{r.customer}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{r.product}</td>
                  <td className="px-4 py-3 text-sm text-text text-right">{r.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text text-right">¥{r.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">¥{r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary text-right">¥{r.tax.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${revenueStatusColors[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(r.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {revenues.length}件</p>
            <p className="text-xs text-text-secondary">合計（税込）: ¥{(totalSales + totalTax).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `売上詳細: ${selected.number}` : ""}
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.number}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${revenueStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">サイト</p><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${siteColors[selected.site]}`}>{siteLabels[selected.site]}</span></div>
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text-secondary mb-2">3軸日付</p>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-xs text-text-tertiary">売上日</p><p className="text-sm text-text">{selected.salesDate}</p></div>
                <div><p className="text-xs text-text-tertiary">出荷日</p><p className="text-sm text-text">{selected.shipmentDate}</p></div>
                <div><p className="text-xs text-text-tertiary">納品日</p><p className="text-sm text-text">{selected.deliveryDate}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm font-mono text-text">{selected.product}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm text-text">{selected.quantity.toLocaleString()}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">金額（税抜）</p><p className="text-sm font-medium text-text">¥{selected.amount.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">消費税</p><p className="text-sm text-text">¥{selected.tax.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">合計（税込）</p><p className="text-sm font-bold text-primary-700">¥{(selected.amount + selected.tax).toLocaleString()}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
