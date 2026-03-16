"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Download, Eye, ArrowRight, CheckCircle, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PaymentPayable = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  isReconciled: boolean;
  note: string | null;
  supplier: { id: string; code: string; name: string };
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "現金",
  CHECK: "小切手",
  TRANSFER: "振込",
  BILL: "手形",
  OFFSET: "相殺",
  DISCOUNT_PM: "値引",
  ELECTRONIC: "電子",
  OTHER_PM: "その他",
};

export default function PaymentsPayablePage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { data: payments, isLoading } = useSWR<PaymentPayable[]>(
    `/api/sales/payments-payable?${params.toString()}`,
    fetcher
  );

  const selected = payments?.find((p) => p.id === showDetail);

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ja-JP");
  };

  return (
    <>
      <Header title="支払管理" />
      <div className="p-6 space-y-4">
        {/* Flow */}
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs font-medium text-text-secondary mb-2">支払フロー</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
              <CheckCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">買掛計上</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">承認</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">振込実行</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="支払番号、仕入先名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => showToast("全銀データ（FBデータ）を出力しました（モック）", "success")} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Download className="w-4 h-4" />全銀データ出力
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入先</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払日</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払方法</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">消込</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.paymentNumber}</td>
                      <td className="px-4 py-3 text-sm text-text">{p.supplier.name}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 text-sm text-text text-right font-medium">¥{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{paymentMethodLabels[p.paymentMethod] ?? p.paymentMethod}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${p.isReconciled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {p.isReconciled ? "消込済" : "未消込"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDetail(p.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        支払データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
                <p className="text-xs text-text-tertiary">{payments?.length ?? 0}件</p>
                <p className="text-xs text-text-secondary">合計: ¥{(payments?.reduce((s, p) => s + p.amount, 0) ?? 0).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `支払詳細: ${selected.paymentNumber}` : ""}
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.paymentNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${selected.isReconciled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {selected.isReconciled ? "消込済" : "未消込"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">仕入先</p><p className="text-sm text-text">{selected.supplier.name}</p></div>
              <div><p className="text-xs text-text-tertiary">支払日</p><p className="text-sm text-text">{formatDate(selected.paymentDate)}</p></div>
              <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-primary-700">¥{selected.amount.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">支払方法</p><p className="text-sm text-text">{paymentMethodLabels[selected.paymentMethod] ?? selected.paymentMethod}</p></div>
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
