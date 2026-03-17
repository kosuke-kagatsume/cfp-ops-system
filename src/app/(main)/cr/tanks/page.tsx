"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, AlertTriangle, Droplets, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type TankRow = { id: string; code: string; name: string; tankType: string; capacity: number; currentLevel: number; plant: { id: string; code: string; name: string } };
type PlantOption = { id: string; code: string; name: string };

const tankTypeLabels: Record<string, string> = { LIGHT_OIL: "軽質油", HEAVY_OIL: "重質油", MIXED_OIL: "混合油", RESIDUE: "残渣" };
const tankTypeColors: Record<string, string> = { LIGHT_OIL: "bg-yellow-50 text-yellow-700", HEAVY_OIL: "bg-orange-50 text-orange-700", MIXED_OIL: "bg-blue-50 text-blue-700", RESIDUE: "bg-gray-100 text-gray-700" };
const tankTypeList = ["LIGHT_OIL", "HEAVY_OIL", "MIXED_OIL", "RESIDUE"] as const;
const tankTypeOptions = tankTypeList.map((t) => ({ value: t, label: tankTypeLabels[t] }));
const specificGravityMap: Record<string, number> = { LIGHT_OIL: 0.78, HEAVY_OIL: 0.92, MIXED_OIL: 0.85, RESIDUE: 1.1 };

export default function CrTanksPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const { items: allTanks, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<TankRow>(
    "/api/cr/tanks"
  );
  const needMasters = showNewModal || showEditModal;
  const { data: plants } = useSWR<PlantOption[]>(needMasters ? "/api/masters/plants" : null);

  const tanks = allTanks ?? [];
  const filtered = tanks.filter((t) => typeFilter === "all" || t.tankType === typeFilter);
  const selected = tanks.find((t) => t.id === showDetail);

  const toKl = (liters: number) => Math.round((liters / 1000) * 10) / 10;
  const getPercentage = (t: TankRow) => t.capacity > 0 ? Math.round((t.currentLevel / t.capacity) * 100) : 0;
  const toKg = (liters: number, tankType: string) => Math.round(liters * (specificGravityMap[tankType] ?? 0.85));

  const totalCapacity = tanks.reduce((sum, t) => sum + toKl(t.capacity), 0);
  const totalCurrent = tanks.reduce((sum, t) => sum + toKl(t.currentLevel), 0);

  const [newForm, setNewForm] = useState({ code: "", name: "", tankType: "", plantId: "", capacity: "" });
  const [editForm, setEditForm] = useState({ code: "", name: "", tankType: "", plantId: "", capacity: "", currentLevel: "" });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/cr/tanks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newForm.code, name: newForm.name, tankType: newForm.tankType, plantId: newForm.plantId, capacity: parseFloat(newForm.capacity) }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ code: "", name: "", tankType: "", plantId: "", capacity: "" });
      mutate();
      showToast("タンクを登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const openEdit = (t: TankRow) => {
    setEditingId(t.id);
    setEditForm({ code: t.code, name: t.name, tankType: t.tankType, plantId: t.plant.id, capacity: String(t.capacity), currentLevel: String(t.currentLevel) });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      const res = await fetch(`/api/cr/tanks/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editForm.code, name: editForm.name, tankType: editForm.tankType, plantId: editForm.plantId, capacity: parseFloat(editForm.capacity), currentLevel: parseFloat(editForm.currentLevel) }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("タンク情報を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このタンクを削除しますか？")) return;
    try {
      const res = await fetch(`/api/cr/tanks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("タンクを削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="タンク管理" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4"><p className="text-xs text-text-tertiary">総タンク数</p><p className="text-2xl font-bold text-text">{tanks.length}基</p></div>
          <div className="bg-surface rounded-xl border border-border p-4"><p className="text-xs text-text-tertiary">総容量</p><p className="text-2xl font-bold text-text">{totalCapacity} kL</p></div>
          <div className="bg-surface rounded-xl border border-border p-4"><p className="text-xs text-text-tertiary">現在保有量</p><p className="text-2xl font-bold text-text">{totalCurrent.toFixed(1)} kL</p></div>
          <div className="bg-surface rounded-xl border border-border p-4"><p className="text-xs text-text-tertiary">平均充填率</p><p className="text-2xl font-bold text-text">{totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0}%</p></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setTypeFilter("all")} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${typeFilter === "all" ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>すべて</button>
            {tankTypeList.map((type) => (
              <button key={type} onClick={() => setTypeFilter(type)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${typeFilter === type ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>{tankTypeLabels[type]}</button>
            ))}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />タンク登録
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /><span className="ml-2 text-sm text-text-secondary">読み込み中...</span></div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((t) => {
              const percentage = getPercentage(t);
              const currentKl = toKl(t.currentLevel);
              const capacityKl = toKl(t.capacity);
              const currentKg = toKg(t.currentLevel, t.tankType);
              const sg = specificGravityMap[t.tankType] ?? 0.85;
              const isHigh = percentage >= 80;
              const isLow = percentage <= 20;
              return (
                <div key={t.id} className="bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-text-tertiary" />
                      <button onClick={() => setShowDetail(t.id)} className="text-sm font-medium text-text hover:text-primary-600">{t.name}</button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${tankTypeColors[t.tankType] ?? ""}`}>{tankTypeLabels[t.tankType] ?? t.tankType}</span>
                      <button onClick={() => openEdit(t)} className="p-1 hover:bg-surface-tertiary rounded"><Pencil className="w-3.5 h-3.5 text-text-tertiary" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary mb-1">{t.plant.name} / {t.code}</p>
                  <div className="mt-3 space-y-2">
                    <div className="relative h-32 w-full bg-surface-tertiary rounded-lg overflow-hidden border border-border">
                      <div className={`absolute bottom-0 left-0 right-0 transition-all ${isHigh ? "bg-red-200" : isLow ? "bg-amber-200" : "bg-blue-200"}`} style={{ height: `${percentage}%` }} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-text">{percentage}%</p>
                        <p className="text-xs text-text-secondary">{currentKl} / {capacityKl} kL</p>
                      </div>
                    </div>
                    {(isHigh || isLow) && (
                      <div className={`flex items-center gap-1 text-xs ${isHigh ? "text-red-600" : "text-amber-600"}`}><AlertTriangle className="w-3 h-3" />{isHigh ? "容量上限に注意" : "在庫残少"}</div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-text-tertiary">質量: </span><span className="font-medium text-text">{currentKg.toLocaleString()} kg</span></div>
                    <div><span className="text-text-tertiary">比重: </span><span className="font-medium text-text">{sg}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="タンク登録"
        footer={<><button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="タンクコード" required><FormInput placeholder="例: TK-05" value={newForm.code} onChange={(e) => setNewForm({ ...newForm, code: e.target.value })} /></FormField>
            <FormField label="タンク名" required><FormInput placeholder="例: 軽質油タンクC" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} /></FormField>
          </div>
          <FormField label="油種" required><FormSelect placeholder="選択" value={newForm.tankType} onChange={(e) => setNewForm({ ...newForm, tankType: e.target.value })} options={tankTypeOptions} /></FormField>
          <FormField label="工場" required><FormSelect placeholder="選択" value={newForm.plantId} onChange={(e) => setNewForm({ ...newForm, plantId: e.target.value })} options={(plants ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} /></FormField>
          <FormField label="容量(L)" required><FormInput type="number" placeholder="例: 50000" value={newForm.capacity} onChange={(e) => setNewForm({ ...newForm, capacity: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="タンク 編集"
        footer={<><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="タンクコード" required><FormInput value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} /></FormField>
            <FormField label="タンク名" required><FormInput value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></FormField>
          </div>
          <FormField label="油種" required><FormSelect value={editForm.tankType} onChange={(e) => setEditForm({ ...editForm, tankType: e.target.value })} options={tankTypeOptions} /></FormField>
          <FormField label="工場" required><FormSelect value={editForm.plantId} onChange={(e) => setEditForm({ ...editForm, plantId: e.target.value })} options={(plants ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="容量(L)" required><FormInput type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} /></FormField>
            <FormField label="現在量(L)"><FormInput type="number" value={editForm.currentLevel} onChange={(e) => setEditForm({ ...editForm, currentLevel: e.target.value })} /></FormField>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `タンク詳細: ${selected.code} ${selected.name}` : ""}
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (() => {
          const percentage = getPercentage(selected);
          const currentKl = toKl(selected.currentLevel);
          const capacityKl = toKl(selected.capacity);
          const currentKg = toKg(selected.currentLevel, selected.tankType);
          const sg = specificGravityMap[selected.tankType] ?? 0.85;
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-medium">{selected.code}</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${tankTypeColors[selected.tankType] ?? ""}`}>{tankTypeLabels[selected.tankType] ?? selected.tankType}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-text-tertiary">タンク名</p><p className="text-sm text-text">{selected.name}</p></div>
                <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant.name}</p></div>
              </div>
              <div className="p-4 bg-surface-tertiary rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-text-tertiary">タンク容量</p><p className="text-sm font-bold text-text">{capacityKl} kL</p></div>
                  <div><p className="text-xs text-text-tertiary">現在量</p><p className="text-sm font-bold text-text">{currentKl} kL</p></div>
                  <div><p className="text-xs text-text-tertiary">質量</p><p className="text-sm font-bold text-text">{currentKg.toLocaleString()} kg</p></div>
                  <div><p className="text-xs text-text-tertiary">比重</p><p className="text-sm font-bold text-text">{sg}</p></div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-1"><span>充填率</span><span>{percentage}%</span></div>
                  <div className="h-3 bg-surface rounded-full"><div className={`h-3 rounded-full ${percentage >= 80 ? "bg-red-400" : percentage <= 20 ? "bg-amber-400" : "bg-primary-500"}`} style={{ width: `${percentage}%` }} /></div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
