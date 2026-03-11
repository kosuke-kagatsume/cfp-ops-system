"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { products } from "@/lib/dummy-data";
import { Plus, Download, Search, MoreHorizontal, CheckCircle, Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.code.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q) || p.shape.includes(q) || p.color.includes(q) || p.grade.includes(q);
  });

  const selectedProduct = products.find((p) => p.id === showDetailModal);

  return (
    <>
      <Header title="品目マスタ" />
      <div className="p-6 space-y-4">
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800">品目コード体系: 品名 × 形状 × 色 × グレード（4軸）</p>
          <p className="text-xs text-primary-600 mt-1">例: PP-PEL-N-A1 = ポリプロピレン / ペレット / ナチュラル / A級</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="コード、品名、形状、色、グレードで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-96 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目コード</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">形状</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">色</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">グレード</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ISCC対象</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetailModal(product.id)} className="text-sm font-mono font-medium text-text bg-surface-tertiary px-2 py-0.5 rounded hover:bg-primary-100 transition-colors">
                      {product.code}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-text">{product.productName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">
                      {product.shape}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                      <span className={`w-3 h-3 rounded-full border border-border ${
                        product.color === "ナチュラル" ? "bg-amber-100" :
                        product.color === "白" ? "bg-white" :
                        product.color === "黒" ? "bg-gray-800" :
                        product.color === "黄" ? "bg-yellow-400" :
                        product.color === "混合色" ? "bg-gradient-to-r from-red-400 to-blue-400" :
                        "bg-gray-300"
                      }`} />
                      {product.color}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{product.grade}</td>
                  <td className="px-4 py-3 text-center">
                    {product.isIscEligible ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === product.id ? null : product.id)}
                      className="p-1 hover:bg-surface-tertiary rounded transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                    </button>
                    {menuOpen === product.id && (
                      <div className="absolute right-4 top-12 bg-surface rounded-lg border border-border shadow-lg py-1 z-10 w-36">
                        <button onClick={() => { setShowDetailModal(product.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary">
                          <Eye className="w-4 h-4" /> 詳細
                        </button>
                        <button onClick={() => { showToast("編集画面を開きます（開発中）", "info"); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary">
                          <Edit className="w-4 h-4" /> 編集
                        </button>
                        <button onClick={() => { showToast("削除機能は開発中です", "warning"); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-tertiary">
                          <Trash2 className="w-4 h-4" /> 削除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {products.length}件</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "品名", count: 80, desc: "PP/PE/PET/PS/エンプラ/ゴム等" },
            { label: "形状", count: 40, desc: "ペレット/フレーク/粉砕/フィルム等" },
            { label: "色", count: 25, desc: "N/白/黒/グレー/青/赤等" },
            { label: "グレード", count: 120, desc: "A級/B級/C級/油化用等" },
          ].map((axis) => (
            <button
              key={axis.label}
              onClick={() => showToast(`${axis.label}マスタの管理画面（開発中）`, "info")}
              className="bg-surface rounded-xl border border-border p-4 text-left hover:border-primary-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text">{axis.label}</span>
                <span className="text-lg font-bold text-primary-600">{axis.count}</span>
              </div>
              <p className="text-xs text-text-tertiary">{axis.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 新規登録モーダル */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="品目 新規登録"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              キャンセル
            </button>
            <button onClick={() => { setShowNewModal(false); showToast("品目を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              登録する
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-text-tertiary bg-surface-tertiary p-3 rounded-lg">4つの軸を選択すると品目コードが自動生成されます</p>
          <FormField label="品名" required>
            <FormSelect placeholder="選択してください" options={[
              { value: "PP", label: "PP（ポリプロピレン）" }, { value: "PE", label: "PE（ポリエチレン）" },
              { value: "PET", label: "PET" }, { value: "PS", label: "PS（ポリスチレン）" },
              { value: "PMMA", label: "PMMA（アクリル）" }, { value: "ABS", label: "ABS" },
              { value: "PC", label: "PC（ポリカーボネート）" }, { value: "CPO", label: "Circular Pyrolysis Oil" },
            ]} />
          </FormField>
          <FormField label="形状" required>
            <FormSelect placeholder="選択してください" options={[
              { value: "PEL", label: "ペレット" }, { value: "FLK", label: "フレーク" },
              { value: "CRS", label: "粉砕" }, { value: "FLM", label: "フィルム" },
              { value: "INJ", label: "射出" }, { value: "BLO", label: "ブロー" }, { value: "LIQ", label: "液体" },
            ]} />
          </FormField>
          <FormField label="色" required>
            <FormSelect placeholder="選択してください" options={[
              { value: "N", label: "ナチュラル" }, { value: "W", label: "白" }, { value: "BK", label: "黒" },
              { value: "GR", label: "グレー" }, { value: "BL", label: "青" }, { value: "RD", label: "赤" },
              { value: "YL", label: "黄" }, { value: "GN", label: "緑" }, { value: "MIX", label: "混合色" },
            ]} />
          </FormField>
          <FormField label="グレード" required>
            <FormSelect placeholder="選択してください" options={[
              { value: "A1", label: "A級（異物混入なし）" }, { value: "A2", label: "A級（軽微異物）" },
              { value: "B1", label: "B級（標準）" }, { value: "B2", label: "B級（選別要）" },
              { value: "C1", label: "C級（低品質）" }, { value: "OIL", label: "油化用原料" },
            ]} />
          </FormField>
          <div className="p-3 bg-surface-tertiary rounded-lg">
            <p className="text-xs text-text-tertiary">生成コード:</p>
            <p className="text-sm font-mono font-bold text-primary-700 mt-1">PP-PEL-N-A1</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="iscc-product" className="rounded border-border" />
            <label htmlFor="iscc-product" className="text-sm text-text">ISCC PLUS対象品目</label>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal
        isOpen={!!showDetailModal}
        onClose={() => setShowDetailModal(null)}
        title={selectedProduct ? `品目詳細: ${selectedProduct.code}` : ""}
        footer={
          <button onClick={() => setShowDetailModal(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
            閉じる
          </button>
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="p-4 bg-surface-tertiary rounded-lg text-center">
              <p className="text-xs text-text-tertiary">品目コード</p>
              <p className="text-xl font-mono font-bold text-primary-700 mt-1">{selectedProduct.code}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">品名</p><p className="text-sm text-text">{selectedProduct.productName}</p></div>
              <div><p className="text-xs text-text-tertiary">形状</p><p className="text-sm text-text">{selectedProduct.shape}</p></div>
              <div><p className="text-xs text-text-tertiary">色</p><p className="text-sm text-text">{selectedProduct.color}</p></div>
              <div><p className="text-xs text-text-tertiary">グレード</p><p className="text-sm text-text">{selectedProduct.grade}</p></div>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">ISCC対象</p>
              <p className="text-sm text-text">{selectedProduct.isIscEligible ? "対象" : "非対象"}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
