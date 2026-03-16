"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Phone, MapPin, Truck as TruckIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type DispatchItem = {
  id: string;
  vehicleNumber: string | null;
  driverName: string | null;
  freightCost: number | null;
  dispatchDate: string;
  note: string | null;
  shipment: {
    shipmentNumber: string;
    customer: { name: string };
    product: { name: { name: string } | null };
    quantity: number;
  };
  carrier: { id: string; code: string; name: string };
};

type ShipmentOption = {
  id: string;
  shipmentNumber: string;
  customer: { name: string };
};

type PartnerOption = { id: string; code: string; name: string };

export default function DispatchPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: dispatches, isLoading, mutate } = useSWR<DispatchItem[]>(
    "/api/mr/dispatch",
    fetcher
  );

  // Master data for create form
  const { data: carriers } = useSWR<PartnerOption[]>(
    showNewModal ? "/api/masters/partners?type=carrier" : null,
    fetcher
  );
  const { data: shipments } = useSWR<ShipmentOption[]>(
    showNewModal ? "/api/mr/shipments" : null,
    fetcher
  );

  const selected = dispatches?.find((d) => d.id === showDetail);

  const [newForm, setNewForm] = useState({
    shipmentId: "",
    carrierId: "",
    vehicleNumber: "",
    driverName: "",
    freightCost: "",
    dispatchDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  const resetForm = () => {
    setNewForm({
      shipmentId: "", carrierId: "", vehicleNumber: "", driverName: "",
      freightCost: "", dispatchDate: new Date().toISOString().split("T")[0], note: "",
    });
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/mr/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: newForm.shipmentId,
          carrierId: newForm.carrierId,
          vehicleNumber: newForm.vehicleNumber || undefined,
          driverName: newForm.driverName || undefined,
          freightCost: newForm.freightCost ? parseFloat(newForm.freightCost) : undefined,
          dispatchDate: newForm.dispatchDate,
          note: newForm.note || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      resetForm();
      mutate();
      showToast("配車を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="配車管理" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">{dispatches?.length ?? 0}件の配車</p>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />配車登録
          </button>
        </div>

        {/* 配車カード */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : dispatches?.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <p className="text-sm text-text-tertiary">データがありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dispatches?.map((d) => (
              <button key={d.id} onClick={() => setShowDetail(d.id)}
                className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-primary-600">{d.shipment.shipmentNumber}</span>
                  </div>
                  <span className="text-sm text-text-secondary">{new Date(d.dispatchDate).toLocaleDateString("ja-JP")}</span>
                </div>

                <div className="flex items-start gap-4">
                  {/* 運送情報 */}
                  <div className="flex-1 p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TruckIcon className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm font-medium text-text">{d.carrier.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {d.vehicleNumber && <div><span className="text-text-tertiary">車番: </span><span className="font-mono text-text-secondary">{d.vehicleNumber}</span></div>}
                      {d.driverName && <div><span className="text-text-tertiary">運転手: </span><span className="text-text-secondary">{d.driverName}</span></div>}
                    </div>
                  </div>

                  {/* 顧客・品目 */}
                  <div className="flex-1 space-y-2">
                    <div className="p-2 bg-emerald-50 rounded-lg flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-emerald-600">納品先</p>
                        <p className="text-sm text-emerald-800">{d.shipment.customer.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {d.freightCost != null && d.freightCost > 0 && (
                  <div className="mt-3 text-right">
                    <span className="text-xs text-text-tertiary">運賃: </span>
                    <span className="text-sm font-medium text-text">¥{d.freightCost.toLocaleString()}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 配車登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="配車登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="出荷番号" required>
            <FormSelect
              placeholder="選択"
              value={newForm.shipmentId}
              onChange={(e) => setNewForm({ ...newForm, shipmentId: e.target.value })}
              options={(shipments as ShipmentOption[] ?? []).map((s: ShipmentOption) => ({
                value: s.id,
                label: `${s.shipmentNumber}（${s.customer?.name ?? "-"}）`,
              }))}
            />
          </FormField>
          <FormField label="運送会社" required>
            <FormSelect
              placeholder="選択"
              value={newForm.carrierId}
              onChange={(e) => setNewForm({ ...newForm, carrierId: e.target.value })}
              options={(carriers ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="車両番号">
              <FormInput placeholder="例: 福山 100 あ 1234" value={newForm.vehicleNumber} onChange={(e) => setNewForm({ ...newForm, vehicleNumber: e.target.value })} />
            </FormField>
            <FormField label="運転手名">
              <FormInput placeholder="例: 山本 太郎" value={newForm.driverName} onChange={(e) => setNewForm({ ...newForm, driverName: e.target.value })} />
            </FormField>
          </div>
          <FormField label="運賃(円)">
            <FormInput type="number" placeholder="例: 45000" value={newForm.freightCost} onChange={(e) => setNewForm({ ...newForm, freightCost: e.target.value })} />
          </FormField>
          <FormField label="配車日" required>
            <FormInput type="date" value={newForm.dispatchDate} onChange={(e) => setNewForm({ ...newForm, dispatchDate: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `配車詳細: ${selected.shipment.shipmentNumber}` : ""}
        footer={<>
          <button onClick={() => { showToast("引取連絡書を生成（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">引取連絡書</button>
          <button onClick={() => { showToast("運送指示書を生成（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">運送指示書</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.shipment.shipmentNumber}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">配車日</p><p className="text-sm text-text">{new Date(selected.dispatchDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">運賃</p><p className="text-sm font-medium text-text">{selected.freightCost != null && selected.freightCost > 0 ? `¥${selected.freightCost.toLocaleString()}` : "-"}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-2">
              <p className="text-xs font-medium text-text">運送情報</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-text-tertiary">運送会社</p><p className="text-text">{selected.carrier.name}</p></div>
                <div><p className="text-xs text-text-tertiary">車番</p><p className="font-mono text-text">{selected.vehicleNumber ?? "-"}</p></div>
                <div><p className="text-xs text-text-tertiary">運転手</p><p className="text-text">{selected.driverName ?? "-"}</p></div>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="text-xs text-emerald-600">納品先</p>
              <p className="text-sm text-emerald-800">{selected.shipment.customer.name}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
