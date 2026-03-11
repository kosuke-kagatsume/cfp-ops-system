"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { plants, warehouses, divisionLabels } from "@/lib/dummy-data";
import { Plus, Factory, Warehouse, Droplets, Eye } from "lucide-react";
import { useState } from "react";

export default function PlantsPage() {
  const [tab, setTab] = useState<"plants" | "warehouses">("plants");
  const [showNewPlant, setShowNewPlant] = useState(false);
  const [showNewWarehouse, setShowNewWarehouse] = useState(false);
  const [showPlantDetail, setShowPlantDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const selectedPlant = plants.find((p) => p.id === showPlantDetail);

  return (
    <>
      <Header title="工場・倉庫マスタ" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-1 bg-surface-tertiary rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("plants")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              tab === "plants" ? "bg-surface font-medium text-text shadow-sm" : "text-text-secondary hover:text-text"
            }`}
          >
            <Factory className="w-4 h-4" />
            工場・拠点
          </button>
          <button
            onClick={() => setTab("warehouses")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              tab === "warehouses" ? "bg-surface font-medium text-text shadow-sm" : "text-text-secondary hover:text-text"
            }`}
          >
            <Warehouse className="w-4 h-4" />
            倉庫
          </button>
        </div>

        {tab === "plants" ? (
          <div className="grid grid-cols-3 gap-4">
            {plants.map((plant) => (
              <button
                key={plant.id}
                onClick={() => setShowPlantDetail(plant.id)}
                className="bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-text-tertiary">{plant.code}</span>
                    <h3 className="text-base font-bold text-text mt-0.5">{plant.name}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">{plant.address}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    plant.division === "MR" ? "bg-blue-50 text-blue-700"
                      : plant.division === "CR" ? "bg-amber-50 text-amber-700"
                      : "bg-purple-50 text-purple-700"
                  }`}>
                    {divisionLabels[plant.division]}
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Warehouse className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm text-text-secondary">{plant.warehouses}倉庫</span>
                  </div>
                  {plant.tanks > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">{plant.tanks}タンク</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowNewPlant(true)}
              className="bg-surface rounded-xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
            >
              <Plus className="w-6 h-6 text-text-tertiary" />
              <span className="text-sm text-text-secondary">新規拠点追加</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">{warehouses.length}件の倉庫</p>
              <button
                onClick={() => setShowNewWarehouse(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                倉庫追加
              </button>
            </div>
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">コード</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">倉庫名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">所属工場</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">区分</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((wh) => (
                    <tr key={wh.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">{wh.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text">{wh.name}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{wh.plantName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          wh.type === "internal" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                        }`}>
                          {wh.type === "internal" ? "自社" : "外部"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => showToast(`${wh.name}の詳細（開発中）`, "info")}
                          className="p-1 hover:bg-surface-tertiary rounded transition-colors"
                        >
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 新規工場モーダル */}
      <Modal
        isOpen={showNewPlant}
        onClose={() => setShowNewPlant(false)}
        title="工場・拠点 新規登録"
        footer={
          <>
            <button onClick={() => setShowNewPlant(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
            <button onClick={() => { setShowNewPlant(false); showToast("工場を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="工場コード" required><FormInput placeholder="例: KYS" /></FormField>
          <FormField label="工場名" required><FormInput placeholder="例: 九州工場" /></FormField>
          <FormField label="所在地"><FormInput placeholder="例: 福岡県" /></FormField>
          <FormField label="事業部" required>
            <FormSelect placeholder="選択" options={[
              { value: "MR", label: "MR事業部" }, { value: "CR", label: "CR事業部" }, { value: "both", label: "MR+CR" },
            ]} />
          </FormField>
        </div>
      </Modal>

      {/* 新規倉庫モーダル */}
      <Modal
        isOpen={showNewWarehouse}
        onClose={() => setShowNewWarehouse(false)}
        title="倉庫 新規登録"
        footer={
          <>
            <button onClick={() => setShowNewWarehouse(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
            <button onClick={() => { setShowNewWarehouse(false); showToast("倉庫を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="倉庫コード" required><FormInput placeholder="例: KYS-W1" /></FormField>
          <FormField label="倉庫名" required><FormInput placeholder="例: 九州第1倉庫" /></FormField>
          <FormField label="所属工場" required>
            <FormSelect placeholder="選択" options={plants.map((p) => ({ value: p.id, label: p.name }))} />
          </FormField>
          <FormField label="区分" required>
            <FormSelect placeholder="選択" options={[
              { value: "internal", label: "自社" }, { value: "external", label: "外部" },
            ]} />
          </FormField>
        </div>
      </Modal>

      {/* 工場詳細モーダル */}
      <Modal
        isOpen={!!showPlantDetail}
        onClose={() => setShowPlantDetail(null)}
        title={selectedPlant ? `工場詳細: ${selectedPlant.name}` : ""}
        footer={
          <>
            <button onClick={() => { showToast("編集画面（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">編集</button>
            <button onClick={() => setShowPlantDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">閉じる</button>
          </>
        }
      >
        {selectedPlant && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">コード</p><p className="text-sm font-mono font-medium text-text">{selectedPlant.code}</p></div>
              <div><p className="text-xs text-text-tertiary">事業部</p><p className="text-sm text-text">{divisionLabels[selectedPlant.division]}</p></div>
            </div>
            <div><p className="text-xs text-text-tertiary">工場名</p><p className="text-sm font-medium text-text">{selectedPlant.name}</p></div>
            <div><p className="text-xs text-text-tertiary">所在地</p><p className="text-sm text-text">{selectedPlant.address}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">倉庫数</p><p className="text-sm text-text">{selectedPlant.warehouses}</p></div>
              <div><p className="text-xs text-text-tertiary">タンク数</p><p className="text-sm text-text">{selectedPlant.tanks}</p></div>
            </div>
            {selectedPlant.tanks > 0 && (
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary mb-2">タンク一覧</p>
                <p className="text-xs text-text-secondary">タンク詳細管理は Phase 2（CR事業部）で実装予定</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
