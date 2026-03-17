"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, Pencil, Trash2, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OilShipmentRow = { id: string; shipmentNumber: string; oilType: string; quantity: number; unitPrice: number | null; amount: number | null; shipmentDate: string; note: string | null; customer: { id: string; name: string } };
type PartnerOption = { id: string; code: string; name: string };

const oilTypeLabels: Record<string, string> = { LIGHT_OIL: "軽質油", HEAVY_OIL: "重質油", MIXED_OIL: "混合油", RESIDUE: "残渣" };
const oilTypeOptions = [{ value: "LIGHT_OIL", label: "軽質油" }, { value: "HEAVY_OIL", label: "重質油" }, { value: "MIXED_OIL", label: "混合油" }];

export default function OilShipmentsPage() {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const { data: allShipments, isLoading, mutate } = useSWR<OilShipmentRow[]>("/api/cr/oil-shipments", fetcher);
  const needMasters = showNewModal || showEditModal;
  const { data: customers } = useSWR<PartnerOption[]>(needMasters ? "/api/masters/partners?type=customer" : null, fetcher);

  const shipments = allShipments ?? [];
  const filtered = shipments.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.shipmentNumber.toLowerCase().includes(q) || s.customer.name.toLowerCase().includes(q);
  });
  const selected = shipments.find((s) => s.id === showDetail);

  const [newForm, setNewForm] = useState({ customerId: "", oilType: "", quantity: "", unitPrice: "", shipmentDate: new Date().toISOString().split("T")[0], note: "" });
  const [editForm, setEditForm] = useState({ customerId: "", oilType: "", quantity: "", unitPrice: "", shipmentDate: "", note: "" });

  const handleCreate = async () => {
    try {
      const qty = parseFloat(newForm.quantity);
      const price = newForm.unitPrice ? parseFloat(newForm.unitPrice) : undefined;
      const res = await fetch("/api/cr/oil-shipments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: newForm.customerId, oilType: newForm.oilType, quantity: qty, unitPrice: price, amount: price ? qty * price : undefined, shipmentDate: newForm.shipmentDate, note: newForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ customerId: "", oilType: "", quantity: "", unitPrice: "", shipmentDate: new Date().toISOString().split("T")[0], note: "" });
      mutate();
      showToast("出荷を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const openEdit = (s: OilShipmentRow) => {
    setEditingId(s.id);
    setEditForm({ customerId: s.customer.id, oilType: s.oilType, quantity: String(s.quantity), unitPrice: s.unitPrice != null ? String(s.unitPrice) : "", shipmentDate: s.shipmentDate.split("T")[0], note: s.note ?? "" });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      const qty = parseFloat(editForm.quantity);
      const price = editForm.unitPrice ? parseFloat(editForm.unitPrice) : null;
      const res = await fetch(`/api/cr/oil-shipments/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: editForm.customerId, oilType: editForm.oilType, quantity: qty, unitPrice: price, amount: price ? qty * price : null, shipmentDate: editForm.shipmentDate, note: editForm.note || null }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("出荷情報を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この出荷データを削除しますか？")) return;
    try {
      const res = await fetch(`/api/cr/oil-shipments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("出荷データを削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="出荷管理（油化）" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-border bg-surface text-center"><p className="text-2xl font-bold text-text">{shipments.length}</p><p className="text-sm text-text-secondary">出荷件数</p></div>
          <div className="p-4 rounded-xl border border-border bg-surface text-center"><p className="text-2xl font-bold text-text">{shipments.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} L</p><p className="text-sm text-text-secondary">総出荷量</p></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="出荷番号、顧客名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"><Plus className="w-4 h-4" />出荷登録</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /><span className="ml-2 text-sm text-text-secondary">読み込み中...</span></div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ISCC</th>
                <th className="w-24"></th>
              </tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{s.shipmentNumber}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(s.shipmentDate).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-sm text-text">{s.customer.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{oilTypeLabels[s.oilType] ?? s.oilType}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">{s.quantity.toLocaleString()} L</td>
                    <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700"><Shield className="w-3 h-3" />認証</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDetail(s.id)} className="p-1 hover:bg-surface-tertiary rounded" title="詳細"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                        <button onClick={() => openEdit(s)} className="p-1 hover:bg-surface-tertiary rounded" title="編集"><Pencil className="w-4 h-4 text-text-tertiary" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-red-50 rounded" title="削除"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-text-tertiary">データがありません</td></tr>}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border bg-surface-secondary"><p className="text-xs text-text-tertiary">{filtered.length}件</p></div>
          </div>
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="出荷登録（油化）"
        footer={<><button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button></>}>
        <div className="space-y-4">
          <FormField label="顧客" required><FormSelect placeholder="選択" value={newForm.customerId} onChange={(e) => setNewForm({ ...newForm, customerId: e.target.value })} options={(customers ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))} /></FormField>
          <FormField label="製品" required><FormSelect placeholder="選択" value={newForm.oilType} onChange={(e) => setNewForm({ ...newForm, oilType: e.target.value })} options={oilTypeOptions} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(L)" required><FormInput type="number" placeholder="例: 19000" value={newForm.quantity} onChange={(e) => setNewForm({ ...newForm, quantity: e.target.value })} /></FormField>
            <FormField label="単価(円/L)"><FormInput type="number" placeholder="例: 120" value={newForm.unitPrice} onChange={(e) => setNewForm({ ...newForm, unitPrice: e.target.value })} /></FormField>
          </div>
          <FormField label="出荷日" required><FormInput type="date" value={newForm.shipmentDate} onChange={(e) => setNewForm({ ...newForm, shipmentDate: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput placeholder="備考" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="出荷 編集"
        footer={<><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button></>}>
        <div className="space-y-4">
          <FormField label="顧客" required><FormSelect placeholder="選択" value={editForm.customerId} onChange={(e) => setEditForm({ ...editForm, customerId: e.target.value })} options={(customers ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))} /></FormField>
          <FormField label="製品" required><FormSelect value={editForm.oilType} onChange={(e) => setEditForm({ ...editForm, oilType: e.target.value })} options={oilTypeOptions} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(L)" required><FormInput type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} /></FormField>
            <FormField label="単価(円/L)"><FormInput type="number" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} /></FormField>
          </div>
          <FormField label="出荷日" required><FormInput type="date" value={editForm.shipmentDate} onChange={(e) => setEditForm({ ...editForm, shipmentDate: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `出荷詳細: ${selected.shipmentNumber}` : ""}
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.shipmentNumber}</span>
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">出荷完了</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer.name}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷日</p><p className="text-sm text-text">{new Date(selected.shipmentDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">製品</p><p className="text-sm text-text">{oilTypeLabels[selected.oilType] ?? selected.oilType}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} L</p></div>
            </div>
            {(selected.unitPrice != null || selected.amount != null) && (
              <div className="p-3 bg-surface-tertiary rounded-lg grid grid-cols-2 gap-3">
                {selected.unitPrice != null && <div><p className="text-xs text-text-tertiary">単価</p><p className="text-sm text-text">{selected.unitPrice.toLocaleString()} 円/L</p></div>}
                {selected.amount != null && <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm text-text">{selected.amount.toLocaleString()} 円</p></div>}
              </div>
            )}
            {selected.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
}
