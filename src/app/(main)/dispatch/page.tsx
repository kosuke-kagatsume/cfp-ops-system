"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { dispatches } from "@/lib/dummy-data-phase1";
import { Plus, Phone, MapPin, Truck as TruckIcon, Eye } from "lucide-react";
import { useState } from "react";

export default function DispatchPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const selected = dispatches.find((d) => d.id === showDetail);

  return (
    <>
      <Header title="配車管理" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">{dispatches.length}件の配車</p>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />配車登録
          </button>
        </div>

        {/* 配車カード */}
        <div className="space-y-3">
          {dispatches.map((d) => (
            <button key={d.id} onClick={() => setShowDetail(d.id)}
              className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary-600">{d.shipmentNumber}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    d.status === "手配済" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>{d.status}</span>
                </div>
                <span className="text-sm text-text-secondary">{d.date}</span>
              </div>

              <div className="flex items-start gap-4">
                {/* 運送情報 */}
                <div className="flex-1 p-3 bg-surface-secondary rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TruckIcon className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm font-medium text-text">{d.carrier}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-text-tertiary">車両: </span><span className="text-text-secondary">{d.vehicleType}</span></div>
                    <div><span className="text-text-tertiary">車番: </span><span className="font-mono text-text-secondary">{d.vehicleNumber}</span></div>
                    {d.driverName !== "-" && <>
                      <div><span className="text-text-tertiary">運転手: </span><span className="text-text-secondary">{d.driverName}</span></div>
                      <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-text-tertiary" /><span className="text-text-secondary">{d.driverPhone}</span></div>
                    </>}
                  </div>
                </div>

                {/* 引取→納品 */}
                <div className="flex-1 space-y-2">
                  <div className="p-2 bg-blue-50 rounded-lg flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600">引取先</p>
                      <p className="text-sm text-blue-800">{d.pickup}</p>
                    </div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-emerald-600">納品先</p>
                      <p className="text-sm text-emerald-800">{d.delivery}</p>
                    </div>
                  </div>
                </div>
              </div>

              {d.freight > 0 && (
                <div className="mt-3 text-right">
                  <span className="text-xs text-text-tertiary">運賃: </span>
                  <span className="text-sm font-medium text-text">¥{d.freight.toLocaleString()}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 配車登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="配車登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("配車を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="出荷番号" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "SHP-2026-0156（東洋プラスチック）" }, { value: "2", label: "SHP-2026-0155（関西化学工業）" },
          ]} /></FormField>
          <FormField label="運送会社" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "中国運輸株式会社" }, { value: "self", label: "自社手配" }, { value: "customer", label: "顧客手配" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="車両タイプ" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "10tウイング" }, { value: "2", label: "4tウイング" }, { value: "3", label: "4tユニック" },
            ]} /></FormField>
            <FormField label="車両番号"><FormInput placeholder="例: 福山 100 あ 1234" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="運転手名"><FormInput placeholder="例: 山本 太郎" /></FormField>
            <FormField label="携帯番号"><FormInput placeholder="例: 090-1234-5678" /></FormField>
          </div>
          <FormField label="運賃(円)"><FormInput type="number" placeholder="例: 45000" /></FormField>
          <FormField label="配車日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `配車詳細: ${selected.shipmentNumber}` : ""}
        footer={<>
          <button onClick={() => { showToast("引取連絡書を生成（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">引取連絡書</button>
          <button onClick={() => { showToast("運送指示書を生成（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">運送指示書</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.shipmentNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                selected.status === "手配済" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">配車日</p><p className="text-sm text-text">{selected.date}</p></div>
              <div><p className="text-xs text-text-tertiary">運賃</p><p className="text-sm font-medium text-text">{selected.freight > 0 ? `¥${selected.freight.toLocaleString()}` : "（顧客/自社手配）"}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-2">
              <p className="text-xs font-medium text-text">運送情報</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-text-tertiary">運送会社</p><p className="text-text">{selected.carrier}</p></div>
                <div><p className="text-xs text-text-tertiary">車両</p><p className="text-text">{selected.vehicleType}</p></div>
                <div><p className="text-xs text-text-tertiary">車番</p><p className="font-mono text-text">{selected.vehicleNumber}</p></div>
                <div><p className="text-xs text-text-tertiary">運転手</p><p className="text-text">{selected.driverName}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-blue-600">引取先</p><p className="text-sm text-blue-800">{selected.pickup}</p></div>
              <div className="p-3 bg-emerald-50 rounded-lg"><p className="text-xs text-emerald-600">納品先</p><p className="text-sm text-emerald-800">{selected.delivery}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
