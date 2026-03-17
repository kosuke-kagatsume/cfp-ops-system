"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormSelect, FormInput } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Download, Search, MoreHorizontal, CheckCircle, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type AxisItem = { id: string; code: number; name: string };
type Product = {
  id: string;
  code: string;
  isIsccEligible: boolean;
  isOilProduct: boolean;
  name: AxisItem;
  shape: AxisItem;
  color: AxisItem;
  grade: AxisItem;
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { items: products, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<Product>(
    `/api/masters/products?${params.toString(
  )}`
  );
  const { data: productNames } = useSWR<AxisItem[]>("/api/masters/product-names");
  const { data: productShapes } = useSWR<AxisItem[]>("/api/masters/product-shapes");
  const { data: productColors } = useSWR<AxisItem[]>("/api/masters/product-colors");
  const { data: productGrades } = useSWR<AxisItem[]>("/api/masters/product-grades");

  const selectedProduct = products.find((p) => p.id === showDetailModal);

  // 編集用
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ isIsccEligible: false, displayName: "" });

  // 新規登録フォーム
  const [newForm, setNewForm] = useState({
    nameId: "", shapeId: "", colorId: "", gradeId: "", isIsccEligible: false,
  });

  const handleCreate = async () => {
    if (!newForm.nameId || !newForm.shapeId || !newForm.colorId || !newForm.gradeId) {
      showToast("4軸すべてを選択してください", "warning");
      return;
    }
    try {
      const res = await fetch("/api/masters/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      setShowNewModal(false);
      setNewForm({ nameId: "", shapeId: "", colorId: "", gradeId: "", isIsccEligible: false });
      mutate();
      showToast("品目を登録しました", "success");
    } catch {
      showToast("登録に失敗しました（重複の可能性があります）", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この品目を削除しますか？")) return;
    try {
      await fetch(`/api/masters/products/${id}`, { method: "DELETE" });
      mutate();
      showToast("品目を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
    setMenuOpen(null);
  };

  const openEdit = (product: Product) => {
    setEditId(product.id);
    setEditForm({
      isIsccEligible: product.isIsccEligible,
      displayName: "",
    });
    setShowEditModal(true);
    setMenuOpen(null);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/masters/products/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      setEditId(null);
      mutate();
      showToast("品目を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const editingProduct = products.find((p) => p.id === editId);

  // 生成コードプレビュー
  const previewCode = [
    productNames?.find((n) => n.id === newForm.nameId)?.code,
    productShapes?.find((s) => s.id === newForm.shapeId)?.code,
    productColors?.find((c) => c.id === newForm.colorId)?.code,
    productGrades?.find((g) => g.id === newForm.gradeId)?.code,
  ].filter(Boolean).join("-") || "---";

  return (
    <>
      <Header title="品目マスタ" />
      <div className="p-6 space-y-4">
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800">品目コード体系: 品名 x 形状 x 色 x グレード（4軸）</p>
          <p className="text-xs text-primary-600 mt-1">例: 1-1-1-1 = PP / ペレット / ナチュラル / 素材品</p>
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
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDetailModal(product.id)} className="text-sm font-mono font-medium text-text bg-surface-tertiary px-2 py-0.5 rounded hover:bg-primary-100 transition-colors">
                          {product.code}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">{product.name.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">
                          {product.shape.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{product.color.name}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{product.grade.name}</td>
                      <td className="px-4 py-3 text-center">
                        {product.isIsccEligible ? (
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
                            <button onClick={() => openEdit(product)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary">
                              <Edit className="w-4 h-4" /> 編集
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-tertiary">
                              <Trash2 className="w-4 h-4" /> 削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-tertiary">品目が登録されていません</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
            </>
          )}
        </div>

        {/* 4軸マスタカード */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "品名", count: productNames?.length ?? 0, desc: "PP/PE/PET/PS/エンプラ等" },
            { label: "形状", count: productShapes?.length ?? 0, desc: "ペレット/フレーク/粉砕等" },
            { label: "色", count: productColors?.length ?? 0, desc: "N/白/黒/グレー等" },
            { label: "グレード", count: productGrades?.length ?? 0, desc: "素材品/再生ペレット等" },
          ].map((axis) => (
            <div
              key={axis.label}
              className="bg-surface rounded-xl border border-border p-4 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text">{axis.label}</span>
                <span className="text-lg font-bold text-primary-600">{axis.count}</span>
              </div>
              <p className="text-xs text-text-tertiary">{axis.desc}</p>
            </div>
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
            <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              登録する
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-text-tertiary bg-surface-tertiary p-3 rounded-lg">4つの軸を選択すると品目コードが自動生成されます</p>
          <FormField label="品名" required>
            <FormSelect placeholder="選択してください" value={newForm.nameId} onChange={(e) => setNewForm({ ...newForm, nameId: e.target.value })}
              options={productNames?.map((n) => ({ value: n.id, label: n.name })) ?? []} />
          </FormField>
          <FormField label="形状" required>
            <FormSelect placeholder="選択してください" value={newForm.shapeId} onChange={(e) => setNewForm({ ...newForm, shapeId: e.target.value })}
              options={productShapes?.map((s) => ({ value: s.id, label: s.name })) ?? []} />
          </FormField>
          <FormField label="色" required>
            <FormSelect placeholder="選択してください" value={newForm.colorId} onChange={(e) => setNewForm({ ...newForm, colorId: e.target.value })}
              options={productColors?.map((c) => ({ value: c.id, label: c.name })) ?? []} />
          </FormField>
          <FormField label="グレード" required>
            <FormSelect placeholder="選択してください" value={newForm.gradeId} onChange={(e) => setNewForm({ ...newForm, gradeId: e.target.value })}
              options={productGrades?.map((g) => ({ value: g.id, label: g.name })) ?? []} />
          </FormField>
          <div className="p-3 bg-surface-tertiary rounded-lg">
            <p className="text-xs text-text-tertiary">生成コード:</p>
            <p className="text-sm font-mono font-bold text-primary-700 mt-1">{previewCode}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="iscc-product" className="rounded border-border" checked={newForm.isIsccEligible} onChange={(e) => setNewForm({ ...newForm, isIsccEligible: e.target.checked })} />
            <label htmlFor="iscc-product" className="text-sm text-text">ISCC PLUS対象品目</label>
          </div>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingProduct ? `品目 編集: ${editingProduct.code}` : "品目 編集"}
        footer={
          <>
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              キャンセル
            </button>
            <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              更新する
            </button>
          </>
        }
      >
        {editingProduct && (
          <div className="space-y-4">
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <p className="text-xs text-text-tertiary">品目コード（変更不可）</p>
              <p className="text-sm font-mono font-bold text-primary-700 mt-1">{editingProduct.code}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">品名</p><p className="text-sm text-text">{editingProduct.name.name}</p></div>
              <div><p className="text-xs text-text-tertiary">形状</p><p className="text-sm text-text">{editingProduct.shape.name}</p></div>
              <div><p className="text-xs text-text-tertiary">色</p><p className="text-sm text-text">{editingProduct.color.name}</p></div>
              <div><p className="text-xs text-text-tertiary">グレード</p><p className="text-sm text-text">{editingProduct.grade.name}</p></div>
            </div>
            <FormField label="表示名（任意）">
              <FormInput placeholder="例: PP白ペレット素材品" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
            </FormField>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-iscc-product" className="rounded border-border" checked={editForm.isIsccEligible} onChange={(e) => setEditForm({ ...editForm, isIsccEligible: e.target.checked })} />
              <label htmlFor="edit-iscc-product" className="text-sm text-text">ISCC PLUS対象品目</label>
            </div>
          </div>
        )}
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
              <div><p className="text-xs text-text-tertiary">品名</p><p className="text-sm text-text">{selectedProduct.name.name}</p></div>
              <div><p className="text-xs text-text-tertiary">形状</p><p className="text-sm text-text">{selectedProduct.shape.name}</p></div>
              <div><p className="text-xs text-text-tertiary">色</p><p className="text-sm text-text">{selectedProduct.color.name}</p></div>
              <div><p className="text-xs text-text-tertiary">グレード</p><p className="text-sm text-text">{selectedProduct.grade.name}</p></div>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">ISCC対象</p>
              <p className="text-sm text-text">{selectedProduct.isIsccEligible ? "対象" : "非対象"}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
