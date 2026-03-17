"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Search, Shield, MapPin, Package, Flame, TestTube, Truck, Eye, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type TraceStageItem = {
  id: string;
  stageOrder: number;
  stageName: string;
  stageDate: string;
  location: string | null;
  quantity: number | null;
  note: string | null;
};

type TraceRecordItem = {
  id: string;
  traceNumber: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
  stages: TraceStageItem[];
};

const stageIcons: Record<string, typeof Package> = {
  "原料入荷": Package,
  "ルーダー加工": Flame,
  "油化製造": Flame,
  "タンク貯蔵": MapPin,
  "製品在庫": MapPin,
  "品質検査": TestTube,
  "出荷": Truck,
};

const stageColors: Record<string, string> = {
  "原料入荷": "bg-blue-100 text-blue-700 border-blue-200",
  "ルーダー加工": "bg-orange-100 text-orange-700 border-orange-200",
  "油化製造": "bg-orange-100 text-orange-700 border-orange-200",
  "タンク貯蔵": "bg-purple-100 text-purple-700 border-purple-200",
  "製品在庫": "bg-purple-100 text-purple-700 border-purple-200",
  "品質検査": "bg-teal-100 text-teal-700 border-teal-200",
  "出荷": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const stageNameOptions = [
  { value: "原料入荷", label: "原料入荷" },
  { value: "ルーダー加工", label: "ルーダー加工" },
  { value: "油化製造", label: "油化製造" },
  { value: "タンク貯蔵", label: "タンク貯蔵" },
  { value: "製品在庫", label: "製品在庫" },
  { value: "品質検査", label: "品質検査" },
  { value: "出荷", label: "出荷" },
];

export default function TraceabilityPage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const { showToast } = useToast();

  const { items: traceRecords, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<TraceRecordItem>(
    `/api/traceability${search ? `?search=${encodeURIComponent(search
  )}` : ""}`
  );

  const selected = traceRecords.find((t) => t.id === showDetail);

  const [newForm, setNewForm] = useState({ sourceType: "PURCHASE", sourceId: "", stageName: "", stageDate: new Date().toISOString().split("T")[0], location: "", quantity: "", note: "" });

  const handleCreate = async () => {
    try {
      const stages = newForm.stageName ? [{
        stageOrder: 1, stageName: newForm.stageName, stageDate: newForm.stageDate,
        location: newForm.location || undefined, quantity: newForm.quantity ? parseFloat(newForm.quantity) : undefined,
        note: newForm.note || undefined,
      }] : [];
      const res = await fetch("/api/traceability", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: newForm.sourceType, sourceId: newForm.sourceId || "manual", stages }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ sourceType: "PURCHASE", sourceId: "", stageName: "", stageDate: new Date().toISOString().split("T")[0], location: "", quantity: "", note: "" });
      mutate();
      showToast("トレース記録を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このトレース記録を削除しますか？")) return;
    try {
      const res = await fetch(`/api/traceability/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("トレース記録を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="トレーサビリティ" />
      <div className="p-6 space-y-4">
        {/* 説明バナー */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-800">原料→製造→出荷 一気通貫追跡</p>
            <p className="text-xs text-primary-600">ロット番号で原料の入荷から製品の出荷まで、全工程を追跡できます。ISCC認証チェーンも可視化。</p>
          </div>
        </div>

        {/* 検索 + 新規 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="トレース番号で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-3 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors shrink-0">
            <Plus className="w-4 h-4" />トレース登録
          </button>
        </div>

        {/* トレースカード */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : traceRecords && traceRecords.length > 0 ? (
          <div className="space-y-4">
            {traceRecords.map((trace) => (
              <div key={trace.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-primary-600">{trace.traceNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          trace.sourceType === "PURCHASE" ? "bg-blue-50 text-blue-700" :
                          trace.sourceType === "PROCESSING" ? "bg-orange-50 text-orange-700" :
                          "bg-emerald-50 text-emerald-700"
                        }`}>
                          {trace.sourceType === "PURCHASE" ? "仕入" : trace.sourceType === "PROCESSING" ? "加工" : "出荷"}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary mt-1">ソースID: {trace.sourceId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowDetail(trace.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
                        <Eye className="w-3.5 h-3.5" />詳細
                      </button>
                      <button onClick={() => handleDelete(trace.id)}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* フローチャート */}
                  <div className="flex items-start gap-0 overflow-x-auto pb-2">
                    {trace.stages.map((stage, i) => {
                      const Icon = stageIcons[stage.stageName] || Package;
                      const color = stageColors[stage.stageName] || "bg-gray-100 text-gray-700 border-gray-200";
                      return (
                        <div key={stage.id} className="flex items-start shrink-0">
                          <div className={`p-3 rounded-lg border ${color} min-w-[160px]`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-medium">{stage.stageName}</span>
                            </div>
                            <p className="text-xs mt-1">{stage.note ?? "-"}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">{new Date(stage.stageDate).toLocaleDateString("ja-JP")}</span>
                              {stage.quantity != null && <span className="text-xs opacity-70">{stage.quantity.toLocaleString()}kg</span>}
                            </div>
                          </div>
                          {i < trace.stages.length - 1 && (
                            <div className="flex items-center px-1 pt-5">
                              <div className="w-6 h-0.5 bg-border" />
                              <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-border" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-text-tertiary">トレースデータがありません</p>
          </div>
        )}
      </div>

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="トレース記録 登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="ソース種別" required><FormSelect value={newForm.sourceType} onChange={(e) => setNewForm({ ...newForm, sourceType: e.target.value })} options={[
            { value: "PURCHASE", label: "仕入" }, { value: "PROCESSING", label: "加工" }, { value: "SHIPMENT", label: "出荷" },
          ]} /></FormField>
          <FormField label="ソースID"><FormInput placeholder="例: PUR-2026-0001" value={newForm.sourceId} onChange={(e) => setNewForm({ ...newForm, sourceId: e.target.value })} /></FormField>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-text mb-2">初期ステージ</p>
            <FormField label="ステージ名" required><FormSelect placeholder="選択" value={newForm.stageName} onChange={(e) => setNewForm({ ...newForm, stageName: e.target.value })} options={stageNameOptions} /></FormField>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <FormField label="日付" required><FormInput type="date" value={newForm.stageDate} onChange={(e) => setNewForm({ ...newForm, stageDate: e.target.value })} /></FormField>
              <FormField label="数量(kg)"><FormInput type="number" placeholder="例: 5000" value={newForm.quantity} onChange={(e) => setNewForm({ ...newForm, quantity: e.target.value })} /></FormField>
            </div>
            <div className="mt-2">
              <FormField label="場所"><FormInput placeholder="例: 福山工場" value={newForm.location} onChange={(e) => setNewForm({ ...newForm, location: e.target.value })} /></FormField>
            </div>
            <div className="mt-2">
              <FormField label="備考"><FormInput placeholder="例: ロット260312-TC" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
            </div>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `トレース: ${selected.traceNumber}` : ""}
        footer={<>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => showToast("トレースレポートPDF生成（開発中）", "info")} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">PDF出力</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text">{selected.traceNumber}</p>
              <p className="text-xs text-text-tertiary">
                {selected.sourceType === "PURCHASE" ? "仕入" : selected.sourceType === "PROCESSING" ? "加工" : "出荷"} | ソースID: {selected.sourceId}
              </p>
            </div>
            <div className="space-y-0">
              {selected.stages.map((stage, i) => {
                const Icon = stageIcons[stage.stageName] || Package;
                return (
                  <div key={stage.id}>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-surface-tertiary text-text-secondary">
                          <Icon className="w-4 h-4" />
                        </div>
                        {i < selected.stages.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-text">{stage.stageName}</p>
                          <span className="text-xs text-text-tertiary">{new Date(stage.stageDate).toLocaleDateString("ja-JP")}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{stage.note ?? "-"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                          {stage.location && <span>{stage.location}</span>}
                          {stage.quantity != null && <span>{stage.quantity.toLocaleString()}kg</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
