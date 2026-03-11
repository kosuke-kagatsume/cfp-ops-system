"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { processingOrders, processStatusColors } from "@/lib/dummy-data-phase1";
import { Plus, Search, Eye, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function ProcessingPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = processingOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const selected = processingOrders.find((o) => o.id === showDetail);

  return (
    <>
      <Header title="加工管理" />
      <div className="p-6 space-y-4">
        {/* ステータスカード */}
        <div className="grid grid-cols-3 gap-4">
          {(["計画", "作業中", "完了"] as const).map((st) => {
            const items = processingOrders.filter((o) => o.status === st);
            return (
              <button key={st} onClick={() => setStatusFilter(statusFilter === st ? "all" : st)}
                className={`p-4 rounded-xl border text-left transition-colors ${statusFilter === st ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${processStatusColors[st]}`}>{st}</span>
                  <span className="text-2xl font-bold text-text">{items.length}</span>
                </div>
                {items.length > 0 && <p className="text-xs text-text-tertiary">{items[0].processType} - {items[0].plant}</p>}
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
        <div className="space-y-3">
          {filtered.map((order) => (
            <button key={order.id} onClick={() => setShowDetail(order.id)}
              className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary-600">{order.orderNumber}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${processStatusColors[order.status]}`}>{order.status}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-tertiary">{order.plant}</p>
                  <p className="text-xs text-text-secondary">{order.scheduledDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-surface-secondary rounded-lg">
                  <p className="text-xs text-text-tertiary">投入</p>
                  <p className="text-sm font-mono text-text">{order.inputProduct}</p>
                  <p className="text-xs text-text-secondary">{order.inputQuantity.toLocaleString()} kg</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    order.processType === "ルーダー" ? "bg-amber-100 text-amber-800" :
                    order.processType === "破砕" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>{order.processType}</span>
                  <ArrowRight className="w-4 h-4 text-text-tertiary mt-1" />
                </div>
                <div className="flex-1 p-3 bg-surface-secondary rounded-lg">
                  <p className="text-xs text-text-tertiary">完成</p>
                  <p className="text-sm font-mono text-text">{order.outputProduct}</p>
                  {order.outputQuantity ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-text-secondary">{order.outputQuantity.toLocaleString()} kg</p>
                      <span className="text-xs font-medium text-emerald-600">歩留 {order.yieldRate}%</span>
                    </div>
                  ) : (
                    <p className="text-xs text-text-tertiary">-</p>
                  )}
                </div>
              </div>
              {order.instructions && (
                <p className="text-xs text-text-tertiary mt-2">{order.instructions}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 加工指示モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="加工指示 作成"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("加工指示を作成しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">作成する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="加工種別" required><FormSelect placeholder="選択" options={[
            { value: "ルーダー", label: "ルーダー（溶融ペレット化）" }, { value: "破砕", label: "破砕" },
            { value: "積替", label: "積替" }, { value: "詰替", label: "詰替" },
            { value: "研磨", label: "研磨" }, { value: "リロール", label: "リロール" }, { value: "ミミ巻き", label: "ミミ巻き" },
          ]} /></FormField>
          <FormField label="工場" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "高松工場" }, { value: "2", label: "美の浜工場" }, { value: "3", label: "四日市工場" },
          ]} /></FormField>
          <FormField label="投入原料（品目コード）" required><FormSelect placeholder="在庫から選択" options={[
            { value: "1", label: "PP-CRS-W-B1 (12,500kg @美の浜)" }, { value: "2", label: "PE-FLM-N-A2 (6,300kg @四日市)" },
          ]} /></FormField>
          <FormField label="投入量(kg)" required><FormInput type="number" placeholder="例: 5000" /></FormField>
          <FormField label="完成品コード" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "PP-PEL-W-A1 PP ペレット 白 A級" }, { value: "2", label: "PE-PEL-N-A1 PE ペレット ナチュラル A級" },
          ]} /></FormField>
          <FormField label="作業日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          <FormField label="指示内容"><FormInput placeholder="例: 温度設定220℃、スクリュー150rpm" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `加工詳細: ${selected.orderNumber}` : ""}
        footer={<>
          {selected?.status === "計画" && <button onClick={() => { setShowDetail(null); showToast("作業開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">作業開始</button>}
          {selected?.status === "作業中" && <button onClick={() => { setShowDetail(null); showToast("完了処理画面へ（開発中）", "info"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">完了入力</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.orderNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${processStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">加工種別</p><p className="text-sm font-medium text-text">{selected.processType}</p></div>
              <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant}</p></div>
              <div><p className="text-xs text-text-tertiary">予定日</p><p className="text-sm text-text">{selected.scheduledDate}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-3">
              <div><p className="text-xs text-text-tertiary">投入</p><p className="text-sm font-mono">{selected.inputProduct}</p><p className="text-xs text-text-secondary">{selected.inputProductName} / {selected.inputQuantity.toLocaleString()} kg</p></div>
              <div><p className="text-xs text-text-tertiary">完成品</p><p className="text-sm font-mono">{selected.outputProduct}</p>
                {selected.outputQuantity ? (
                  <p className="text-xs text-text-secondary">{selected.outputProductName} / {selected.outputQuantity.toLocaleString()} kg（歩留 {selected.yieldRate}%）</p>
                ) : (
                  <p className="text-xs text-text-tertiary">{selected.outputProductName} / 未計量</p>
                )}
              </div>
            </div>
            {selected.instructions && <div><p className="text-xs text-text-tertiary">指示内容</p><p className="text-sm text-text">{selected.instructions}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
}
