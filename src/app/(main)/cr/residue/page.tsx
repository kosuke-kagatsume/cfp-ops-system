"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Trash2, Plus, TrendingUp, AlertTriangle, Pencil, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type ResidueRow = { id: string; disposalDate: string; quantity: number; disposalMethod: string | null; disposalCost: number | null; contractor: string | null; note: string | null };

export default function CrResiduePage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const { items: allResidues, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<ResidueRow>(
    "/api/cr/residue"
  );
  const residues = allResidues ?? [];
  const selected = residues.find((r) => r.id === showDetail);
  const totalQuantity = residues.reduce((sum, r) => sum + r.quantity, 0);

  const [newForm, setNewForm] = useState({ disposalDate: new Date().toISOString().split("T")[0], quantity: "", disposalMethod: "", disposalCost: "", contractor: "", note: "" });
  const [editForm, setEditForm] = useState({ disposalDate: "", quantity: "", disposalMethod: "", disposalCost: "", contractor: "", note: "" });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/cr/residue", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disposalDate: newForm.disposalDate, quantity: parseFloat(newForm.quantity), disposalMethod: newForm.disposalMethod || undefined, disposalCost: newForm.disposalCost ? parseFloat(newForm.disposalCost) : undefined, contractor: newForm.contractor || undefined, note: newForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ disposalDate: new Date().toISOString().split("T")[0], quantity: "", disposalMethod: "", disposalCost: "", contractor: "", note: "" });
      mutate();
      showToast("残渣記録を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const openEdit = (r: ResidueRow) => {
    setEditingId(r.id);
    setEditForm({ disposalDate: r.disposalDate.split("T")[0], quantity: String(r.quantity), disposalMethod: r.disposalMethod ?? "", disposalCost: r.disposalCost != null ? String(r.disposalCost) : "", contractor: r.contractor ?? "", note: r.note ?? "" });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      const res = await fetch(`/api/cr/residue/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disposalDate: editForm.disposalDate, quantity: parseFloat(editForm.quantity), disposalMethod: editForm.disposalMethod || null, disposalCost: editForm.disposalCost ? parseFloat(editForm.disposalCost) : null, contractor: editForm.contractor || null, note: editForm.note || null }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("残渣記録を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この残渣記録を削除しますか？")) return;
    try {
      const res = await fetch(`/api/cr/residue/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("残渣記録を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="残渣管理" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4"><div className="flex items-center gap-2 mb-1"><Trash2 className="w-4 h-4 text-text-tertiary" /><p className="text-xs text-text-tertiary">総排出量</p></div><p className="text-2xl font-bold text-text">{totalQuantity.toLocaleString()} kg</p></div>
          <div className="bg-surface rounded-xl border border-border p-4"><div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-500" /><p className="text-xs text-text-tertiary">登録件数</p></div><p className="text-2xl font-bold text-text">{residues.length}件</p></div>
          <div className="bg-surface rounded-xl border border-border p-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-text-tertiary" /><p className="text-xs text-text-tertiary">平均残渣率</p></div><p className="text-2xl font-bold text-text">---</p></div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" /><div><p className="text-sm font-medium text-amber-800">産業廃棄物マニフェスト管理</p><p className="text-xs text-amber-600">全ての残渣はマニフェスト番号と紐付けて管理。処理完了後にマニフェストの返送確認を行います。</p></div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">{residues.length}件の残渣記録</p>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"><Plus className="w-4 h-4" />残渣記録登録</button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /><span className="ml-2 text-sm text-text-secondary">読み込み中...</span></div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">処理方法</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">処理委託先</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">処理費用</th>
                <th className="w-24"></th>
              </tr></thead>
              <tbody>
                {residues.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(r.disposalDate).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">{r.quantity.toLocaleString()} kg</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{r.disposalMethod ?? "---"}</td>
                    <td className="px-4 py-3 text-sm text-text">{r.contractor ?? "---"}</td>
                    <td className="px-4 py-3 text-sm text-text text-right">{r.disposalCost != null ? `${r.disposalCost.toLocaleString()} 円` : "---"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDetail(r.id)} className="p-1 hover:bg-surface-tertiary rounded text-text-tertiary text-xs">詳細</button>
                        <button onClick={() => openEdit(r)} className="p-1 hover:bg-surface-tertiary rounded"><Pencil className="w-3.5 h-3.5 text-text-tertiary" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border bg-surface-secondary"><Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} /></div>
          </div>
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="残渣記録登録"
        footer={<><button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 390" value={newForm.quantity} onChange={(e) => setNewForm({ ...newForm, quantity: e.target.value })} /></FormField>
            <FormField label="記録日" required><FormInput type="date" value={newForm.disposalDate} onChange={(e) => setNewForm({ ...newForm, disposalDate: e.target.value })} /></FormField>
          </div>
          <FormField label="処理方法"><FormInput placeholder="例: 産廃処理" value={newForm.disposalMethod} onChange={(e) => setNewForm({ ...newForm, disposalMethod: e.target.value })} /></FormField>
          <FormField label="処理委託先"><FormInput placeholder="例: 広島環境サービス" value={newForm.contractor} onChange={(e) => setNewForm({ ...newForm, contractor: e.target.value })} /></FormField>
          <FormField label="処理費用(円)"><FormInput type="number" placeholder="例: 50000" value={newForm.disposalCost} onChange={(e) => setNewForm({ ...newForm, disposalCost: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="残渣記録 編集"
        footer={<><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} /></FormField>
            <FormField label="記録日" required><FormInput type="date" value={editForm.disposalDate} onChange={(e) => setEditForm({ ...editForm, disposalDate: e.target.value })} /></FormField>
          </div>
          <FormField label="処理方法"><FormInput value={editForm.disposalMethod} onChange={(e) => setEditForm({ ...editForm, disposalMethod: e.target.value })} /></FormField>
          <FormField label="処理委託先"><FormInput value={editForm.contractor} onChange={(e) => setEditForm({ ...editForm, contractor: e.target.value })} /></FormField>
          <FormField label="処理費用(円)"><FormInput type="number" value={editForm.disposalCost} onChange={(e) => setEditForm({ ...editForm, disposalCost: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="残渣詳細"
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{new Date(selected.disposalDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} kg</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg grid grid-cols-2 gap-3">
              <div><p className="text-xs text-text-tertiary">処理方法</p><p className="text-sm text-text">{selected.disposalMethod ?? "---"}</p></div>
              <div><p className="text-xs text-text-tertiary">処理委託先</p><p className="text-sm text-text">{selected.contractor ?? "---"}</p></div>
              <div><p className="text-xs text-text-tertiary">処理費用</p><p className="text-sm text-text">{selected.disposalCost != null ? `${selected.disposalCost.toLocaleString()} 円` : "---"}</p></div>
            </div>
            {selected.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
}
