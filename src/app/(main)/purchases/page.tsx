"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/toast";
import { usePaginated } from "@/lib/use-paginated";
import { Plus, Download, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

type Purchase = {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  freightCost: number | null;
  packagingType: string | null;
  status: string;
  note: string | null;
  supplier: { id: string; code: string; name: string };
  pickupPartner: { id: string; name: string } | null;
  product: {
    id: string;
    code: string;
    name: { name: string } | null;
    shape: { name: string } | null;
    color: { name: string } | null;
    grade: { name: string } | null;
  };
  warehouse: { id: string; code: string; name: string } | null;
};

const statusEnum: { value: string; label: string }[] = [
  { value: "PLANNED", label: "予定" },
  { value: "RECEIVED", label: "入荷済" },
  { value: "INSPECTED", label: "検査済" },
  { value: "CONFIRMED", label: "確定" },
  { value: "RETURNED", label: "返品" },
];

const statusLabels: Record<string, string> = {
  PLANNED: "予定",
  RECEIVED: "入荷済",
  INSPECTED: "検査済",
  CONFIRMED: "確定",
  RETURNED: "返品",
};

const statusColors: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-700",
  RECEIVED: "bg-blue-50 text-blue-700",
  INSPECTED: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  RETURNED: "bg-red-50 text-red-700",
};

const packagingLabels: Record<string, string> = {
  FLECON: "フレコン",
  PALLET: "パレット",
  STEEL_BOX: "スチール箱",
  PAPER_BAG: "紙袋",
  POST_PALLET: "ポストパレット",
};

type PartnerOption = { id: string; code: string; name: string };
type ProductOption = { id: string; code: string; name: { name: string } | null };
type WarehouseOption = { id: string; code: string; name: string };

export default function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { items: purchases, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<Purchase>(
    `/api/mr/purchases?${params.toString()}`
  );

  // For counting by status (without filter)
  const { data: allPurchases } = useSWR<Purchase[]>("/api/mr/purchases");

  // Master data for create/edit form
  const needMasters = showNewModal || showEditModal;
  const { data: suppliers } = useSWR<PartnerOption[]>(
    needMasters ? "/api/masters/partners?type=supplier" : null
  );
  const { data: products } = useSWR<ProductOption[]>(
    needMasters ? "/api/masters/products" : null
  );
  const { data: warehouses } = useSWR<WarehouseOption[]>(
    needMasters ? "/api/masters/warehouses" : null
  );

  const selected = purchases.find((p) => p.id === showDetail);

  const [newForm, setNewForm] = useState({
    supplierId: "",
    pickupPartnerId: "",
    productId: "",
    packagingType: "",
    warehouseId: "",
    quantity: "",
    unitPrice: "",
    freightCost: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const [editForm, setEditForm] = useState({
    supplierId: "",
    pickupPartnerId: "",
    productId: "",
    packagingType: "",
    warehouseId: "",
    quantity: "",
    unitPrice: "",
    freightCost: "",
    purchaseDate: "",
    status: "",
    note: "",
  });

  const resetForm = () => {
    setNewForm({
      supplierId: "", pickupPartnerId: "", productId: "", packagingType: "",
      warehouseId: "", quantity: "", unitPrice: "", freightCost: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/mr/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: newForm.supplierId,
          pickupPartnerId: newForm.pickupPartnerId || undefined,
          productId: newForm.productId,
          packagingType: newForm.packagingType || undefined,
          warehouseId: newForm.warehouseId || undefined,
          quantity: parseFloat(newForm.quantity),
          unitPrice: parseFloat(newForm.unitPrice),
          freightCost: newForm.freightCost ? parseFloat(newForm.freightCost) : undefined,
          purchaseDate: newForm.purchaseDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      resetForm();
      mutate();
      showToast("入荷を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  // Track which purchase is being edited
  const [editingPurchaseId, setEditingPurchaseId] = useState<string>("");

  const openEditWithId = (p: Purchase) => {
    setEditingPurchaseId(p.id);
    setEditForm({
      supplierId: p.supplier.id,
      pickupPartnerId: p.pickupPartner?.id ?? "",
      productId: p.product.id,
      packagingType: p.packagingType ?? "",
      warehouseId: p.warehouse?.id ?? "",
      quantity: String(p.quantity),
      unitPrice: String(p.unitPrice),
      freightCost: p.freightCost != null ? String(p.freightCost) : "",
      purchaseDate: p.purchaseDate.split("T")[0],
      status: p.status,
      note: p.note ?? "",
    });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editingPurchaseId) return;
    try {
      const res = await fetch(`/api/mr/purchases/${editingPurchaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: editForm.supplierId,
          pickupPartnerId: editForm.pickupPartnerId || undefined,
          productId: editForm.productId,
          packagingType: editForm.packagingType || undefined,
          warehouseId: editForm.warehouseId || undefined,
          quantity: parseFloat(editForm.quantity),
          unitPrice: parseFloat(editForm.unitPrice),
          freightCost: editForm.freightCost ? parseFloat(editForm.freightCost) : undefined,
          purchaseDate: editForm.purchaseDate,
          status: editForm.status,
          note: editForm.note || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      mutate();
      showToast("入荷情報を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この入荷データを削除しますか？")) return;
    try {
      const res = await fetch(`/api/mr/purchases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setShowDetail(null);
      mutate();
      showToast("入荷データを削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="仕入・受入管理" />
      <div className="p-6 space-y-4">
        {/* 統計 */}
        <div className="grid grid-cols-5 gap-3">
          {statusEnum.map(({ value, label }) => {
            const count = allPurchases?.filter((p) => p.status === value).length ?? 0;
            return (
              <button key={value} onClick={() => setStatusFilter(statusFilter === value ? "all" : value)}
                className={`p-3 rounded-xl border text-center transition-colors ${statusFilter === value ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{label}</p>
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
            <button onClick={() => {
              fetch("/api/export/excel?type=purchases").then(r => r.blob()).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "仕入一覧.xlsx"; a.click();
                URL.revokeObjectURL(url);
                showToast("Excelファイルをダウンロードしました", "success");
              }).catch(() => showToast("ダウンロードに失敗しました", "error"));
            }} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <Download className="w-4 h-4" />Excel出力
            </button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" />入荷登録
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入先 / 引取先</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量(kg)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.purchaseNumber}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{new Date(p.purchaseDate).toLocaleDateString("ja-JP")}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text">{p.supplier.name}</p>
                        <p className="text-xs text-text-tertiary">{p.pickupPartner?.name ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{p.product.code}</span>
                        <p className="text-xs text-text-tertiary mt-0.5">{p.packagingType ? packagingLabels[p.packagingType] ?? p.packagingType : "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-text text-right font-medium">{p.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-text text-right">¥{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[p.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {statusLabels[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowDetail(p.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors" title="詳細">
                            <Eye className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => openEditWithId(p)} className="p-1 hover:bg-surface-tertiary rounded transition-colors" title="編集">
                            <Pencil className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-50 rounded transition-colors" title="削除">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        データがありません
                      </td>
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
      </div>

      {/* 入荷登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="入荷登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required>
            <FormSelect
              placeholder="選択"
              value={newForm.supplierId}
              onChange={(e) => setNewForm({ ...newForm, supplierId: e.target.value })}
              options={(suppliers ?? []).map((s) => ({ value: s.id, label: `${s.code} ${s.name}` }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="倉庫">
              <FormSelect
                placeholder="選択"
                value={newForm.warehouseId}
                onChange={(e) => setNewForm({ ...newForm, warehouseId: e.target.value })}
                options={(warehouses ?? []).map((w) => ({ value: w.id, label: `${w.code} ${w.name}` }))}
              />
            </FormField>
            <FormField label="荷姿">
              <FormSelect
                placeholder="選択"
                value={newForm.packagingType}
                onChange={(e) => setNewForm({ ...newForm, packagingType: e.target.value })}
                options={[
                  { value: "FLECON", label: "フレコン" },
                  { value: "PALLET", label: "パレット" },
                  { value: "STEEL_BOX", label: "スチール箱" },
                  { value: "PAPER_BAG", label: "紙袋" },
                  { value: "POST_PALLET", label: "ポストパレット" },
                ]}
              />
            </FormField>
          </div>
          <FormField label="品目" required>
            <FormSelect
              placeholder="4軸コードで選択"
              value={newForm.productId}
              onChange={(e) => setNewForm({ ...newForm, productId: e.target.value })}
              options={(products ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name?.name ?? ""}` }))}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="数量(kg)" required>
              <FormInput type="number" placeholder="例: 3200" value={newForm.quantity} onChange={(e) => setNewForm({ ...newForm, quantity: e.target.value })} />
            </FormField>
            <FormField label="単価(円/kg)" required>
              <FormInput type="number" placeholder="例: 85" value={newForm.unitPrice} onChange={(e) => setNewForm({ ...newForm, unitPrice: e.target.value })} />
            </FormField>
            <FormField label="運賃(円)">
              <FormInput type="number" placeholder="例: 35000" value={newForm.freightCost} onChange={(e) => setNewForm({ ...newForm, freightCost: e.target.value })} />
            </FormField>
          </div>
          <FormField label="仕入日" required>
            <FormInput type="date" value={newForm.purchaseDate} onChange={(e) => setNewForm({ ...newForm, purchaseDate: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="入荷 編集"
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required>
            <FormSelect
              placeholder="選択"
              value={editForm.supplierId}
              onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}
              options={(suppliers ?? []).map((s) => ({ value: s.id, label: `${s.code} ${s.name}` }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="倉庫">
              <FormSelect
                placeholder="選択"
                value={editForm.warehouseId}
                onChange={(e) => setEditForm({ ...editForm, warehouseId: e.target.value })}
                options={(warehouses ?? []).map((w) => ({ value: w.id, label: `${w.code} ${w.name}` }))}
              />
            </FormField>
            <FormField label="荷姿">
              <FormSelect
                placeholder="選択"
                value={editForm.packagingType}
                onChange={(e) => setEditForm({ ...editForm, packagingType: e.target.value })}
                options={[
                  { value: "FLECON", label: "フレコン" },
                  { value: "PALLET", label: "パレット" },
                  { value: "STEEL_BOX", label: "スチール箱" },
                  { value: "PAPER_BAG", label: "紙袋" },
                  { value: "POST_PALLET", label: "ポストパレット" },
                ]}
              />
            </FormField>
          </div>
          <FormField label="品目" required>
            <FormSelect
              placeholder="4軸コードで選択"
              value={editForm.productId}
              onChange={(e) => setEditForm({ ...editForm, productId: e.target.value })}
              options={(products ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name?.name ?? ""}` }))}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="数量(kg)" required>
              <FormInput type="number" placeholder="例: 3200" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
            </FormField>
            <FormField label="単価(円/kg)" required>
              <FormInput type="number" placeholder="例: 85" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
            </FormField>
            <FormField label="運賃(円)">
              <FormInput type="number" placeholder="例: 35000" value={editForm.freightCost} onChange={(e) => setEditForm({ ...editForm, freightCost: e.target.value })} />
            </FormField>
          </div>
          <FormField label="仕入日" required>
            <FormInput type="date" value={editForm.purchaseDate} onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })} />
          </FormField>
          <FormField label="ステータス">
            <FormSelect
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={statusEnum}
            />
          </FormField>
          <FormField label="備考">
            <FormInput placeholder="備考" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `仕入詳細: ${selected.purchaseNumber}` : ""}
        footer={<>
          <button onClick={() => selected && openEditWithId(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.purchaseNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status] ?? "bg-gray-100 text-gray-700"}`}>
                {statusLabels[selected.status] ?? selected.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">仕入先</p><p className="text-sm text-text">{selected.supplier.name}</p></div>
              <div><p className="text-xs text-text-tertiary">引取先</p><p className="text-sm text-text">{selected.pickupPartner?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{new Date(selected.purchaseDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">倉庫</p><p className="text-sm text-text">{selected.warehouse?.name ?? "-"}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm font-mono text-text">{selected.product.code}</p><p className="text-xs text-text-secondary">{selected.product.name?.name ?? "-"}</p></div>
                <div><p className="text-xs text-text-tertiary">荷姿</p><p className="text-sm text-text">{selected.packagingType ? packagingLabels[selected.packagingType] ?? selected.packagingType : "-"}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} kg</p></div>
              <div><p className="text-xs text-text-tertiary">単価</p><p className="text-sm text-text">¥{selected.unitPrice}/kg</p></div>
              <div><p className="text-xs text-text-tertiary">小計</p><p className="text-sm font-medium text-text">¥{selected.amount.toLocaleString()}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">運賃</p><p className="text-sm text-text">{selected.freightCost != null ? `¥${selected.freightCost.toLocaleString()}` : "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">合計（在庫原価算入）</p><p className="text-sm font-bold text-primary-700">¥{(selected.amount + (selected.freightCost ?? 0)).toLocaleString()}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
