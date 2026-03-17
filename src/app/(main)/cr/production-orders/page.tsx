"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, ArrowRight, Flame, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CrProductionMaterialRow = { id: string; quantity: number; crMaterial: { id: string; materialNumber: string; materialName: string; quantity: number } };
type CrProductionOrderRow = {
  id: string; orderNumber: string; orderDate: string; startDate: string | null; endDate: string | null;
  status: string; lightOilOutput: number | null; heavyOilOutput: number | null; mixedOilOutput: number | null;
  residueOutput: number | null; note: string | null; plant: { id: string; code: string; name: string };
  materials: CrProductionMaterialRow[];
};

const statusLabels: Record<string, string> = { INSTRUCTED: "指示済", FEEDING: "投入中", PRODUCING: "生産中", COMPLETED: "完了" };
const statusColors: Record<string, string> = { INSTRUCTED: "bg-gray-100 text-gray-700", FEEDING: "bg-blue-50 text-blue-700", PRODUCING: "bg-amber-50 text-amber-700", COMPLETED: "bg-emerald-50 text-emerald-700" };
const statusList = ["INSTRUCTED", "FEEDING", "PRODUCING", "COMPLETED"] as const;
const statusOptions = statusList.map((s) => ({ value: s, label: statusLabels[s] }));

type PlantOption = { id: string; code: string; name: string };

export default function CrProductionOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const { data: allOrders, isLoading, mutate } = useSWR<CrProductionOrderRow[]>("/api/cr/production-orders", fetcher);
  const needMasters = showNewModal || showEditModal;
  const { data: plants } = useSWR<PlantOption[]>(needMasters ? "/api/masters/plants" : null, fetcher);

  const orders = allOrders ?? [];
  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);
  const selected = orders.find((o) => o.id === showDetail);

  const getInputTotal = (o: CrProductionOrderRow) => o.materials.reduce((sum, m) => sum + m.quantity, 0);
  const getOutputOil = (o: CrProductionOrderRow) => (o.lightOilOutput ?? 0) + (o.heavyOilOutput ?? 0) + (o.mixedOilOutput ?? 0);
  const getYieldRate = (o: CrProductionOrderRow) => {
    const input = getInputTotal(o);
    if (input === 0) return null;
    const output = getOutputOil(o);
    if (output === 0 && (o.residueOutput ?? 0) === 0) return null;
    return Math.round((output / input) * 100);
  };

  const [newForm, setNewForm] = useState({ plantId: "", orderDate: new Date().toISOString().split("T")[0], note: "" });
  const [editForm, setEditForm] = useState({
    plantId: "", orderDate: "", status: "", lightOilOutput: "", heavyOilOutput: "", mixedOilOutput: "", residueOutput: "", note: "",
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/cr/production-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId: newForm.plantId, orderDate: newForm.orderDate, note: newForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ plantId: "", orderDate: new Date().toISOString().split("T")[0], note: "" });
      mutate();
      showToast("製造指図を作成しました", "success");
    } catch { showToast("作成に失敗しました", "error"); }
  };

  const openEdit = (o: CrProductionOrderRow) => {
    setEditingId(o.id);
    setEditForm({
      plantId: o.plant.id, orderDate: o.orderDate.split("T")[0], status: o.status,
      lightOilOutput: o.lightOilOutput != null ? String(o.lightOilOutput) : "",
      heavyOilOutput: o.heavyOilOutput != null ? String(o.heavyOilOutput) : "",
      mixedOilOutput: o.mixedOilOutput != null ? String(o.mixedOilOutput) : "",
      residueOutput: o.residueOutput != null ? String(o.residueOutput) : "",
      note: o.note ?? "",
    });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/cr/production-orders/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantId: editForm.plantId, orderDate: editForm.orderDate, status: editForm.status,
          lightOilOutput: editForm.lightOilOutput ? parseFloat(editForm.lightOilOutput) : null,
          heavyOilOutput: editForm.heavyOilOutput ? parseFloat(editForm.heavyOilOutput) : null,
          mixedOilOutput: editForm.mixedOilOutput ? parseFloat(editForm.mixedOilOutput) : null,
          residueOutput: editForm.residueOutput ? parseFloat(editForm.residueOutput) : null,
          note: editForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("製造指図を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この製造指図を削除しますか？")) return;
    try {
      const res = await fetch(`/api/cr/production-orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("製造指図を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="製造指図" />
      <div className="p-6 space-y-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusList.map((step, i) => {
              const count = orders.filter((o) => o.status === step).length;
              const isActive = statusFilter === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step)}
                    className={`flex-1 p-3 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{statusLabels[step]}</p>
                  </button>
                  {i < statusList.length - 1 && <div className="w-4 h-0.5 bg-border mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">{filtered.length}件の製造指図</p>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />製造指図作成
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /><span className="ml-2 text-sm text-text-secondary">読み込み中...</span></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const inputTotal = getInputTotal(o);
              const outputOil = getOutputOil(o);
              const yieldRate = getYieldRate(o);
              const inputLots = o.materials.map((m) => m.crMaterial.materialNumber);
              return (
                <div key={o.id} className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowDetail(o.id)} className="text-sm font-mono text-primary-600 hover:underline">{o.orderNumber}</button>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[o.status] ?? ""}`}>{statusLabels[o.status] ?? o.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(o)} className="p-1 hover:bg-surface-tertiary rounded" title="編集"><Pencil className="w-4 h-4 text-text-tertiary" /></button>
                      <button onClick={() => handleDelete(o.id)} className="p-1 hover:bg-red-50 rounded" title="削除"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      <div className="text-right ml-2">
                        <p className="text-sm text-text-secondary">{new Date(o.orderDate).toLocaleDateString("ja-JP")}</p>
                        <p className="text-xs text-text-tertiary">{o.plant.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">投入原料</p>
                      <p className="text-sm font-medium text-blue-800">{inputTotal.toLocaleString()} kg</p>
                      <p className="text-xs text-blue-600">{inputLots.join(", ") || "---"}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1"><Flame className="w-5 h-5 text-orange-500" /><ArrowRight className="w-4 h-4 text-text-tertiary" /></div>
                    <div className="flex-1 space-y-2">
                      <div className="p-2 bg-amber-50 rounded-lg"><p className="text-xs text-amber-600">生成油</p><p className="text-sm font-medium text-amber-800">{outputOil > 0 ? `${outputOil.toLocaleString()} L` : "---"}</p></div>
                      <div className="p-2 bg-gray-100 rounded-lg"><p className="text-xs text-gray-600">残渣</p><p className="text-sm font-medium text-gray-800">{o.residueOutput ? `${o.residueOutput.toLocaleString()} kg` : "---"}</p></div>
                    </div>
                  </div>
                  {yieldRate !== null && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">収率:</span>
                      <div className="flex-1 h-2 bg-surface-tertiary rounded-full"><div className="h-2 bg-primary-500 rounded-full" style={{ width: `${yieldRate}%` }} /></div>
                      <span className="text-sm font-medium text-text">{yieldRate}%</span>
                    </div>
                  )}
                  {o.note && <p className="mt-2 text-xs text-text-tertiary">指示: {o.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="製造指図作成"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">作成する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="工場" required>
            <FormSelect placeholder="選択" value={newForm.plantId} onChange={(e) => setNewForm({ ...newForm, plantId: e.target.value })}
              options={(plants ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="製造日" required>
            <FormInput type="date" value={newForm.orderDate} onChange={(e) => setNewForm({ ...newForm, orderDate: e.target.value })} />
          </FormField>
          <FormField label="製造指示">
            <FormInput placeholder="例: PP単独投入、温度430度" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="製造指図 編集"
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="工場" required>
            <FormSelect placeholder="選択" value={editForm.plantId} onChange={(e) => setEditForm({ ...editForm, plantId: e.target.value })}
              options={(plants ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="製造日" required>
            <FormInput type="date" value={editForm.orderDate} onChange={(e) => setEditForm({ ...editForm, orderDate: e.target.value })} />
          </FormField>
          <FormField label="ステータス">
            <FormSelect value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={statusOptions} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="軽質油(L)"><FormInput type="number" value={editForm.lightOilOutput} onChange={(e) => setEditForm({ ...editForm, lightOilOutput: e.target.value })} /></FormField>
            <FormField label="重質油(L)"><FormInput type="number" value={editForm.heavyOilOutput} onChange={(e) => setEditForm({ ...editForm, heavyOilOutput: e.target.value })} /></FormField>
            <FormField label="混合油(L)"><FormInput type="number" value={editForm.mixedOilOutput} onChange={(e) => setEditForm({ ...editForm, mixedOilOutput: e.target.value })} /></FormField>
            <FormField label="残渣(kg)"><FormInput type="number" value={editForm.residueOutput} onChange={(e) => setEditForm({ ...editForm, residueOutput: e.target.value })} /></FormField>
          </div>
          <FormField label="製造指示">
            <FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `製造指図: ${selected.orderNumber}` : ""}
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (() => {
          const inputTotal = getInputTotal(selected);
          const outputOil = getOutputOil(selected);
          const yieldRate = getYieldRate(selected);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-medium">{selected.orderNumber}</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status] ?? ""}`}>{statusLabels[selected.status] ?? selected.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant.name}</p></div>
                <div><p className="text-xs text-text-tertiary">製造日</p><p className="text-sm text-text">{new Date(selected.orderDate).toLocaleDateString("ja-JP")}</p></div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">投入原料</p>
                <p className="text-sm font-medium text-blue-800">{inputTotal.toLocaleString()} kg</p>
              </div>
              {outputOil > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg"><p className="text-xs text-amber-600">生成油</p><p className="text-sm font-bold text-amber-800">{outputOil.toLocaleString()} L</p></div>
                  <div className="p-3 bg-gray-100 rounded-lg"><p className="text-xs text-gray-600">残渣</p><p className="text-sm font-bold text-gray-800">{selected.residueOutput?.toLocaleString() ?? "---"} kg</p></div>
                </div>
              )}
              {yieldRate !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">収率:</span>
                  <div className="flex-1 h-3 bg-surface-tertiary rounded-full"><div className="h-3 bg-primary-500 rounded-full" style={{ width: `${yieldRate}%` }} /></div>
                  <span className="text-sm font-bold text-text">{yieldRate}%</span>
                </div>
              )}
              {selected.note && <div><p className="text-xs text-text-tertiary">指示内容</p><p className="text-sm text-text">{selected.note}</p></div>}
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
