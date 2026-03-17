"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Factory, Warehouse as WarehouseIcon, Droplets, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type Plant = {
  id: string;
  code: string;
  name: string;
  companyId: string;
  address: string | null;
  tel: string | null;
  warehouses: { id: string }[];
  tanks: { id: string }[];
};

type Warehouse = {
  id: string;
  code: string;
  name: string;
  type: string;
  plant: { id: string; name: string } | null;
};

const companyLabels: Record<string, string> = {
  CFP: "CFP",
  RE: "RE",
  CTS: "CTS",
};

export default function PlantsPage() {
  const [tab, setTab] = useState<"plants" | "warehouses">("plants");
  const [showNewPlant, setShowNewPlant] = useState(false);
  const [showEditPlant, setShowEditPlant] = useState(false);
  const [showNewWarehouse, setShowNewWarehouse] = useState(false);
  const [showEditWarehouse, setShowEditWarehouse] = useState(false);
  const [showPlantDetail, setShowPlantDetail] = useState<string | null>(null);
  const [whMenuOpen, setWhMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const { items: plants, total, page, limit, isLoading: plantsLoading, mutate: mutatePlants, onPageChange } = usePaginated<Plant>(
    "/api/masters/plants"
  );
  const { data: warehouses, isLoading: warehousesLoading, mutate: mutateWarehouses } = useSWR<Warehouse[]>("/api/masters/warehouses");

  const selectedPlant = plants.find((p) => p.id === showPlantDetail);

  // 新規工場フォーム
  const [plantForm, setPlantForm] = useState({ code: "", name: "", address: "", companyId: "CFP" });
  const handleCreatePlant = async () => {
    try {
      const res = await fetch("/api/masters/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plantForm),
      });
      if (!res.ok) throw new Error();
      setShowNewPlant(false);
      setPlantForm({ code: "", name: "", address: "", companyId: "CFP" });
      mutatePlants();
      showToast("工場を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  // 新規倉庫フォーム
  const [whForm, setWhForm] = useState({ code: "", name: "", plantId: "", type: "INTERNAL" });
  const handleCreateWarehouse = async () => {
    try {
      const res = await fetch("/api/masters/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...whForm, plantId: whForm.plantId || undefined }),
      });
      if (!res.ok) throw new Error();
      setShowNewWarehouse(false);
      setWhForm({ code: "", name: "", plantId: "", type: "INTERNAL" });
      mutateWarehouses();
      mutatePlants();
      showToast("倉庫を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  // 工場編集
  const [editPlantId, setEditPlantId] = useState<string | null>(null);
  const [editPlantForm, setEditPlantForm] = useState({ name: "", address: "", companyId: "CFP", tel: "" });

  const openEditPlant = (plant: Plant) => {
    setEditPlantId(plant.id);
    setEditPlantForm({
      name: plant.name,
      address: plant.address ?? "",
      companyId: plant.companyId,
      tel: plant.tel ?? "",
    });
    setShowEditPlant(true);
    setShowPlantDetail(null);
  };

  const handleUpdatePlant = async () => {
    if (!editPlantId) return;
    try {
      const res = await fetch(`/api/masters/plants/${editPlantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPlantForm),
      });
      if (!res.ok) throw new Error();
      setShowEditPlant(false);
      setEditPlantId(null);
      mutatePlants();
      showToast("工場を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDeletePlant = async (id: string) => {
    if (!confirm("この工場を削除しますか？")) return;
    try {
      await fetch(`/api/masters/plants/${id}`, { method: "DELETE" });
      mutatePlants();
      showToast("工場を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
    setShowPlantDetail(null);
  };

  // 倉庫編集
  const [editWhId, setEditWhId] = useState<string | null>(null);
  const [editWhForm, setEditWhForm] = useState({ name: "", plantId: "", type: "INTERNAL" });

  const openEditWarehouse = (wh: Warehouse) => {
    setEditWhId(wh.id);
    setEditWhForm({
      name: wh.name,
      plantId: wh.plant?.id ?? "",
      type: wh.type,
    });
    setShowEditWarehouse(true);
    setWhMenuOpen(null);
  };

  const handleUpdateWarehouse = async () => {
    if (!editWhId) return;
    try {
      const res = await fetch(`/api/masters/warehouses/${editWhId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editWhForm, plantId: editWhForm.plantId || undefined }),
      });
      if (!res.ok) throw new Error();
      setShowEditWarehouse(false);
      setEditWhId(null);
      mutateWarehouses();
      mutatePlants();
      showToast("倉庫を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm("この倉庫を削除しますか？")) return;
    try {
      await fetch(`/api/masters/warehouses/${id}`, { method: "DELETE" });
      mutateWarehouses();
      mutatePlants();
      showToast("倉庫を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
    setWhMenuOpen(null);
  };

  const isLoading = tab === "plants" ? plantsLoading : warehousesLoading;

  return (
    <>
      <Header title="工場・倉庫マスタ" />
      <div className="p-4 md:p-6 space-y-4">
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
            <WarehouseIcon className="w-4 h-4" />
            倉庫
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : tab === "plants" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                    <p className="text-xs text-text-tertiary mt-0.5">{plant.address ?? "-"}</p>
                  </div>
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                    {companyLabels[plant.companyId] ?? plant.companyId}
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <WarehouseIcon className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm text-text-secondary">{plant.warehouses.length}倉庫</span>
                  </div>
                  {plant.tanks.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">{plant.tanks.length}タンク</span>
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-text-secondary">{warehouses?.length ?? 0}件の倉庫</p>
              <button
                onClick={() => setShowNewWarehouse(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                倉庫追加
              </button>
            </div>
            <div className="bg-surface rounded-xl border border-border overflow-x-auto">
              <table className="w-full min-w-[800px]">
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
                  {warehouses?.map((wh) => (
                    <tr key={wh.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">{wh.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text">{wh.name}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{wh.plant?.name ?? "（外部）"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          wh.type === "INTERNAL" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                        }`}>
                          {wh.type === "INTERNAL" ? "自社" : "外部"}
                        </span>
                      </td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setWhMenuOpen(whMenuOpen === wh.id ? null : wh.id)}
                          className="p-2 hover:bg-surface-tertiary rounded transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                        </button>
                        {whMenuOpen === wh.id && (
                          <div className="absolute right-4 top-12 bg-surface rounded-lg border border-border shadow-lg py-1 z-10 w-36">
                            <button onClick={() => openEditWarehouse(wh)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary">
                              <Edit className="w-4 h-4" /> 編集
                            </button>
                            <button onClick={() => handleDeleteWarehouse(wh.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-tertiary">
                              <Trash2 className="w-4 h-4" /> 削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {warehouses?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-text-tertiary">倉庫が登録されていません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            
              <div className="px-4 py-3 border-t border-border">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
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
            <button onClick={handleCreatePlant} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="工場コード" required>
            <FormInput placeholder="例: KYS" value={plantForm.code} onChange={(e) => setPlantForm({ ...plantForm, code: e.target.value })} />
          </FormField>
          <FormField label="工場名" required>
            <FormInput placeholder="例: 九州工場" value={plantForm.name} onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })} />
          </FormField>
          <FormField label="所在地">
            <FormInput placeholder="例: 福岡県" value={plantForm.address} onChange={(e) => setPlantForm({ ...plantForm, address: e.target.value })} />
          </FormField>
          <FormField label="会社" required>
            <FormSelect value={plantForm.companyId} onChange={(e) => setPlantForm({ ...plantForm, companyId: e.target.value })} options={[
              { value: "CFP", label: "CFP" }, { value: "RE", label: "RE" }, { value: "CTS", label: "CTS" },
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
            <button onClick={handleCreateWarehouse} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="倉庫コード" required>
            <FormInput placeholder="例: KYS-W1" value={whForm.code} onChange={(e) => setWhForm({ ...whForm, code: e.target.value })} />
          </FormField>
          <FormField label="倉庫名" required>
            <FormInput placeholder="例: 九州第1倉庫" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} />
          </FormField>
          <FormField label="所属工場">
            <FormSelect placeholder="選択（外部の場合は空）" value={whForm.plantId} onChange={(e) => setWhForm({ ...whForm, plantId: e.target.value })}
              options={plants.map((p) => ({ value: p.id, label: p.name })) ?? []} />
          </FormField>
          <FormField label="区分" required>
            <FormSelect value={whForm.type} onChange={(e) => setWhForm({ ...whForm, type: e.target.value })} options={[
              { value: "INTERNAL", label: "自社" }, { value: "EXTERNAL", label: "外部" },
            ]} />
          </FormField>
        </div>
      </Modal>

      {/* 工場編集モーダル */}
      <Modal
        isOpen={showEditPlant}
        onClose={() => setShowEditPlant(false)}
        title="工場・拠点 編集"
        footer={
          <>
            <button onClick={() => setShowEditPlant(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
            <button onClick={handleUpdatePlant} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">更新する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="工場名" required>
            <FormInput value={editPlantForm.name} onChange={(e) => setEditPlantForm({ ...editPlantForm, name: e.target.value })} />
          </FormField>
          <FormField label="所在地">
            <FormInput value={editPlantForm.address} onChange={(e) => setEditPlantForm({ ...editPlantForm, address: e.target.value })} />
          </FormField>
          <FormField label="電話番号">
            <FormInput value={editPlantForm.tel} onChange={(e) => setEditPlantForm({ ...editPlantForm, tel: e.target.value })} />
          </FormField>
          <FormField label="会社" required>
            <FormSelect value={editPlantForm.companyId} onChange={(e) => setEditPlantForm({ ...editPlantForm, companyId: e.target.value })} options={[
              { value: "CFP", label: "CFP" }, { value: "RE", label: "RE" }, { value: "CTS", label: "CTS" },
            ]} />
          </FormField>
        </div>
      </Modal>

      {/* 倉庫編集モーダル */}
      <Modal
        isOpen={showEditWarehouse}
        onClose={() => setShowEditWarehouse(false)}
        title="倉庫 編集"
        footer={
          <>
            <button onClick={() => setShowEditWarehouse(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
            <button onClick={handleUpdateWarehouse} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">更新する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="倉庫名" required>
            <FormInput value={editWhForm.name} onChange={(e) => setEditWhForm({ ...editWhForm, name: e.target.value })} />
          </FormField>
          <FormField label="所属工場">
            <FormSelect placeholder="選択（外部の場合は空）" value={editWhForm.plantId} onChange={(e) => setEditWhForm({ ...editWhForm, plantId: e.target.value })}
              options={plants.map((p) => ({ value: p.id, label: p.name })) ?? []} />
          </FormField>
          <FormField label="区分" required>
            <FormSelect value={editWhForm.type} onChange={(e) => setEditWhForm({ ...editWhForm, type: e.target.value })} options={[
              { value: "INTERNAL", label: "自社" }, { value: "EXTERNAL", label: "外部" },
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
            <button onClick={() => selectedPlant && handleDeletePlant(selectedPlant.id)} className="px-4 py-2 text-sm border border-danger text-danger rounded-lg hover:bg-red-50 transition-colors">削除</button>
            <button onClick={() => selectedPlant && openEditPlant(selectedPlant)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">編集</button>
            <button onClick={() => setShowPlantDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">閉じる</button>
          </>
        }
      >
        {selectedPlant && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">コード</p><p className="text-sm font-mono font-medium text-text">{selectedPlant.code}</p></div>
              <div><p className="text-xs text-text-tertiary">会社</p><p className="text-sm text-text">{companyLabels[selectedPlant.companyId] ?? selectedPlant.companyId}</p></div>
            </div>
            <div><p className="text-xs text-text-tertiary">工場名</p><p className="text-sm font-medium text-text">{selectedPlant.name}</p></div>
            <div><p className="text-xs text-text-tertiary">所在地</p><p className="text-sm text-text">{selectedPlant.address ?? "-"}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">倉庫数</p><p className="text-sm text-text">{selectedPlant.warehouses.length}</p></div>
              <div><p className="text-xs text-text-tertiary">タンク数</p><p className="text-sm text-text">{selectedPlant.tanks.length}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
