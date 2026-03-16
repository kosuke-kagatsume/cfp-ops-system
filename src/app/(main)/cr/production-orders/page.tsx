"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, ArrowRight, Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CrProductionMaterialRow = {
  id: string;
  quantity: number;
  crMaterial: {
    id: string;
    materialNumber: string;
    materialName: string;
    quantity: number;
  };
};

type CrProductionOrderRow = {
  id: string;
  orderNumber: string;
  orderDate: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  lightOilOutput: number | null;
  heavyOilOutput: number | null;
  mixedOilOutput: number | null;
  residueOutput: number | null;
  note: string | null;
  plant: { id: string; code: string; name: string };
  materials: CrProductionMaterialRow[];
};

const statusLabels: Record<string, string> = {
  INSTRUCTED: "指示済",
  FEEDING: "投入中",
  PRODUCING: "生産中",
  COMPLETED: "完了",
};

const statusColors: Record<string, string> = {
  INSTRUCTED: "bg-gray-100 text-gray-700",
  FEEDING: "bg-blue-50 text-blue-700",
  PRODUCING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

const statusList = ["INSTRUCTED", "FEEDING", "PRODUCING", "COMPLETED"] as const;

export default function CrProductionOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: allOrders, isLoading } = useSWR<CrProductionOrderRow[]>(
    "/api/cr/production-orders",
    fetcher
  );

  const orders = allOrders ?? [];

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const selected = orders.find((o) => o.id === showDetail);

  // Helper: compute input total from materials
  const getInputTotal = (o: CrProductionOrderRow) =>
    o.materials.reduce((sum, m) => sum + m.quantity, 0);

  // Helper: compute total oil output
  const getOutputOil = (o: CrProductionOrderRow) =>
    (o.lightOilOutput ?? 0) + (o.heavyOilOutput ?? 0) + (o.mixedOilOutput ?? 0);

  // Helper: compute yield rate
  const getYieldRate = (o: CrProductionOrderRow) => {
    const input = getInputTotal(o);
    if (input === 0) return null;
    const output = getOutputOil(o);
    if (output === 0 && (o.residueOutput ?? 0) === 0) return null;
    return Math.round((output / input) * 100);
  };

  return (
    <>
      <Header title="製造指図" />
      <div className="p-6 space-y-4">
        {/* ステータスパイプライン */}
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

        {/* 製造指図カード */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const inputTotal = getInputTotal(o);
              const outputOil = getOutputOil(o);
              const yieldRate = getYieldRate(o);
              const inputLots = o.materials.map((m) => m.crMaterial.materialNumber);
              return (
                <button key={o.id} onClick={() => setShowDetail(o.id)}
                  className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-primary-600">{o.orderNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[o.status] ?? ""}`}>{statusLabels[o.status] ?? o.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">{new Date(o.orderDate).toLocaleDateString("ja-JP")}</p>
                      <p className="text-xs text-text-tertiary">{o.plant.name}</p>
                    </div>
                  </div>

                  {/* 投入 → 生産 → 出力 フロー */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">投入原料</p>
                      <p className="text-sm font-medium text-blue-800">{inputTotal.toLocaleString()} kg</p>
                      <p className="text-xs text-blue-600">{inputLots.join(", ") || "—"}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <ArrowRight className="w-4 h-4 text-text-tertiary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <p className="text-xs text-amber-600">生成油</p>
                        <p className="text-sm font-medium text-amber-800">{outputOil > 0 ? `${outputOil.toLocaleString()} L` : "—"}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <p className="text-xs text-gray-600">残渣</p>
                        <p className="text-sm font-medium text-gray-800">{o.residueOutput ? `${o.residueOutput.toLocaleString()} kg` : "—"}</p>
                      </div>
                    </div>
                  </div>

                  {yieldRate !== null && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">収率:</span>
                      <div className="flex-1 h-2 bg-surface-tertiary rounded-full">
                        <div className="h-2 bg-primary-500 rounded-full" style={{ width: `${yieldRate}%` }} />
                      </div>
                      <span className="text-sm font-medium text-text">{yieldRate}%</span>
                    </div>
                  )}

                  {o.note && <p className="mt-2 text-xs text-text-tertiary">指示: {o.note}</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 製造指図作成モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="製造指図作成"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("製造指図を作成しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">作成する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="工場" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "岡山ケミカルセンター" }, { value: "2", label: "美の浜工場" },
          ]} /></FormField>
          <FormField label="製造日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          <FormField label="投入ロット" required><FormSelect placeholder="合格済ロットから選択" options={[
            { value: "1", label: "CR-260311-01 (PE混合廃プラ 5,500kg)" },
            { value: "2", label: "CR-260310-01 (PS廃プラスチック 6,200kg)" },
          ]} /></FormField>
          <FormField label="担当者" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "佐藤 次郎" }, { value: "2", label: "田中 美咲" },
          ]} /></FormField>
          <FormField label="製造指示"><FormInput placeholder="例: PP単独投入、温度430℃" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `製造指図: ${selected.orderNumber}` : ""}
        footer={<>
          {selected?.status === "INSTRUCTED" && <button onClick={() => { setShowDetail(null); showToast("投入を開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">投入開始</button>}
          {selected?.status === "FEEDING" && <button onClick={() => { setShowDetail(null); showToast("生産を開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">生産開始</button>}
          {selected?.status === "PRODUCING" && <button onClick={() => { setShowDetail(null); showToast("生産を完了しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">生産完了</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (() => {
          const inputTotal = getInputTotal(selected);
          const outputOil = getOutputOil(selected);
          const yieldRate = getYieldRate(selected);
          const inputLots = selected.materials.map((m) => m.crMaterial.materialNumber);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-medium">{selected.orderNumber}</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status] ?? ""}`}>{statusLabels[selected.status] ?? selected.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant.name}</p></div>
                <div><p className="text-xs text-text-tertiary">製造日</p><p className="text-sm text-text">{new Date(selected.orderDate).toLocaleDateString("ja-JP")}</p></div>
                <div><p className="text-xs text-text-tertiary">指示内容</p><p className="text-sm text-text">{selected.note ?? "—"}</p></div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">投入原料</p>
                <p className="text-sm font-medium text-blue-800">{inputTotal.toLocaleString()} kg</p>
                <p className="text-xs text-blue-600 mt-1">ロット: {inputLots.join(", ") || "—"}</p>
              </div>
              {outputOil > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-600">生成油</p>
                    <p className="text-sm font-bold text-amber-800">{outputOil.toLocaleString()} L</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-600">残渣</p>
                    <p className="text-sm font-bold text-gray-800">{selected.residueOutput?.toLocaleString() ?? "—"} kg</p>
                  </div>
                </div>
              )}
              {yieldRate !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">収率:</span>
                  <div className="flex-1 h-3 bg-surface-tertiary rounded-full">
                    <div className="h-3 bg-primary-500 rounded-full" style={{ width: `${yieldRate}%` }} />
                  </div>
                  <span className="text-sm font-bold text-text">{yieldRate}%</span>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
