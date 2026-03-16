"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, FileText, Camera, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Shipment = {
  id: string;
  shipmentNumber: string;
  deliveryDate: string | null;
  shipmentDate: string | null;
  quantity: number;
  unitPrice: number | null;
  amount: number | null;
  packagingType: string | null;
  status: string;
  customer: { id: string; code: string; name: string };
  deliveryPartner: { id: string; name: string } | null;
  product: {
    id: string;
    code: string;
    name: { name: string } | null;
    shape: { name: string } | null;
    color: { name: string } | null;
    grade: { name: string } | null;
  };
  warehouse: { id: string; code: string; name: string } | null;
  dispatch: { id: string; carrierId: string; carrier: { name: string } } | null;
};

const statusSteps: { value: string; label: string }[] = [
  { value: "SHIPPING_LIST", label: "出庫表作成" },
  { value: "CARGO_SELECTED", label: "貨物選定" },
  { value: "WEIGHING", label: "計量待ち" },
  { value: "LOADING", label: "積込中" },
  { value: "COMPLETED", label: "出荷完了" },
];

const statusLabels: Record<string, string> = {
  SHIPPING_LIST: "出庫表作成",
  CARGO_SELECTED: "貨物選定",
  WEIGHING: "計量待ち",
  LOADING: "積込中",
  COMPLETED: "出荷完了",
};

const statusColors: Record<string, string> = {
  SHIPPING_LIST: "bg-gray-100 text-gray-700",
  CARGO_SELECTED: "bg-blue-50 text-blue-700",
  WEIGHING: "bg-amber-50 text-amber-700",
  LOADING: "bg-purple-50 text-purple-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

type PartnerOption = { id: string; code: string; name: string };
type ProductOption = { id: string; code: string; name: { name: string } | null };
type WarehouseOption = { id: string; code: string; name: string };

export default function ShipmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data: shipments, isLoading, mutate } = useSWR<Shipment[]>(
    `/api/mr/shipments?${params.toString()}`,
    fetcher
  );

  const { data: allShipments } = useSWR<Shipment[]>("/api/mr/shipments", fetcher);

  // Master data for create form
  const { data: customers } = useSWR<PartnerOption[]>(
    showNewModal ? "/api/masters/partners?type=customer" : null,
    fetcher
  );
  const { data: products } = useSWR<ProductOption[]>(
    showNewModal ? "/api/masters/products" : null,
    fetcher
  );
  const { data: warehouses } = useSWR<WarehouseOption[]>(
    showNewModal ? "/api/masters/warehouses" : null,
    fetcher
  );
  const { data: carriers } = useSWR<PartnerOption[]>(
    showNewModal ? "/api/masters/partners?type=carrier" : null,
    fetcher
  );

  const selected = shipments?.find((s) => s.id === showDetail);

  const [newForm, setNewForm] = useState({
    customerId: "",
    productId: "",
    warehouseId: "",
    quantity: "",
    unitPrice: "",
    shipmentDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
  });

  const resetForm = () => {
    setNewForm({
      customerId: "", productId: "", warehouseId: "", quantity: "",
      unitPrice: "", shipmentDate: new Date().toISOString().split("T")[0], deliveryDate: "",
    });
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/mr/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newForm.customerId,
          productId: newForm.productId,
          warehouseId: newForm.warehouseId || undefined,
          quantity: parseFloat(newForm.quantity),
          unitPrice: newForm.unitPrice ? parseFloat(newForm.unitPrice) : undefined,
          shipmentDate: newForm.shipmentDate || undefined,
          deliveryDate: newForm.deliveryDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      resetForm();
      mutate();
      showToast("出荷を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="出荷管理" />
      <div className="p-6 space-y-4">
        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusSteps.map((step, i) => {
              const count = allShipments?.filter((s) => s.status === step.value).length ?? 0;
              const isActive = statusFilter === step.value;
              return (
                <div key={step.value} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step.value)}
                    className={`flex-1 p-3 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{step.label}</p>
                  </button>
                  {i < statusSteps.length - 1 && <div className="w-4 h-0.5 bg-border mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="出荷番号、顧客名、品目で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {statusFilter !== "all" && <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("出庫表を生成しました（開発中）", "info")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">
              <FileText className="w-4 h-4" />出庫表作成
            </button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" />出荷登録
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷日</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量(kg)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">運送</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {shipments?.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono text-primary-600">{s.shipmentNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {s.shipmentDate ? new Date(s.shipmentDate).toLocaleDateString("ja-JP") : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">{s.customer.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{s.product.code}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text text-right">{s.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-secondary">{s.dispatch?.carrier?.name ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[s.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {statusLabels[s.status] ?? s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDetail(s.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {shipments?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary">
                <p className="text-xs text-text-tertiary">{shipments?.length ?? 0}件</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 出荷登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="出荷登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required>
            <FormSelect
              placeholder="選択"
              value={newForm.customerId}
              onChange={(e) => setNewForm({ ...newForm, customerId: e.target.value })}
              options={(customers ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))}
            />
          </FormField>
          <FormField label="品目" required>
            <FormSelect
              placeholder="在庫から選択"
              value={newForm.productId}
              onChange={(e) => setNewForm({ ...newForm, productId: e.target.value })}
              options={(products ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name?.name ?? ""}` }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required>
              <FormInput type="number" placeholder="例: 5000" value={newForm.quantity} onChange={(e) => setNewForm({ ...newForm, quantity: e.target.value })} />
            </FormField>
            <FormField label="出荷倉庫">
              <FormSelect
                placeholder="選択"
                value={newForm.warehouseId}
                onChange={(e) => setNewForm({ ...newForm, warehouseId: e.target.value })}
                options={(warehouses ?? []).map((w) => ({ value: w.id, label: `${w.code} ${w.name}` }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="出荷日" required>
              <FormInput type="date" value={newForm.shipmentDate} onChange={(e) => setNewForm({ ...newForm, shipmentDate: e.target.value })} />
            </FormField>
            <FormField label="納品日">
              <FormInput type="date" value={newForm.deliveryDate} onChange={(e) => setNewForm({ ...newForm, deliveryDate: e.target.value })} />
            </FormField>
          </div>
          <FormField label="単価(円/kg)">
            <FormInput type="number" placeholder="例: 120" value={newForm.unitPrice} onChange={(e) => setNewForm({ ...newForm, unitPrice: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `出荷詳細: ${selected.shipmentNumber}` : ""}
        footer={<>
          {selected?.status !== "COMPLETED" && <button onClick={() => { setShowDetail(null); showToast("ステータスを進めました（開発中）", "info"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">次のステップへ</button>}
          <button onClick={() => { setShowDetail(null); showToast("写真登録（開発中）", "info"); }} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Camera className="w-4 h-4" />写真</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            {/* ステータスプログレス */}
            <div className="flex items-center gap-1">
              {statusSteps.map((step, i) => {
                const stepIndex = statusSteps.findIndex((s) => s.value === selected.status);
                const isPast = i <= stepIndex;
                return (
                  <div key={step.value} className="flex items-center flex-1">
                    <div className={`flex-1 h-2 rounded-full ${isPast ? "bg-primary-500" : "bg-surface-tertiary"}`} />
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-text-secondary">{statusLabels[selected.status] ?? selected.status}</p>

            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer.name}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷番号</p><p className="text-sm font-mono text-text">{selected.shipmentNumber}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷日</p><p className="text-sm text-text">{selected.shipmentDate ? new Date(selected.shipmentDate).toLocaleDateString("ja-JP") : "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">納品日</p><p className="text-sm text-text">{selected.deliveryDate ? new Date(selected.deliveryDate).toLocaleDateString("ja-JP") : "-"}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm font-mono">{selected.product.code}</p><p className="text-xs text-text-secondary">{selected.product.name?.name ?? "-"}</p></div>
                <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-bold">{selected.quantity.toLocaleString()} kg</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">運送会社</p><p className="text-sm text-text">{selected.dispatch?.carrier?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷倉庫</p><p className="text-sm text-text">{selected.warehouse?.name ?? "-"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
