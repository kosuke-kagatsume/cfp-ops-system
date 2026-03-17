"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Download, Search, MoreHorizontal, AlertTriangle, Edit, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PriceRecord = {
  id: string;
  unitPrice: number;
  currency: string;
  validFrom: string;
  validTo: string | null;
  partner: { id: string; code: string; name: string };
  product: {
    id: string;
    code: string;
    name: { name: string };
    shape: { name: string };
    color: { name: string };
    grade: { name: string };
  };
};

type Partner = { id: string; code: string; name: string; isCustomer: boolean };
type Product = { id: string; code: string; name: { name: string } };

export default function PricesPage() {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { data: prices, isLoading, mutate } = useSWR<PriceRecord[]>(
    `/api/masters/prices?${params.toString()}`,
    fetcher
  );
  const { data: partners } = useSWR<Partner[]>("/api/masters/partners", fetcher);
  const { data: products } = useSWR<Product[]>("/api/masters/products", fetcher);

  const today = new Date().toISOString().slice(0, 10);

  // 編集用
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    partnerId: "", productId: "", unitPrice: "",
    currency: "JPY", validFrom: "", validTo: "", note: "",
  });

  // 新規フォーム
  const [newForm, setNewForm] = useState({
    partnerId: "", productId: "", unitPrice: "",
    currency: "JPY", validFrom: "2026-04-01", validTo: "2027-03-31",
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/masters/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newForm,
          unitPrice: parseFloat(newForm.unitPrice),
        }),
      });
      if (!res.ok) throw new Error();
      setShowNewModal(false);
      setNewForm({ partnerId: "", productId: "", unitPrice: "", currency: "JPY", validFrom: "2026-04-01", validTo: "2027-03-31" });
      mutate();
      showToast("単価を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const openEdit = (price: PriceRecord) => {
    setEditId(price.id);
    setEditForm({
      partnerId: price.partner.id,
      productId: price.product.id,
      unitPrice: String(price.unitPrice),
      currency: price.currency,
      validFrom: price.validFrom.slice(0, 10),
      validTo: price.validTo?.slice(0, 10) ?? "",
      note: "",
    });
    setShowEditModal(true);
    setMenuOpen(null);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/masters/prices/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          unitPrice: parseFloat(editForm.unitPrice),
          validTo: editForm.validTo || null,
        }),
      });
      if (!res.ok) throw new Error();
      setShowEditModal(false);
      setEditId(null);
      mutate();
      showToast("単価を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この単価レコードを削除しますか？")) return;
    try {
      await fetch(`/api/masters/prices/${id}`, { method: "DELETE" });
      mutate();
      showToast("単価を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
    setMenuOpen(null);
  };

  const customerPartners = partners?.filter((p) => p.isCustomer) ?? [];

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
                  {prices?.map((price) => {
                    const validTo = price.validTo?.slice(0, 10) ?? "";
                    const validFrom = price.validFrom.slice(0, 10);
                    const isExpired = validTo && validTo < today;
                    const isExpiring = validTo && !isExpired && validTo <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
                    const productLabel = `${price.product.name.name} ${price.product.shape.name} ${price.product.color.name} ${price.product.grade.name}`;
                    return (
                      <tr key={price.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-text">{price.partner.name}</td>
                        <td className="px-4 py-3"><span className="text-sm font-mono bg-surface-tertiary px-2 py-0.5 rounded">{price.product.code}</span></td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{productLabel}</td>
                        <td className="px-4 py-3 text-sm font-medium text-text text-right">
                          {price.currency === "JPY" ? `¥${price.unitPrice.toLocaleString()}` : `$${price.unitPrice.toLocaleString()}`}
                          <span className="text-xs text-text-tertiary">/kg</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{price.currency}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{validFrom} 〜 {validTo || "無期限"}</td>
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
                              <button onClick={() => openEdit(price)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"><Edit className="w-4 h-4" /> 編集</button>
                              <button onClick={() => handleDelete(price.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-tertiary"><Trash2 className="w-4 h-4" /> 削除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {prices?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">単価が登録されていません</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary">
                <p className="text-xs text-text-tertiary">{prices?.length ?? 0}件</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="単価 編集"
        footer={
          <>
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
            <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">更新する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="取引先" required>
            <FormSelect placeholder="選択" value={editForm.partnerId} onChange={(e) => setEditForm({ ...editForm, partnerId: e.target.value })}
              options={customerPartners.map((p) => ({ value: p.id, label: p.name }))} />
          </FormField>
          <FormField label="品目" required>
            <FormSelect placeholder="選択" value={editForm.productId} onChange={(e) => setEditForm({ ...editForm, productId: e.target.value })}
              options={products?.map((p) => ({ value: p.id, label: `${p.code} - ${p.name.name}` })) ?? []} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="単価" required>
              <FormInput type="number" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
            </FormField>
            <FormField label="通貨" required>
              <FormSelect value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                options={[{ value: "JPY", label: "JPY (円)" }, { value: "USD", label: "USD (ドル)" }, { value: "SGD", label: "SGD" }]} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="有効開始日" required>
              <FormInput type="date" value={editForm.validFrom} onChange={(e) => setEditForm({ ...editForm, validFrom: e.target.value })} />
            </FormField>
            <FormField label="有効終了日">
              <FormInput type="date" value={editForm.validTo} onChange={(e) => setEditForm({ ...editForm, validTo: e.target.value })} />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* 新規登録モーダル */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="単価 新規登録"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録申請</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">単価の登録・変更は承認ワークフローを通ります（営業マネージャー → 社長）</p>
          </div>
          <FormField label="取引先" required>
            <FormSelect placeholder="選択" value={newForm.partnerId} onChange={(e) => setNewForm({ ...newForm, partnerId: e.target.value })}
              options={customerPartners.map((p) => ({ value: p.id, label: p.name }))} />
          </FormField>
          <FormField label="品目" required>
            <FormSelect placeholder="選択" value={newForm.productId} onChange={(e) => setNewForm({ ...newForm, productId: e.target.value })}
              options={products?.map((p) => ({ value: p.id, label: `${p.code} - ${p.name.name}` })) ?? []} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="単価" required>
              <FormInput type="number" placeholder="例: 185" value={newForm.unitPrice} onChange={(e) => setNewForm({ ...newForm, unitPrice: e.target.value })} />
            </FormField>
            <FormField label="通貨" required>
              <FormSelect value={newForm.currency} onChange={(e) => setNewForm({ ...newForm, currency: e.target.value })}
                options={[{ value: "JPY", label: "JPY (円)" }, { value: "USD", label: "USD (ドル)" }, { value: "SGD", label: "SGD" }]} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="有効開始日" required>
              <FormInput type="date" value={newForm.validFrom} onChange={(e) => setNewForm({ ...newForm, validFrom: e.target.value })} />
            </FormField>
            <FormField label="有効終了日">
              <FormInput type="date" value={newForm.validTo} onChange={(e) => setNewForm({ ...newForm, validTo: e.target.value })} />
            </FormField>
          </div>
        </div>
      </Modal>
    </>
  );
}
