"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { crProductionOrders, crProductionStatusColors, type ProductionOrderStatus } from "@/lib/dummy-data-phase2";
import { Plus, Search, Eye, ArrowRight, Flame } from "lucide-react";
import { useState } from "react";

const statusList: ProductionOrderStatus[] = ["指示済", "投入中", "生産中", "完了"];

export default function CrProductionOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = crProductionOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const selected = crProductionOrders.find((o) => o.id === showDetail);

  return (
    <>
      <Header title="製造指図" />
      <div className="p-6 space-y-4">
        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusList.map((step, i) => {
              const count = crProductionOrders.filter((o) => o.status === step).length;
              const isActive = statusFilter === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step)}
                    className={`flex-1 p-3 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{step}</p>
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
        <div className="space-y-3">
          {filtered.map((o) => (
            <button key={o.id} onClick={() => setShowDetail(o.id)}
              className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary-600">{o.orderNumber}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${crProductionStatusColors[o.status]}`}>{o.status}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-secondary">{o.date}</p>
                  <p className="text-xs text-text-tertiary">{o.plant}</p>
                </div>
              </div>

              {/* 投入 → 生産 → 出力 フロー */}
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">投入原料</p>
                  <p className="text-sm font-medium text-blue-800">{o.inputTotal.toLocaleString()} kg</p>
                  <p className="text-xs text-blue-600">{o.inputLots.join(", ")}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-600">生成油</p>
                    <p className="text-sm font-medium text-amber-800">{o.outputOil ? `${o.outputOil.toLocaleString()} kg` : "—"}</p>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-600">残渣</p>
                    <p className="text-sm font-medium text-gray-800">{o.outputResidue ? `${o.outputResidue.toLocaleString()} kg` : "—"}</p>
                  </div>
                </div>
              </div>

              {o.yieldRate !== null && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">収率:</span>
                  <div className="flex-1 h-2 bg-surface-tertiary rounded-full">
                    <div className="h-2 bg-primary-500 rounded-full" style={{ width: `${o.yieldRate}%` }} />
                  </div>
                  <span className="text-sm font-medium text-text">{o.yieldRate}%</span>
                </div>
              )}

              <p className="mt-2 text-xs text-text-tertiary">担当: {o.operator} | 指示: {o.instructions}</p>
            </button>
          ))}
        </div>
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
          {selected?.status === "指示済" && <button onClick={() => { setShowDetail(null); showToast("投入を開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">投入開始</button>}
          {selected?.status === "投入中" && <button onClick={() => { setShowDetail(null); showToast("生産を開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">生産開始</button>}
          {selected?.status === "生産中" && <button onClick={() => { setShowDetail(null); showToast("生産を完了しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">生産完了</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.orderNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${crProductionStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant}</p></div>
              <div><p className="text-xs text-text-tertiary">製造日</p><p className="text-sm text-text">{selected.date}</p></div>
              <div><p className="text-xs text-text-tertiary">担当者</p><p className="text-sm text-text">{selected.operator}</p></div>
              <div><p className="text-xs text-text-tertiary">指示内容</p><p className="text-sm text-text">{selected.instructions}</p></div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">投入原料</p>
              <p className="text-sm font-medium text-blue-800">{selected.inputTotal.toLocaleString()} kg</p>
              <p className="text-xs text-blue-600 mt-1">ロット: {selected.inputLots.join(", ")}</p>
            </div>
            {selected.outputOil !== null && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600">生成油</p>
                  <p className="text-sm font-bold text-amber-800">{selected.outputOil?.toLocaleString()} kg</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-xs text-gray-600">残渣</p>
                  <p className="text-sm font-bold text-gray-800">{selected.outputResidue?.toLocaleString()} kg</p>
                </div>
              </div>
            )}
            {selected.yieldRate !== null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">収率:</span>
                <div className="flex-1 h-3 bg-surface-tertiary rounded-full">
                  <div className="h-3 bg-primary-500 rounded-full" style={{ width: `${selected.yieldRate}%` }} />
                </div>
                <span className="text-sm font-bold text-text">{selected.yieldRate}%</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
