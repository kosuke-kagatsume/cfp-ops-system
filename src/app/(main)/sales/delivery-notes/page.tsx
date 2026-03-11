"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Download, Eye, FileText, ArrowRight } from "lucide-react";
import { useState } from "react";

type DeliveryNoteStatus = "仮納品書" | "本納品書" | "発行済";
const statusColors: Record<DeliveryNoteStatus, string> = { "仮納品書": "bg-amber-50 text-amber-700", "本納品書": "bg-blue-50 text-blue-700", "発行済": "bg-emerald-50 text-emerald-700" };

const deliveryNotes = [
  { id: "1", number: "DN-2026-0078", customer: "東洋プラスチック株式会社", product: "PP ペレット ナチュラル A級", quantity: 5000, shipDate: "2026-03-10", status: "本納品書" as DeliveryNoteStatus, orderNumber: "ORD-2026-0112" },
  { id: "2", number: "DN-2026-0077", customer: "関西化学工業株式会社", product: "PS ペレット 白 A級", quantity: 4100, shipDate: "2026-03-08", status: "発行済" as DeliveryNoteStatus, orderNumber: "ORD-2026-0111" },
  { id: "3", number: "DN-2026-0079", customer: "株式会社丸紅プラスチック", product: "ABS ペレット 黒 A級", quantity: 2280, shipDate: "2026-03-12", status: "仮納品書" as DeliveryNoteStatus, orderNumber: "ORD-2026-0113" },
  { id: "4", number: "DN-2026-0076", customer: "関西化学工業株式会社", product: "Circular Pyrolysis Oil（軽質）", quantity: 19000, shipDate: "2026-03-05", status: "発行済" as DeliveryNoteStatus, orderNumber: "ORD-2026-0110" },
];

export default function DeliveryNotesPage() {
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();
  const selected = deliveryNotes.find((d) => d.id === showDetail);

  return (
    <>
      <Header title="納品書管理" />
      <div className="p-6 space-y-4">
        {/* フロー説明 */}
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs font-medium text-text-secondary mb-2">納品書発行フロー</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">仮納品書</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">本納品書</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">発行済</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button onClick={() => showToast("一括PDF生成しました（モック）", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
            <Download className="w-4 h-4" />PDF一括出力
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">納品書番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受注番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量(kg)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷日</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {deliveryNotes.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{d.number}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{d.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-text">{d.customer}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{d.product}</td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">{d.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{d.shipDate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(d.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{deliveryNotes.length}件</p>
          </div>
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `納品書詳細: ${selected.number}` : ""}
        footer={<>
          {selected?.status === "仮納品書" && <button onClick={() => { setShowDetail(null); showToast("本納品書に昇格しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">本納品書に昇格</button>}
          {selected?.status === "本納品書" && <button onClick={() => { setShowDetail(null); showToast("納品書を発行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">発行する</button>}
          <button onClick={() => { showToast("PDFプレビューを表示します（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">PDFプレビュー</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.number}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer}</p></div>
              <div><p className="text-xs text-text-tertiary">受注番号</p><p className="text-sm font-mono text-text">{selected.orderNumber}</p></div>
              <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm text-text">{selected.product}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} kg</p></div>
              <div><p className="text-xs text-text-tertiary">出荷日</p><p className="text-sm text-text">{selected.shipDate}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
