"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Search, Shield, MapPin, Package, Flame, TestTube, Truck, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export default function TraceabilityPage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: traceRecords, isLoading } = useSWR<TraceRecordItem[]>(
    `/api/traceability${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );

  const selected = traceRecords?.find((t) => t.id === showDetail);

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

        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input type="text" placeholder="トレース番号で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
                    <button onClick={() => setShowDetail(trace.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
                      <Eye className="w-3.5 h-3.5" />詳細
                    </button>
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

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `トレース: ${selected.traceNumber}` : ""}
        footer={<>
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
