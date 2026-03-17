"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import { Lock, Unlock, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MonthlyClosing = {
  id: string;
  companyId: string;
  year: number;
  month: number;
  isClosed: boolean;
  closedAt: string | null;
  closedBy: string | null;
  closedByUser: { name: string | null } | null;
  note: string | null;
};

export default function MonthlyClosingPage() {
  const { showToast } = useToast();

  const { data: closings, isLoading } = useSWR<MonthlyClosing[]>(
    "/api/sales/monthly-closing"
  );

  const formatYearMonth = (year: number, month: number) =>
    `${year}-${String(month).padStart(2, "0")}`;

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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          /* 月次カード */
          <div className="space-y-4">
            {closings?.map((mc) => {
              const isOpen = !mc.isClosed;
              return (
                <div key={mc.id} className={`p-5 rounded-xl border ${isOpen ? "border-primary-300 bg-primary-50/30" : "border-border bg-surface"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isOpen ? <Unlock className="w-5 h-5 text-primary-600" /> : <Lock className="w-5 h-5 text-text-tertiary" />}
                      <h3 className="text-lg font-bold text-text">{formatYearMonth(mc.year, mc.month)}</h3>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${isOpen ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {isOpen ? "オープン" : "クローズ"}
                      </span>
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
                      <p className="text-xs text-text-tertiary mb-1">会社</p>
                      <p className="text-lg font-bold text-text">{mc.companyId}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-border">
                      <p className="text-xs text-text-tertiary mb-1">締め実行者</p>
                      <p className="text-sm text-text">{mc.closedByUser?.name ?? mc.closedBy ?? "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-border">
                      <p className="text-xs text-text-tertiary mb-1">締め実行日</p>
                      <p className="text-sm text-text">{mc.closedAt ? new Date(mc.closedAt).toLocaleDateString("ja-JP") : "-"}</p>
                    </div>
                  </div>
                  {mc.note && (
                    <div className="mt-3 text-xs text-text-secondary">備考: {mc.note}</div>
                  )}
                </div>
              );
            })}
            {(!closings || closings.length === 0) && (
              <div className="text-center py-12 text-sm text-text-tertiary">月次締めデータがありません</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
