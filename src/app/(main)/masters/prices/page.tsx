"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { prices, partners, products } from "@/lib/dummy-data";
import { Plus, Download, Search, MoreHorizontal, AlertTriangle, Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

export default function PricesPage() {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = prices.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.partnerName.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q);
  });

  const today = "2026-03-11";

  return (
    <>
      <Header title="単価マスタ" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="取引先名、品目コードで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast("CSVファイルをダウンロードしました", "success")}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV出力
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新規登録
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">取引先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目コード</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目名</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">単価</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">通貨</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">有効期間</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((price) => {
                const isExpiring = price.validTo <= "2026-03-31" && price.validTo >= today;
                const isExpired = price.validTo < today;
                return (
                  <tr key={price.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text">{price.partnerName}</td>
                    <td className="px-4 py-3"><span className="text-sm font-mono bg-surface-tertiary px-2 py-0.5 rounded">{price.productCode}</span></td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{price.productName}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">
                      {price.currency === "JPY" ? `¥${price.unitPrice.toLocaleString()}` : `$${price.unitPrice.toLocaleString()}`}
                      <span className="text-xs text-text-tertiary">/kg</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{price.currency}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{price.validFrom} 〜 {price.validTo}</td>
                    <td className="px-4 py-3 text-center">
                      {isExpired ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700">期限切れ</span>
                      ) : isExpiring ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
                          <AlertTriangle className="w-3 h-3" />期限間近
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">有効</span>
                      )}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button onClick={() => setMenuOpen(menuOpen === price.id ? null : price.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                      </button>
                      {menuOpen === price.id && (
                        <div className="absolute right-4 top-12 bg-surface rounded-lg border border-border shadow-lg py-1 z-10 w-36">
                          <button onClick={() => { showToast("単価詳細画面（開発中）", "info"); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"><Eye className="w-4 h-4" /> 詳細</button>
                          <button onClick={() => { showToast("単価編集（承認ワークフロー経由）", "info"); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"><Edit className="w-4 h-4" /> 編集</button>
                          <button onClick={() => { showToast("削除機能は開発中です", "warning"); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-tertiary"><Trash2 className="w-4 h-4" /> 削除</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {prices.length}件</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="単価 新規登録"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
            <button onClick={() => { setShowNewModal(false); showToast("単価を登録しました（承認待ち）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録申請</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">単価の登録・変更は承認ワークフローを通ります（営業マネージャー → 社長）</p>
          </div>
          <FormField label="取引先" required>
            <FormSelect placeholder="選択" options={partners.filter((p) => p.type === "customer").map((p) => ({ value: p.id, label: p.name }))} />
          </FormField>
          <FormField label="品目" required>
            <FormSelect placeholder="選択" options={products.map((p) => ({ value: p.id, label: `${p.code} - ${p.productName}` }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="単価" required><FormInput type="number" placeholder="例: 185" /></FormField>
            <FormField label="通貨" required>
              <FormSelect placeholder="選択" options={[{ value: "JPY", label: "JPY (円)" }, { value: "USD", label: "USD (ドル)" }, { value: "SGD", label: "SGD" }]} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="有効開始日" required><FormInput type="date" defaultValue="2026-04-01" /></FormField>
            <FormField label="有効終了日" required><FormInput type="date" defaultValue="2027-03-31" /></FormField>
          </div>
        </div>
      </Modal>
    </>
  );
}
