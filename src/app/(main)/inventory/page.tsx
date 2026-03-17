"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Search, Download, Eye, BarChart3, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type InventoryItem = {
  id: string;
  quantity: number;
  movingAvgCost: number;
  packagingType: string | null;
  product: {
    id: string;
    code: string;
    name: { name: string } | null;
    shape: { name: string } | null;
    color: { name: string } | null;
    grade: { name: string } | null;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
    plant: { name: string };
  };
  pickupPartner: { id: string; name: string } | null;
};

const packagingLabels: Record<string, string> = {
  FLECON: "フレコン",
  PALLET: "パレット",
  STEEL_BOX: "スチール箱",
  PAPER_BAG: "紙袋",
  POST_PALLET: "ポストパレット",
};

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { data: inventoryItems, isLoading } = useSWR<InventoryItem[]>(
    `/api/mr/inventory?${params.toString()}`,
    fetcher
  );

  const totalQuantity = inventoryItems?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const totalCost = inventoryItems?.reduce((s, i) => s + i.quantity * i.movingAvgCost, 0) ?? 0;
  const selected = inventoryItems?.find((i) => i.id === showDetail);

  return (
    <>
      <Header title="在庫管理" />
      <div className="p-6 space-y-4">
        {/* 在庫管理4軸の説明 */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800">在庫管理軸: 倉庫 x 引取先 x 品目 x 荷姿</p>
          <p className="text-xs text-primary-600 mt-1">在庫評価: 移動平均法（仕入価格 + 運賃 + RE加工賃 + その他費用）</p>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">在庫品目数</p>
            <p className="text-2xl font-bold text-text">{inventoryItems?.length ?? 0}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">総在庫量</p>
            <p className="text-2xl font-bold text-text">{totalQuantity.toLocaleString()} <span className="text-sm font-normal text-text-secondary">kg</span></p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">在庫評価額</p>
            <p className="text-2xl font-bold text-primary-700">¥{Math.round(totalCost).toLocaleString()}</p>
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
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("棚卸画面（Phase 1で実装予定）", "info")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <BarChart3 className="w-4 h-4" />棚卸
            </button>
            <button onClick={() => {
              fetch("/api/export/excel?type=inventory").then(r => r.blob()).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "在庫一覧.xlsx"; a.click();
                URL.revokeObjectURL(url);
                showToast("Excelファイルをダウンロードしました", "success");
              }).catch(() => showToast("ダウンロードに失敗しました", "error"));
            }} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <Download className="w-4 h-4" />Excel出力
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
            <>
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
                  {inventoryItems?.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm text-text">{item.warehouse.name}</p>
                        <p className="text-xs text-text-tertiary">{item.warehouse.plant.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{item.pickupPartner?.name ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{item.product.code}</span>
                        <p className="text-xs text-text-tertiary mt-0.5">{item.product.name?.name ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{item.packagingType ? packagingLabels[item.packagingType] ?? item.packagingType : "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text text-right">{item.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-right">¥{Math.round(item.movingAvgCost).toLocaleString()}/kg</td>
                      <td className="px-4 py-3 text-sm font-medium text-text text-right">¥{Math.round(item.quantity * item.movingAvgCost).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDetail(item.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inventoryItems?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
                <p className="text-xs text-text-tertiary">{inventoryItems?.length ?? 0}件</p>
                <div className="flex items-center gap-6">
                  <p className="text-xs text-text-secondary">合計: <span className="font-medium">{totalQuantity.toLocaleString()} kg</span></p>
                  <p className="text-xs text-text-secondary">評価額: <span className="font-bold text-primary-700">¥{Math.round(totalCost).toLocaleString()}</span></p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `在庫詳細: ${selected.product.code}` : ""}
        footer={<>
          <button onClick={() => { setShowDetail(null); showToast("入出庫履歴（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">入出庫履歴</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-surface-tertiary rounded-lg text-center">
              <p className="text-xs text-text-tertiary">品目コード</p>
              <p className="text-lg font-mono font-bold text-primary-700">{selected.product.code}</p>
              <p className="text-sm text-text-secondary">{selected.product.name?.name ?? "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">倉庫</p><p className="text-sm text-text">{selected.warehouse.name}</p><p className="text-xs text-text-tertiary">{selected.warehouse.plant.name}</p></div>
              <div><p className="text-xs text-text-tertiary">引取先</p><p className="text-sm text-text">{selected.pickupPartner?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">荷姿</p><p className="text-sm text-text">{selected.packagingType ? packagingLabels[selected.packagingType] ?? selected.packagingType : "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">在庫量</p><p className="text-sm font-bold text-text">{selected.quantity.toLocaleString()} kg</p></div>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <p className="text-xs text-primary-600 mb-2">移動平均法による在庫評価</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">移動平均単価</p><p className="text-sm font-medium text-text">¥{Math.round(selected.movingAvgCost).toLocaleString()}/kg</p></div>
                <div><p className="text-xs text-text-tertiary">評価額</p><p className="text-sm font-bold text-primary-700">¥{Math.round(selected.quantity * selected.movingAvgCost).toLocaleString()}</p></div>
              </div>
              <p className="text-xs text-text-tertiary mt-2">構成: 仕入価格 + 運賃 + RE加工賃 + その他</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
