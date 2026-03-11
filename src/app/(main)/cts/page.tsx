"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { ctsTransactions, ctsStatusColors, type CtsTransactionStatus } from "@/lib/dummy-data-phase3";
import { Plus, Eye, Globe, ArrowRightLeft, Plane, DollarSign } from "lucide-react";
import { useState } from "react";

const statusList: CtsTransactionStatus[] = ["見積", "契約済", "出荷中", "完了"];

export default function CtsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = ctsTransactions.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const selected = ctsTransactions.find((t) => t.id === showDetail);
  const totalUsd = ctsTransactions.reduce((s, t) => s + t.amountUsd, 0);
  const totalJpy = ctsTransactions.reduce((s, t) => s + t.amountJpy, 0);

  return (
    <>
      <Header title="CTS管理" />
      <div className="p-6 space-y-4">
        {/* 説明バナー */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <Globe className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-purple-800">CTS（シンガポール）三ヵ国取引管理</p>
            <p className="text-xs text-purple-600">発生元 → CTS → CFP → 海外顧客の商流。USD/SGD/JPYの多通貨管理。</p>
          </div>
        </div>

        {/* サマリ */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">当月取引件数</p>
            <p className="text-2xl font-bold text-text">{ctsTransactions.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-1 mb-1"><DollarSign className="w-3 h-3 text-text-tertiary" /><p className="text-xs text-text-tertiary">合計(USD)</p></div>
            <p className="text-2xl font-bold text-text">${totalUsd.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">合計(JPY換算)</p>
            <p className="text-2xl font-bold text-text">¥{totalJpy.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-1 mb-1"><ArrowRightLeft className="w-3 h-3 text-text-tertiary" /><p className="text-xs text-text-tertiary">適用レート</p></div>
            <p className="text-sm font-medium text-text">USD/JPY: 150.25</p>
            <p className="text-sm font-medium text-text">USD/SGD: 1.332</p>
          </div>
        </div>

        {/* ステータスフィルタ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === "all" ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
              すべて
            </button>
            {statusList.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === s ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />取引登録
          </button>
        </div>

        {/* 取引カード */}
        <div className="space-y-3">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setShowDetail(t.id)}
              className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary-600">{t.number}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ctsStatusColors[t.status]}`}>{t.status}</span>
                </div>
                <span className="text-sm text-text-secondary">{t.date}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                {/* ルート表示 */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-2 bg-blue-50 rounded-lg text-center min-w-[100px]">
                    <p className="text-xs text-blue-600">Origin</p>
                    <p className="text-sm font-medium text-blue-800">{t.origin}</p>
                  </div>
                  <Plane className="w-4 h-4 text-text-tertiary" />
                  <div className="p-2 bg-emerald-50 rounded-lg text-center min-w-[100px]">
                    <p className="text-xs text-emerald-600">Destination</p>
                    <p className="text-sm font-medium text-emerald-800">{t.destination}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text">{t.customer}</p>
                  <p className="text-xs text-text-tertiary">{t.product}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-sm">
                <div><span className="text-xs text-text-tertiary">数量</span><p className="font-medium">{t.quantityKg.toLocaleString()} kg</p></div>
                <div><span className="text-xs text-text-tertiary">単価(USD)</span><p className="font-mono">${t.unitPriceUsd}/kg</p></div>
                <div><span className="text-xs text-text-tertiary">金額(USD)</span><p className="font-bold text-text">${t.amountUsd.toLocaleString()}</p></div>
                <div><span className="text-xs text-text-tertiary">金額(JPY)</span><p className="font-medium text-text-secondary">¥{t.amountJpy.toLocaleString()}</p></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="CTS取引登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("取引を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required><FormInput placeholder="例: PT. INDO PLASTICS" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="出荷元" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "日本" }, { value: "2", label: "シンガポール" },
            ]} /></FormField>
            <FormField label="仕向地" required><FormInput placeholder="例: インドネシア" /></FormField>
          </div>
          <FormField label="製品" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "PP Pellet Natural A" }, { value: "2", label: "ABS Pellet Black A" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 40000" /></FormField>
            <FormField label="単価(USD/kg)" required><FormInput type="number" placeholder="例: 0.85" /></FormField>
          </div>
          <FormField label="取引日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `CTS取引: ${selected.number}` : ""}
        footer={<>
          {selected?.status === "見積" && <button onClick={() => { setShowDetail(null); showToast("契約確定しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">契約確定</button>}
          {selected?.status === "出荷中" && <button onClick={() => { setShowDetail(null); showToast("取引完了にしました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">完了</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.number}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ctsStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer}</p></div>
              <div><p className="text-xs text-text-tertiary">取引日</p><p className="text-sm text-text">{selected.date}</p></div>
              <div><p className="text-xs text-text-tertiary">出荷元</p><p className="text-sm text-text">{selected.origin}</p></div>
              <div><p className="text-xs text-text-tertiary">仕向地</p><p className="text-sm text-text">{selected.destination}</p></div>
              <div><p className="text-xs text-text-tertiary">製品</p><p className="text-sm text-text">{selected.product}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantityKg.toLocaleString()} kg</p></div>
            </div>
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-3">多通貨計算</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">単価</span><span className="font-mono">${selected.unitPriceUsd}/kg</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">金額(USD)</span><span className="font-mono font-bold">${selected.amountUsd.toLocaleString()}</span></div>
                <div className="border-t border-border pt-2 flex justify-between"><span className="text-text-secondary">→ SGD (rate: {selected.rateUsdSgd})</span><span className="font-mono">SGD {selected.amountSgd.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">→ JPY (rate: {selected.rateUsdJpy})</span><span className="font-mono">¥{selected.amountJpy.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
