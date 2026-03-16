"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ExchangeRate = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  createdAt: string;
};

function getPair(r: ExchangeRate) {
  return `${r.fromCurrency}/${r.toCurrency}`;
}

function getYearMonth(d: string) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatRateDecimals(pair: string, rate: number) {
  if (pair.includes("SGD") && !pair.startsWith("SGD")) return rate.toFixed(3);
  return rate.toFixed(2);
}

export default function ExchangeRatesPage() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { showToast } = useToast();

  const { data: rates, isLoading } = useSWR<ExchangeRate[]>(
    "/api/sales/exchange-rates",
    fetcher
  );

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentRates = rates?.filter((r) => getYearMonth(r.effectiveDate) === currentMonth) ?? [];
  const historicalRates = rates?.filter((r) => getYearMonth(r.effectiveDate) !== currentMonth) ?? [];

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ja-JP");

  return (
    <>
      <Header title="為替管理" />
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <>
            {/* 当月レート */}
            <div className="p-5 rounded-xl border border-primary-300 bg-primary-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-text">{currentMonth} 適用レート</h2>
                  <p className="text-xs text-text-tertiary">
                    {currentRates.length > 0
                      ? `最終更新: ${formatDate(currentRates[0].createdAt)}`
                      : "データなし"}
                  </p>
                </div>
                <button onClick={() => setShowUpdateModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
                  <RefreshCw className="w-4 h-4" />レート更新
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {currentRates.map((r) => (
                  <div key={r.id} className="p-4 bg-surface rounded-lg border border-border text-center">
                    <p className="text-sm text-text-secondary mb-1">{getPair(r)}</p>
                    <p className="text-2xl font-bold text-text">{formatRateDecimals(getPair(r), r.rate)}</p>
                  </div>
                ))}
                {currentRates.length === 0 && (
                  <div className="col-span-3 text-center py-4 text-sm text-text-tertiary">当月のレートデータがありません</div>
                )}
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalRates.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text">{getYearMonth(r.effectiveDate)}</td>
                      <td className="px-4 py-3 text-sm text-text">{getPair(r)}</td>
                      <td className="px-4 py-3 text-sm text-text text-right font-mono">{formatRateDecimals(getPair(r), r.rate)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                  {historicalRates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-tertiary">過去のレートデータがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
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
