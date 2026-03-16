"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, Shield, Truck, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OilShipmentRow = {
  id: string;
  shipmentNumber: string;
  oilType: string;
  quantity: number;
  unitPrice: number | null;
  amount: number | null;
  shipmentDate: string;
  note: string | null;
  customer: { id: string; name: string };
};

const oilTypeLabels: Record<string, string> = {
  LIGHT_OIL: "Circular Pyrolysis Oil（軽質）",
  HEAVY_OIL: "Circular Pyrolysis Oil（重質）",
  MIXED_OIL: "Circular Pyrolysis Oil（混合）",
  RESIDUE: "残渣",
};

// Oil shipments don't have a status field in the schema - we treat all as "出荷完了"
// In the future, a status field could be added

export default function OilShipmentsPage() {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: allShipments, isLoading } = useSWR<OilShipmentRow[]>(
    "/api/cr/oil-shipments",
    fetcher
  );

  const shipments = allShipments ?? [];

  const filtered = shipments.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      return s.shipmentNumber.toLowerCase().includes(q) || s.customer.name.toLowerCase().includes(q);
    }
    return true;
  });

  const selected = shipments.find((s) => s.id === showDetail);

  return (
    <>
      <Header title="出荷管理（油化）" />
      <div className="p-6 space-y-4">
        {/* サマリカード */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-border bg-surface text-center">
            <p className="text-2xl font-bold text-text">{shipments.length}</p>
            <p className="text-sm text-text-secondary">出荷件数</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface text-center">
            <p className="text-2xl font-bold text-text">{shipments.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} L</p>
            <p className="text-sm text-text-secondary">総出荷量</p>
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="出荷番号、顧客名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />出荷登録
          </button>
        </div>

        {/* テーブル */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷番号</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷日</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ISCC</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{s.shipmentNumber}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(s.shipmentDate).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-sm text-text">{s.customer.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{oilTypeLabels[s.oilType] ?? s.oilType}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">{s.quantity.toLocaleString()} L</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                        <Shield className="w-3 h-3" />認証
                      </span>
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
        )}
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="出荷登録（油化）"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("出荷を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "関西化学工業株式会社" }, { value: "2", label: "株式会社丸紅プラスチック" },
          ]} /></FormField>
          <FormField label="製品" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "Circular Pyrolysis Oil（軽質）" }, { value: "2", label: "Circular Pyrolysis Oil（重質）" }, { value: "3", label: "Circular Pyrolysis Oil（混合）" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(L)" required><FormInput type="number" placeholder="例: 19000" /></FormField>
            <FormField label="出荷タンク" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "TK-01 軽質油タンクA (32.5kL)" }, { value: "2", label: "TK-02 軽質油タンクB (12.0kL)" },
              { value: "3", label: "TK-04 混合油タンク (8.2kL)" },
            ]} /></FormField>
          </div>
          <FormField label="車両タイプ" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "ローリー 10t" }, { value: "2", label: "ISOコンテナ 19t" },
          ]} /></FormField>
          <FormField label="出荷日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          <FormField label="分析ロット"><FormInput placeholder="例: 260312-TC" /></FormField>
          <FormField label="SD番号"><FormInput placeholder="例: CFP-000192-CA" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `出荷詳細: ${selected.shipmentNumber}` : ""}
        footer={<>
          <button onClick={() => { showToast("成績書PDF生成（開発中）", "info"); }} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><FileText className="w-4 h-4" />成績書</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.shipmentNumber}</span>
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">出荷完了</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer.name}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷日</p><p className="text-sm text-text">{new Date(selected.shipmentDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">製品</p><p className="text-sm text-text">{oilTypeLabels[selected.oilType] ?? selected.oilType}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} L</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-2">
              <p className="text-xs font-medium text-text">出荷情報</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selected.unitPrice != null && <div><p className="text-xs text-text-tertiary">単価</p><p className="text-text">{selected.unitPrice.toLocaleString()} 円/L</p></div>}
                {selected.amount != null && <div><p className="text-xs text-text-tertiary">金額</p><p className="text-text">{selected.amount.toLocaleString()} 円</p></div>}
              </div>
            </div>
            {selected.note && (
              <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
