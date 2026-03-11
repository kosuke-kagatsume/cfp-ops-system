"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { inventoryItems } from "@/lib/dummy-data-phase1";
import { Search, Download, Filter, Eye, ArrowUpDown, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [plantFilter, setPlantFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = inventoryItems.filter((item) => {
    if (plantFilter !== "all" && !item.plant.includes(plantFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.product.toLowerCase().includes(q) || item.productName.includes(q) || item.warehouse.includes(q) || item.collectionSource.includes(q);
    }
    return true;
  });

  const totalQuantity = filtered.reduce((s, i) => s + i.quantity, 0);
  const totalCost = filtered.reduce((s, i) => s + i.totalCost, 0);
  const selected = inventoryItems.find((i) => i.id === showDetail);

  return (
    <>
      <Header title="在庫管理" />
      <div className="p-6 space-y-4">
        {/* 在庫管理4軸の説明 */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800">在庫管理軸: 倉庫 × 引取先 × 品目 × 荷姿</p>
          <p className="text-xs text-primary-600 mt-1">在庫評価: 移動平均法（仕入価格 + 運賃 + RE加工賃 + その他費用）</p>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">在庫品目数</p>
            <p className="text-2xl font-bold text-text">{filtered.length}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">総在庫量</p>
            <p className="text-2xl font-bold text-text">{totalQuantity.toLocaleString()} <span className="text-sm font-normal text-text-secondary">kg</span></p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">在庫評価額</p>
            <p className="text-2xl font-bold text-primary-700">¥{totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">平均単価</p>
            <p className="text-2xl font-bold text-text">¥{totalQuantity > 0 ? Math.round(totalCost / totalQuantity).toLocaleString() : 0} <span className="text-sm font-normal text-text-secondary">/kg</span></p>
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="品目コード、倉庫、引取先で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">全工場</option>
              <option value="美の浜">美の浜工場</option>
              <option value="高松">高松工場</option>
              <option value="四日市">四日市工場</option>
              <option value="岡山ケミカル">岡山ケミカルセンター</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("棚卸画面（Phase 1で実装予定）", "info")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <BarChart3 className="w-4 h-4" />棚卸
            </button>
            <button onClick={() => showToast("CSVダウンロードしました", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <Download className="w-4 h-4" />CSV出力
            </button>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">倉庫</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">引取先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">荷姿</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">在庫量(kg)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">移動平均単価</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">評価額</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-text">{item.warehouse}</p>
                    <p className="text-xs text-text-tertiary">{item.plant}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{item.collectionSource}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{item.product}</span>
                    <p className="text-xs text-text-tertiary mt-0.5">{item.productName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{item.packaging}</td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary text-right">¥{item.unitCost}/kg</td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">¥{item.totalCost.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(item.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
            <p className="text-xs text-text-tertiary">{filtered.length}件</p>
            <div className="flex items-center gap-6">
              <p className="text-xs text-text-secondary">合計: <span className="font-medium">{totalQuantity.toLocaleString()} kg</span></p>
              <p className="text-xs text-text-secondary">評価額: <span className="font-bold text-primary-700">¥{totalCost.toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `在庫詳細: ${selected.product}` : ""}
        footer={<>
          <button onClick={() => { setShowDetail(null); showToast("入出庫履歴（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">入出庫履歴</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-surface-tertiary rounded-lg text-center">
              <p className="text-xs text-text-tertiary">品目コード</p>
              <p className="text-lg font-mono font-bold text-primary-700">{selected.product}</p>
              <p className="text-sm text-text-secondary">{selected.productName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">倉庫</p><p className="text-sm text-text">{selected.warehouse}</p><p className="text-xs text-text-tertiary">{selected.plant}</p></div>
              <div><p className="text-xs text-text-tertiary">引取先</p><p className="text-sm text-text">{selected.collectionSource}</p></div>
              <div><p className="text-xs text-text-tertiary">荷姿</p><p className="text-sm text-text">{selected.packaging}</p></div>
              <div><p className="text-xs text-text-tertiary">在庫量</p><p className="text-sm font-bold text-text">{selected.quantity.toLocaleString()} kg</p></div>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <p className="text-xs text-primary-600 mb-2">移動平均法による在庫評価</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">移動平均単価</p><p className="text-sm font-medium text-text">¥{selected.unitCost}/kg</p></div>
                <div><p className="text-xs text-text-tertiary">評価額</p><p className="text-sm font-bold text-primary-700">¥{selected.totalCost.toLocaleString()}</p></div>
              </div>
              <p className="text-xs text-text-tertiary mt-2">構成: 仕入価格 + 運賃 + RE加工賃 + その他</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
