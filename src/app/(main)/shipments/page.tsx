"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { shipments, shipmentStatusColors, type ShipmentStatus } from "@/lib/dummy-data-phase1";
import { Plus, Search, Eye, Download, Camera, FileText } from "lucide-react";
import { useState } from "react";

const statusSteps: ShipmentStatus[] = ["出庫表作成", "貨物選定", "計量待ち", "積込中", "出荷完了"];

export default function ShipmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = shipments.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.shipmentNumber.toLowerCase().includes(q) || s.customer.includes(q) || s.productName.includes(q);
    }
    return true;
  });

  const selected = shipments.find((s) => s.id === showDetail);

  return (
    <>
      <Header title="出荷管理" />
      <div className="p-6 space-y-4">
        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusSteps.map((step, i) => {
              const count = shipments.filter((s) => s.status === step).length;
              const isActive = statusFilter === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step)}
                    className={`flex-1 p-3 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{step}</p>
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
            <button onClick={() => showToast("出庫表を生成しました（モック）", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">
              <FileText className="w-4 h-4" />出庫表作成
            </button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" />出荷登録
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
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
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono text-primary-600">{s.shipmentNumber}</p>
                    <p className="text-xs text-text-tertiary">{s.deliveryNote}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{s.shipDate}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.customer}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{s.product}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">{s.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-secondary">{s.carrier}</p>
                    <p className="text-xs text-text-tertiary">{s.vehicleType}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${shipmentStatusColors[s.status]}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(s.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {shipments.length}件</p>
          </div>
        </div>
      </div>

      {/* 出荷登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="出荷登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("出荷を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "東洋プラスチック株式会社" }, { value: "2", label: "関西化学工業株式会社" },
            { value: "3", label: "株式会社丸紅プラスチック" }, { value: "4", label: "HINDUSTAN POLYMERS PVT. LTD." },
          ]} /></FormField>
          <FormField label="品目" required><FormSelect placeholder="在庫から選択" options={[
            { value: "1", label: "PP-PEL-N-A1 (18,700kg @高松)" }, { value: "2", label: "ABS-PEL-BK-A1 (8,200kg @美の浜)" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 5000" /></FormField>
            <FormField label="出荷倉庫" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "高松倉庫" }, { value: "2", label: "美の浜第1倉庫" }, { value: "3", label: "四日市第1倉庫" },
            ]} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="出荷日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
            <FormField label="納品日" required><FormInput type="date" defaultValue="2026-03-13" /></FormField>
          </div>
          <FormField label="運送" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "中国運輸株式会社" }, { value: "self", label: "自社手配" }, { value: "customer", label: "顧客手配" },
          ]} /></FormField>
          <FormField label="車両タイプ"><FormSelect placeholder="選択" options={[
            { value: "1", label: "10tウイング" }, { value: "2", label: "4tウイング" }, { value: "3", label: "4tユニック" }, { value: "4", label: "40ftコンテナ" },
          ]} /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `出荷詳細: ${selected.shipmentNumber}` : ""}
        footer={<>
          {selected?.status !== "出荷完了" && <button onClick={() => { setShowDetail(null); showToast("ステータスを進めました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">次のステップへ</button>}
          <button onClick={() => { setShowDetail(null); showToast("写真登録（開発中）", "info"); }} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Camera className="w-4 h-4" />写真</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            {/* ステータスプログレス */}
            <div className="flex items-center gap-1">
              {statusSteps.map((step, i) => {
                const stepIndex = statusSteps.indexOf(selected.status);
                const isPast = i <= stepIndex;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`flex-1 h-2 rounded-full ${isPast ? "bg-primary-500" : "bg-surface-tertiary"}`} />
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-text-secondary">{selected.status}</p>

            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer}</p></div>
              <div><p className="text-xs text-text-tertiary">納品書No</p><p className="text-sm font-mono text-text">{selected.deliveryNote}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷日</p><p className="text-sm text-text">{selected.shipDate}</p></div>
              <div><p className="text-xs text-text-tertiary">納品日</p><p className="text-sm text-text">{selected.deliveryDate}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm font-mono">{selected.product}</p><p className="text-xs text-text-secondary">{selected.productName}</p></div>
                <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-bold">{selected.quantity.toLocaleString()} kg</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">運送会社</p><p className="text-sm text-text">{selected.carrier}</p></div>
              <div><p className="text-xs text-text-tertiary">車両</p><p className="text-sm text-text">{selected.vehicleType}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷倉庫</p><p className="text-sm text-text">{selected.warehouse}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
