"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, Pencil, Trash2, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CrMaterialRow = {
  id: string;
  materialNumber: string;
  materialName: string;
  quantity: number;
  arrivalDate: string;
  inspectionDate: string | null;
  status: string;
  chlorineContent: number | null;
  moistureContent: number | null;
  foreignMatter: string | null;
  note: string | null;
  supplier: { id: string; name: string };
};

const statusLabels: Record<string, string> = {
  PENDING: "受入待ち",
  INSPECTING: "検査中",
  PASSED: "合格",
  FAILED: "不合格",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  INSPECTING: "bg-amber-50 text-amber-700",
  PASSED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
};

const statusList = ["PENDING", "INSPECTING", "PASSED", "FAILED"] as const;
const statusOptions = statusList.map((s) => ({ value: s, label: statusLabels[s] }));

type PartnerOption = { id: string; code: string; name: string };

export default function CrMaterialsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const { data: allMaterials, isLoading, mutate } = useSWR<CrMaterialRow[]>(
    "/api/cr/materials",
    fetcher
  );

  const needMasters = showNewModal || showEditModal;
  const { data: suppliers } = useSWR<PartnerOption[]>(
    needMasters ? "/api/masters/partners?type=supplier" : null,
    fetcher
  );

  const materials = allMaterials ?? [];

  const filtered = materials.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.materialNumber.toLowerCase().includes(q) ||
        m.supplier.name.toLowerCase().includes(q) ||
        m.materialName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selected = materials.find((m) => m.id === showDetail);

  const [newForm, setNewForm] = useState({
    supplierId: "", materialName: "", quantity: "", arrivalDate: new Date().toISOString().split("T")[0], note: "",
  });

  const [editForm, setEditForm] = useState({
    supplierId: "", materialName: "", quantity: "", arrivalDate: "", status: "",
    chlorineContent: "", moistureContent: "", foreignMatter: "", note: "",
  });

  const resetNewForm = () => setNewForm({
    supplierId: "", materialName: "", quantity: "", arrivalDate: new Date().toISOString().split("T")[0], note: "",
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/cr/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: newForm.supplierId,
          materialName: newForm.materialName,
          quantity: parseFloat(newForm.quantity),
          arrivalDate: newForm.arrivalDate,
          note: newForm.note || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      resetNewForm();
      mutate();
      showToast("原料受入を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const openEdit = (m: CrMaterialRow) => {
    setEditingId(m.id);
    setEditForm({
      supplierId: m.supplier.id,
      materialName: m.materialName,
      quantity: String(m.quantity),
      arrivalDate: m.arrivalDate.split("T")[0],
      status: m.status,
      chlorineContent: m.chlorineContent != null ? String(m.chlorineContent) : "",
      moistureContent: m.moistureContent != null ? String(m.moistureContent) : "",
      foreignMatter: m.foreignMatter ?? "",
      note: m.note ?? "",
    });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/cr/materials/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: editForm.supplierId,
          materialName: editForm.materialName,
          quantity: parseFloat(editForm.quantity),
          arrivalDate: editForm.arrivalDate,
          status: editForm.status,
          chlorineContent: editForm.chlorineContent ? parseFloat(editForm.chlorineContent) : null,
          moistureContent: editForm.moistureContent ? parseFloat(editForm.moistureContent) : null,
          foreignMatter: editForm.foreignMatter || null,
          note: editForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      mutate();
      showToast("原料情報を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この原料データを削除しますか？")) return;
    try {
      const res = await fetch(`/api/cr/materials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setShowDetail(null);
      mutate();
      showToast("原料データを削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="原料受入" />
      <div className="p-6 space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">ISCC PLUS認証管理</p>
            <p className="text-xs text-emerald-600">認証原料はSD番号とISCC番号を紐付けて管理。マスバランス方式で投入量を追跡します。</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {statusList.map((status) => {
            const count = materials.filter((m) => m.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button key={status} onClick={() => setStatusFilter(isActive ? "all" : status)}
                className={`p-3 rounded-xl border text-center transition-colors ${isActive ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{statusLabels[status]}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="ロット番号、仕入先で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {statusFilter !== "all" && <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />原料受入登録
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ロット番号</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受入日</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入先</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">原料</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{m.materialNumber}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(m.arrivalDate).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-sm text-text">{m.supplier.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{m.materialName}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">{m.quantity.toLocaleString()} kg</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[m.status] ?? ""}`}>{statusLabels[m.status] ?? m.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDetail(m.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors" title="詳細"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                        <button onClick={() => openEdit(m)} className="p-1 hover:bg-surface-tertiary rounded transition-colors" title="編集"><Pencil className="w-4 h-4 text-text-tertiary" /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-1 hover:bg-red-50 rounded transition-colors" title="削除"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-text-tertiary">データがありません</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border bg-surface-secondary">
              <p className="text-xs text-text-tertiary">{filtered.length}件 / {materials.length}件</p>
            </div>
          </div>
        )}
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="原料受入登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required>
            <FormSelect placeholder="選択" value={newForm.supplierId} onChange={(e) => setNewForm({ ...newForm, supplierId: e.target.value })}
              options={(suppliers ?? []).map((s) => ({ value: s.id, label: `${s.code} ${s.name}` }))} />
          </FormField>
          <FormField label="原料名" required>
            <FormInput placeholder="例: PP廃プラスチック" value={newForm.materialName} onChange={(e) => setNewForm({ ...newForm, materialName: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required>
              <FormInput type="number" placeholder="例: 8000" value={newForm.quantity} onChange={(e) => setNewForm({ ...newForm, quantity: e.target.value })} />
            </FormField>
            <FormField label="受入日" required>
              <FormInput type="date" value={newForm.arrivalDate} onChange={(e) => setNewForm({ ...newForm, arrivalDate: e.target.value })} />
            </FormField>
          </div>
          <FormField label="備考">
            <FormInput placeholder="備考" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="原料 編集"
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required>
            <FormSelect placeholder="選択" value={editForm.supplierId} onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}
              options={(suppliers ?? []).map((s) => ({ value: s.id, label: `${s.code} ${s.name}` }))} />
          </FormField>
          <FormField label="原料名" required>
            <FormInput value={editForm.materialName} onChange={(e) => setEditForm({ ...editForm, materialName: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required>
              <FormInput type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
            </FormField>
            <FormField label="受入日" required>
              <FormInput type="date" value={editForm.arrivalDate} onChange={(e) => setEditForm({ ...editForm, arrivalDate: e.target.value })} />
            </FormField>
          </div>
          <FormField label="ステータス">
            <FormSelect value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={statusOptions} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="塩素含有量(%)">
              <FormInput type="number" placeholder="例: 0.5" value={editForm.chlorineContent} onChange={(e) => setEditForm({ ...editForm, chlorineContent: e.target.value })} />
            </FormField>
            <FormField label="水分含有量(%)">
              <FormInput type="number" placeholder="例: 3.2" value={editForm.moistureContent} onChange={(e) => setEditForm({ ...editForm, moistureContent: e.target.value })} />
            </FormField>
          </div>
          <FormField label="異物情報">
            <FormInput placeholder="異物情報" value={editForm.foreignMatter} onChange={(e) => setEditForm({ ...editForm, foreignMatter: e.target.value })} />
          </FormField>
          <FormField label="備考">
            <FormInput placeholder="備考" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `原料詳細: ${selected.materialNumber}` : ""}
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.materialNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status] ?? ""}`}>{statusLabels[selected.status] ?? selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">仕入先</p><p className="text-sm text-text">{selected.supplier.name}</p></div>
              <div><p className="text-xs text-text-tertiary">受入日</p><p className="text-sm text-text">{new Date(selected.arrivalDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">原料</p><p className="text-sm text-text">{selected.materialName}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} kg</p></div>
            </div>
            {(selected.chlorineContent != null || selected.moistureContent != null) && (
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs font-medium text-text mb-2">検査結果</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-text-tertiary">塩素含有量</p><p className="text-sm text-text">{selected.chlorineContent != null ? `${selected.chlorineContent}%` : "-"}</p></div>
                  <div><p className="text-xs text-text-tertiary">水分含有量</p><p className="text-sm text-text">{selected.moistureContent != null ? `${selected.moistureContent}%` : "-"}</p></div>
                </div>
              </div>
            )}
            {selected.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
}
