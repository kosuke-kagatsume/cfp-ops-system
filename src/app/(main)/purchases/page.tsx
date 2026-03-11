"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { purchases, purchaseStatusColors } from "@/lib/dummy-data-phase1";
import { Plus, Download, Search, Eye, Filter } from "lucide-react";
import { useState } from "react";

export default function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = purchases.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.purchaseNumber.toLowerCase().includes(q) || p.supplier.includes(q) || p.productName.includes(q);
    }
    return true;
  });

  const selected = purchases.find((p) => p.id === showDetail);

  return (
    <>
      <Header title="仕入・受入管理" />
      <div className="p-6 space-y-4">
        {/* 統計 */}
        <div className="grid grid-cols-5 gap-3">
          {(["予定", "入荷済", "検査済", "確定", "返品"] as const).map((st) => {
            const count = purchases.filter((p) => p.status === st).length;
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
              <input type="text" placeholder="仕入番号、仕入先、品目で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("CSVダウンロードしました", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <Download className="w-4 h-4" />CSV出力
            </button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" />入荷登録
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入先 / 引取先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量(kg)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.purchaseNumber}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.date}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-text">{p.supplier}</p>
                    <p className="text-xs text-text-tertiary">{p.collectionSource}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{p.product}</span>
                    <p className="text-xs text-text-tertiary mt-0.5">{p.packaging}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">{p.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text text-right">¥{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${purchaseStatusColors[p.status]}`}>{p.status}</span>
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
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {purchases.length}件</p>
            <p className="text-xs text-text-secondary">合計: ¥{filtered.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 入荷登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="入荷登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("入荷を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "九州リサイクル株式会社" }, { value: "2", label: "広島産業廃棄物処理株式会社" }, { value: "3", label: "北陸ポリマー株式会社" },
          ]} /></FormField>
          <FormField label="引取先（原料の出所）" required><FormInput placeholder="例: 福岡第一工場" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="受入工場" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "美の浜工場" }, { value: "2", label: "高松工場" }, { value: "3", label: "四日市工場" },
            ]} /></FormField>
            <FormField label="倉庫" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "第1倉庫" }, { value: "2", label: "第2倉庫" },
            ]} /></FormField>
          </div>
          <FormField label="品目" required><FormSelect placeholder="4軸コードで選択" options={[
            { value: "1", label: "PP-CRS-W-B1 PP 粉砕 白 B級" }, { value: "2", label: "PE-FLM-N-A2 PE フィルム ナチュラル A級" },
            { value: "3", label: "ABS-INJ-BK-A1 ABS 射出 黒 A級" },
          ]} /></FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 3200" /></FormField>
            <FormField label="単価(円/kg)" required><FormInput type="number" placeholder="例: 85" /></FormField>
            <FormField label="荷姿" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "フレコン" }, { value: "2", label: "パレット" }, { value: "3", label: "スチール箱" }, { value: "4", label: "紙袋" },
            ]} /></FormField>
          </div>
          <FormField label="運賃(円)"><FormInput type="number" placeholder="例: 35000" /></FormField>
          <FormField label="ロット番号"><FormInput placeholder="自動採番（入力で上書き可）" defaultValue="L260312-02" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `仕入詳細: ${selected.purchaseNumber}` : ""}
        footer={<>
          {selected?.status === "入荷済" && <button onClick={() => { setShowDetail(null); showToast("受入検査画面へ（開発中）", "info"); }} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">受入検査</button>}
          {selected?.status === "検査済" && <button onClick={() => { setShowDetail(null); showToast("確定しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">確定する</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.purchaseNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${purchaseStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">仕入先</p><p className="text-sm text-text">{selected.supplier}</p></div>
              <div><p className="text-xs text-text-tertiary">引取先</p><p className="text-sm text-text">{selected.collectionSource}</p></div>
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{selected.date}</p></div>
              <div><p className="text-xs text-text-tertiary">ロット</p><p className="text-sm font-mono text-text">{selected.lotNumber}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm font-mono text-text">{selected.product}</p><p className="text-xs text-text-secondary">{selected.productName}</p></div>
                <div><p className="text-xs text-text-tertiary">荷姿</p><p className="text-sm text-text">{selected.packaging}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} kg</p></div>
              <div><p className="text-xs text-text-tertiary">単価</p><p className="text-sm text-text">¥{selected.unitPrice}/kg</p></div>
              <div><p className="text-xs text-text-tertiary">小計</p><p className="text-sm font-medium text-text">¥{selected.amount.toLocaleString()}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">運賃</p><p className="text-sm text-text">¥{selected.freight.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">合計（在庫原価算入）</p><p className="text-sm font-bold text-primary-700">¥{(selected.amount + selected.freight).toLocaleString()}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">受入工場</p><p className="text-sm text-text">{selected.plant}</p></div>
              <div><p className="text-xs text-text-tertiary">倉庫</p><p className="text-sm text-text">{selected.warehouse}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
