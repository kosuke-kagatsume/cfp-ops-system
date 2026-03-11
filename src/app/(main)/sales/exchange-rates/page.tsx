"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { exchangeRates } from "@/lib/dummy-data-phase2";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function ExchangeRatesPage() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { showToast } = useToast();

  const currentMonth = "2026-03";
  const currentRates = exchangeRates.filter((r) => r.yearMonth === currentMonth);
  const historicalRates = exchangeRates.filter((r) => r.yearMonth !== currentMonth);

  return (
    <>
      <Header title="為替管理" />
      <div className="p-6 space-y-4">
        {/* 当月レート */}
        <div className="p-5 rounded-xl border border-primary-300 bg-primary-50/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-text">{currentMonth} 適用レート</h2>
              <p className="text-xs text-text-tertiary">最終更新: {currentRates[0]?.updatedAt} / {currentRates[0]?.updatedBy}</p>
            </div>
            <button onClick={() => setShowUpdateModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <RefreshCw className="w-4 h-4" />レート更新
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {currentRates.map((r) => (
              <div key={r.id} className="p-4 bg-surface rounded-lg border border-border text-center">
                <p className="text-sm text-text-secondary mb-1">{r.pair}</p>
                <p className="text-2xl font-bold text-text">{r.rate.toFixed(r.pair.includes("SGD") && !r.pair.startsWith("SGD") ? 3 : 2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 過去レート */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-secondary">
            <h3 className="text-sm font-medium text-text">過去の為替レート</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">年月</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">通貨ペア</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">レート</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">更新者</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">更新日</th>
              </tr>
            </thead>
            <tbody>
              {historicalRates.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-text">{r.yearMonth}</td>
                  <td className="px-4 py-3 text-sm text-text">{r.pair}</td>
                  <td className="px-4 py-3 text-sm text-text text-right font-mono">{r.rate.toFixed(r.pair.includes("SGD") && !r.pair.startsWith("SGD") ? 3 : 2)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{r.updatedBy}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{r.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="為替レート更新"
        footer={<>
          <button onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowUpdateModal(false); showToast("為替レートを更新しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="適用年月" required><FormSelect placeholder="選択" options={[
            { value: "2026-04", label: "2026年4月" }, { value: "2026-03", label: "2026年3月" },
          ]} /></FormField>
          <FormField label="USD/JPY" required><FormInput type="number" placeholder="例: 150.25" defaultValue="150.25" /></FormField>
          <FormField label="SGD/JPY" required><FormInput type="number" placeholder="例: 112.80" defaultValue="112.80" /></FormField>
          <FormField label="USD/SGD" required><FormInput type="number" placeholder="例: 1.332" defaultValue="1.332" /></FormField>
        </div>
      </Modal>
    </>
  );
}
