"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import { monthlyClosings } from "@/lib/dummy-data-phase2";
import { Lock, Unlock, ArrowRight, CheckCircle } from "lucide-react";

export default function MonthlyClosingPage() {
  const { showToast } = useToast();

  return (
    <>
      <Header title="月次締め" />
      <div className="p-6 space-y-4">
        {/* 締めフロー */}
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs font-medium text-text-secondary mb-3">月次締めフロー</p>
          <div className="flex items-center gap-2 flex-wrap">
            {["売上確定", "請求確定", "入金消込確定", "月次更新"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="w-4 h-4 text-text-tertiary" />}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-tertiary rounded-lg border border-border">
                  <CheckCircle className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text font-medium">{step}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 月次カード */}
        <div className="space-y-4">
          {monthlyClosings.map((mc) => {
            const isOpen = mc.status === "オープン";
            return (
              <div key={mc.yearMonth} className={`p-5 rounded-xl border ${isOpen ? "border-primary-300 bg-primary-50/30" : "border-border bg-surface"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isOpen ? <Unlock className="w-5 h-5 text-primary-600" /> : <Lock className="w-5 h-5 text-text-tertiary" />}
                    <h3 className="text-lg font-bold text-text">{mc.yearMonth}</h3>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${isOpen ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{mc.status}</span>
                  </div>
                  {isOpen && (
                    <button onClick={() => showToast("月次締めを実行します（モック）：全ステップ順次実行", "info")}
                      className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
                      月次締め実行
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-surface border border-border">
                    <p className="text-xs text-text-tertiary mb-1">売上</p>
                    <p className="text-lg font-bold text-text">{mc.salesCount}件</p>
                    <p className="text-sm text-text-secondary">¥{mc.salesTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface border border-border">
                    <p className="text-xs text-text-tertiary mb-1">請求</p>
                    <p className="text-lg font-bold text-text">{mc.invoiceCount}件</p>
                    <p className="text-sm text-text-secondary">¥{mc.invoiceTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface border border-border">
                    <p className="text-xs text-text-tertiary mb-1">入金</p>
                    <p className="text-lg font-bold text-text">{mc.paymentCount}件</p>
                    <p className="text-sm text-text-secondary">¥{mc.paymentTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
