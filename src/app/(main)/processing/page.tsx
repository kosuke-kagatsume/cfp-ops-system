"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, ArrowRight, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProcessingOrder = {
  id: string;
  orderNumber: string;
  processType: string;
  inputQuantity: number;
  outputQuantity: number | null;
  yieldRate: number | null;
  orderDate: string;
  completedDate: string | null;
  status: string;
  note: string | null;
  plant: { id: string; code: string; name: string };
  inputProduct: {
    id: string;
    code: string;
    name: { name: string } | null;
    shape: { name: string } | null;
    color: { name: string } | null;
    grade: { name: string } | null;
  };
  outputProduct: {
    id: string;
    code: string;
    name: { name: string } | null;
    shape: { name: string } | null;
    color: { name: string } | null;
    grade: { name: string } | null;
  };
};

const statusEnum: { value: string; label: string }[] = [
  { value: "PLANNED", label: "計画" },
  { value: "IN_PROGRESS", label: "作業中" },
  { value: "COMPLETED", label: "完了" },
];

const statusLabels: Record<string, string> = {
  PLANNED: "計画",
  IN_PROGRESS: "作業中",
  COMPLETED: "完了",
};

const statusColors: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

const processTypeLabels: Record<string, string> = {
  EXTRUDER: "ルーダー",
  CRUSHING: "破砕",
  TRANSFER: "積替",
  REPACK: "詰替",
  OTHER: "その他",
};

const processTypeColors: Record<string, string> = {
  EXTRUDER: "bg-amber-100 text-amber-800",
  CRUSHING: "bg-blue-100 text-blue-800",
  TRANSFER: "bg-gray-100 text-gray-800",
  REPACK: "bg-purple-100 text-purple-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const processTypeOptions = [
  { value: "EXTRUDER", label: "ルーダー（溶融ペレット化）" },
  { value: "CRUSHING", label: "破砕" },
  { value: "TRANSFER", label: "積替" },
  { value: "REPACK", label: "詰替" },
  { value: "OTHER", label: "その他" },
];

type PlantOption = { id: string; code: string; name: string };
type ProductOption = { id: string; code: string; name: { name: string } | null };

export default function ProcessingPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data: orders, isLoading, mutate } = useSWR<ProcessingOrder[]>(
    `/api/mr/processing?${params.toString()}`,
    fetcher
  );

  const { data: allOrders } = useSWR<ProcessingOrder[]>("/api/mr/processing", fetcher);

  // Master data for create/edit form
  const needMasters = showNewModal || showEditModal;
  const { data: plants } = useSWR<PlantOption[]>(
    needMasters ? "/api/masters/plants" : null,
    fetcher
  );
  const { data: products } = useSWR<ProductOption[]>(
    needMasters ? "/api/masters/products" : null,
    fetcher
  );

  const selected = orders?.find((o) => o.id === showDetail);

  const [newForm, setNewForm] = useState({
    processType: "",
    plantId: "",
    inputProductId: "",
    inputQuantity: "",
    outputProductId: "",
    orderDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [editForm, setEditForm] = useState({
    processType: "",
    plantId: "",
    inputProductId: "",
    inputQuantity: "",
    outputProductId: "",
    outputQuantity: "",
    yieldRate: "",
    orderDate: "",
    status: "",
    note: "",
  });

  const resetForm = () => {
    setNewForm({
      processType: "", plantId: "", inputProductId: "", inputQuantity: "",
      outputProductId: "", orderDate: new Date().toISOString().split("T")[0], note: "",
    });
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/mr/processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processType: newForm.processType,
          plantId: newForm.plantId,
          inputProductId: newForm.inputProductId,
          inputQuantity: parseFloat(newForm.inputQuantity),
          outputProductId: newForm.outputProductId,
          orderDate: newForm.orderDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      resetForm();
      mutate();
      showToast("加工指示を作成しました", "success");
    } catch {
      showToast("作成に失敗しました", "error");
    }
  };

  const openEdit = (o: ProcessingOrder) => {
    setEditingId(o.id);
    setEditForm({
      processType: o.processType,
      plantId: o.plant.id,
      inputProductId: o.inputProduct.id,
      inputQuantity: String(o.inputQuantity),
      outputProductId: o.outputProduct.id,
      outputQuantity: o.outputQuantity != null ? String(o.outputQuantity) : "",
      yieldRate: o.yieldRate != null ? String(o.yieldRate) : "",
      orderDate: o.orderDate.split("T")[0],
      status: o.status,
      note: o.note ?? "",
    });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/mr/processing/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processType: editForm.processType,
          plantId: editForm.plantId,
          inputProductId: editForm.inputProductId,
          inputQuantity: parseFloat(editForm.inputQuantity),
          outputProductId: editForm.outputProductId,
          outputQuantity: editForm.outputQuantity ? parseFloat(editForm.outputQuantity) : undefined,
          yieldRate: editForm.yieldRate ? parseFloat(editForm.yieldRate) : undefined,
          orderDate: editForm.orderDate,
          status: editForm.status,
          note: editForm.note || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      mutate();
      showToast("加工指示を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この加工指示を削除しますか？")) return;
    try {
      const res = await fetch(`/api/mr/processing/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setShowDetail(null);
      mutate();
      showToast("加工指示を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="加工管理" />
      <div className="p-6 space-y-4">
        {/* ステータスカード */}
        <div className="grid grid-cols-3 gap-4">
          {statusEnum.map(({ value, label }) => {
            const items = allOrders?.filter((o) => o.status === value) ?? [];
            return (
              <button key={value} onClick={() => setStatusFilter(statusFilter === value ? "all" : value)}
                className={`p-4 rounded-xl border text-left transition-colors ${statusFilter === value ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[value]}`}>{label}</span>
                  <span className="text-2xl font-bold text-text">{items.length}</span>
                </div>
                {items.length > 0 && <p className="text-xs text-text-tertiary">{processTypeLabels[items[0].processType] ?? items[0].processType} - {items[0].plant.name}</p>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>
            )}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />加工指示
          </button>
        </div>

        {/* 加工一覧 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : orders?.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <p className="text-sm text-text-tertiary">データがありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders?.map((order) => (
              <div key={order.id} className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setShowDetail(order.id)} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-primary-600">{order.orderNumber}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(order)} className="p-1 hover:bg-surface-tertiary rounded transition-colors" title="編集">
                      <Pencil className="w-4 h-4 text-text-tertiary" />
                    </button>
                    <button onClick={() => handleDelete(order.id)} className="p-1 hover:bg-red-50 rounded transition-colors" title="削除">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    <div className="text-right ml-2">
                      <p className="text-xs text-text-tertiary">{order.plant.name}</p>
                      <p className="text-xs text-text-secondary">{new Date(order.orderDate).toLocaleDateString("ja-JP")}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowDetail(order.id)} className="w-full">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-3 bg-surface-secondary rounded-lg text-left">
                      <p className="text-xs text-text-tertiary">投入</p>
                      <p className="text-sm font-mono text-text">{order.inputProduct.code}</p>
                      <p className="text-xs text-text-secondary">{order.inputQuantity.toLocaleString()} kg</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${processTypeColors[order.processType] ?? "bg-gray-100 text-gray-800"}`}>
                        {processTypeLabels[order.processType] ?? order.processType}
                      </span>
                      <ArrowRight className="w-4 h-4 text-text-tertiary mt-1" />
                    </div>
                    <div className="flex-1 p-3 bg-surface-secondary rounded-lg text-left">
                      <p className="text-xs text-text-tertiary">完成</p>
                      <p className="text-sm font-mono text-text">{order.outputProduct.code}</p>
                      {order.outputQuantity ? (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-text-secondary">{order.outputQuantity.toLocaleString()} kg</p>
                          {order.yieldRate != null && <span className="text-xs font-medium text-emerald-600">歩留 {order.yieldRate}%</span>}
                        </div>
                      ) : (
                        <p className="text-xs text-text-tertiary">-</p>
                      )}
                    </div>
                  </div>
                  {order.note && (
                    <p className="text-xs text-text-tertiary mt-2 text-left">{order.note}</p>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 加工指示 新規作成モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="加工指示 作成"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">作成する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="加工種別" required>
            <FormSelect placeholder="選択" value={newForm.processType} onChange={(e) => setNewForm({ ...newForm, processType: e.target.value })} options={processTypeOptions} />
          </FormField>
          <FormField label="工場" required>
            <FormSelect placeholder="選択" value={newForm.plantId} onChange={(e) => setNewForm({ ...newForm, plantId: e.target.value })} options={(plants ?? []).map((p) => ({ value: p.id, label: p.name }))} />
          </FormField>
          <FormField label="投入原料（品目コード）" required>
            <FormSelect placeholder="在庫から選択" value={newForm.inputProductId} onChange={(e) => setNewForm({ ...newForm, inputProductId: e.target.value })} options={(products ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name?.name ?? ""}` }))} />
          </FormField>
          <FormField label="投入量(kg)" required>
            <FormInput type="number" placeholder="例: 5000" value={newForm.inputQuantity} onChange={(e) => setNewForm({ ...newForm, inputQuantity: e.target.value })} />
          </FormField>
          <FormField label="完成品コード" required>
            <FormSelect placeholder="選択" value={newForm.outputProductId} onChange={(e) => setNewForm({ ...newForm, outputProductId: e.target.value })} options={(products ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name?.name ?? ""}` }))} />
          </FormField>
          <FormField label="作業日" required>
            <FormInput type="date" value={newForm.orderDate} onChange={(e) => setNewForm({ ...newForm, orderDate: e.target.value })} />
          </FormField>
          <FormField label="指示内容">
            <FormInput placeholder="例: 温度設定220度、スクリュー150rpm" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="加工指示 編集"
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="加工種別" required>
            <FormSelect placeholder="選択" value={editForm.processType} onChange={(e) => setEditForm({ ...editForm, processType: e.target.value })} options={processTypeOptions} />
          </FormField>
          <FormField label="工場" required>
            <FormSelect placeholder="選択" value={editForm.plantId} onChange={(e) => setEditForm({ ...editForm, plantId: e.target.value })} options={(plants ?? []).map((p) => ({ value: p.id, label: p.name }))} />
          </FormField>
          <FormField label="投入原料" required>
            <FormSelect placeholder="選択" value={editForm.inputProductId} onChange={(e) => setEditForm({ ...editForm, inputProductId: e.target.value })} options={(products ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name?.name ?? ""}` }))} />
          </FormField>
          <FormField label="投入量(kg)" required>
            <FormInput type="number" placeholder="例: 5000" value={editForm.inputQuantity} onChange={(e) => setEditForm({ ...editForm, inputQuantity: e.target.value })} />
          </FormField>
          <FormField label="完成品コード" required>
            <FormSelect placeholder="選択" value={editForm.outputProductId} onChange={(e) => setEditForm({ ...editForm, outputProductId: e.target.value })} options={(products ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name?.name ?? ""}` }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="完成数量(kg)">
              <FormInput type="number" placeholder="例: 4500" value={editForm.outputQuantity} onChange={(e) => setEditForm({ ...editForm, outputQuantity: e.target.value })} />
            </FormField>
            <FormField label="歩留率(%)">
              <FormInput type="number" placeholder="例: 90" value={editForm.yieldRate} onChange={(e) => setEditForm({ ...editForm, yieldRate: e.target.value })} />
            </FormField>
          </div>
          <FormField label="作業日" required>
            <FormInput type="date" value={editForm.orderDate} onChange={(e) => setEditForm({ ...editForm, orderDate: e.target.value })} />
          </FormField>
          <FormField label="ステータス">
            <FormSelect value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={statusEnum} />
          </FormField>
          <FormField label="指示内容">
            <FormInput placeholder="例: 温度設定220度" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `加工詳細: ${selected.orderNumber}` : ""}
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.orderNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status] ?? "bg-gray-100 text-gray-700"}`}>
                {statusLabels[selected.status] ?? selected.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">加工種別</p><p className="text-sm font-medium text-text">{processTypeLabels[selected.processType] ?? selected.processType}</p></div>
              <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant.name}</p></div>
              <div><p className="text-xs text-text-tertiary">予定日</p><p className="text-sm text-text">{new Date(selected.orderDate).toLocaleDateString("ja-JP")}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-3">
              <div><p className="text-xs text-text-tertiary">投入</p><p className="text-sm font-mono">{selected.inputProduct.code}</p><p className="text-xs text-text-secondary">{selected.inputProduct.name?.name ?? "-"} / {selected.inputQuantity.toLocaleString()} kg</p></div>
              <div><p className="text-xs text-text-tertiary">完成品</p><p className="text-sm font-mono">{selected.outputProduct.code}</p>
                {selected.outputQuantity ? (
                  <p className="text-xs text-text-secondary">{selected.outputProduct.name?.name ?? "-"} / {selected.outputQuantity.toLocaleString()} kg{selected.yieldRate != null ? ` (歩留 ${selected.yieldRate}%)` : ""}</p>
                ) : (
                  <p className="text-xs text-text-tertiary">{selected.outputProduct.name?.name ?? "-"} / 未計量</p>
                )}
              </div>
            </div>
            {selected.note && <div><p className="text-xs text-text-tertiary">指示内容</p><p className="text-sm text-text">{selected.note}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
}
