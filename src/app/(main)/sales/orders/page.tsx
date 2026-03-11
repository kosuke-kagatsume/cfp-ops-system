"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { orders, orderStatusColors, type OrderStatus } from "@/lib/dummy-data-phase2";
import { Plus, Download, Search, Eye } from "lucide-react";
import { useState } from "react";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return o.orderNumber.toLowerCase().includes(s) || o.customer.includes(s) || o.productName.includes(s);
    }
    return true;
  });

  const selected = orders.find((o) => o.id === showDetail);

  return (
    <>
      <Header title="受注管理" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {(["登録済", "出荷中", "完了"] as OrderStatus[]).map((st) => {
            const count = orders.filter((o) => o.status === st).length;
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
              <input type="text" placeholder="受注番号、顧客名、品目で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
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
              <Plus className="w-4 h-4" />受注登録
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受注番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">契約番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量(kg)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{o.contractNumber}</td>
                  <td className="px-4 py-3 text-sm text-text">{o.customer}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{o.product}</span>
                    <p className="text-xs text-text-tertiary mt-0.5">{o.productName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">{o.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text text-right">¥{o.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${orderStatusColors[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(o.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {orders.length}件</p>
            <p className="text-xs text-text-secondary">合計: ¥{filtered.reduce((s, o) => s + o.amount, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="受注登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("受注を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "東洋プラスチック株式会社" }, { value: "2", label: "関西化学工業株式会社" }, { value: "3", label: "株式会社丸紅プラスチック" },
          ]} /></FormField>
          <FormField label="契約番号"><FormInput placeholder="例: CT-2026-0092" /></FormField>
          <FormField label="品目" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "PP-PEL-N-A1 PP ペレット ナチュラル A級" }, { value: "2", label: "ABS-PEL-BK-A1 ABS ペレット 黒 A級" }, { value: "3", label: "PS-PEL-W-A1 PS ペレット 白 A級" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 5000" /></FormField>
            <FormField label="単価(円/kg)" required><FormInput type="number" placeholder="例: 185" /></FormField>
          </div>
          <FormField label="納品予定日" required><FormInput type="date" /></FormField>
        </div>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `受注詳細: ${selected.orderNumber}` : ""}
        footer={<>
          {selected?.status === "登録済" && <button onClick={() => { setShowDetail(null); showToast("出荷指示を作成しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">出荷指示</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.orderNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${orderStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer}</p></div>
              <div><p className="text-xs text-text-tertiary">契約番号</p><p className="text-sm font-mono text-text">{selected.contractNumber}</p></div>
              <div><p className="text-xs text-text-tertiary">受注日</p><p className="text-sm text-text">{selected.orderDate}</p></div>
              <div><p className="text-xs text-text-tertiary">納品予定日</p><p className="text-sm text-text">{selected.deliveryDate}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm font-mono text-text">{selected.product}</p><p className="text-xs text-text-secondary">{selected.productName}</p></div>
                <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} kg</p></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">単価</p><p className="text-sm text-text">¥{selected.unitPrice}/kg</p></div>
              <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-primary-700">¥{selected.amount.toLocaleString()}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
