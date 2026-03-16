"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Eye, Globe, ArrowRightLeft, Plane, DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CtsTransaction = {
  id: string;
  companyId: string;
  transactionType: string;
  fromCountry: string | null;
  toCountry: string | null;
  currency: string;
  amount: number;
  exchangeRate: number | null;
  jpyAmount: number | null;
  transactionDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

const typeLabels: Record<string, string> = {
  PURCHASE: "仕入",
  SALE: "販売",
  TRANSFER: "移転",
};

const typeColors: Record<string, string> = {
  PURCHASE: "bg-blue-50 text-blue-700",
  SALE: "bg-emerald-50 text-emerald-700",
  TRANSFER: "bg-amber-50 text-amber-700",
};

const typeList = ["PURCHASE", "SALE", "TRANSFER"];

export default function CtsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (typeFilter !== "all") params.set("type", typeFilter);

  const { data: transactions, isLoading } = useSWR<CtsTransaction[]>(
    `/api/cts?${params.toString()}`,
    fetcher
  );

  const allTransactions = transactions ?? [];
  const selected = allTransactions.find((t) => t.id === showDetail);

  const totalAmount = allTransactions.reduce((s, t) => s + t.amount, 0);
  const totalJpy = allTransactions.reduce((s, t) => s + (t.jpyAmount ?? 0), 0);

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
            <p className="text-2xl font-bold text-text">{allTransactions.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-1 mb-1"><DollarSign className="w-3 h-3 text-text-tertiary" /><p className="text-xs text-text-tertiary">合計金額</p></div>
            <p className="text-2xl font-bold text-text">${totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">合計(JPY換算)</p>
            <p className="text-2xl font-bold text-text">{totalJpy > 0 ? `¥${totalJpy.toLocaleString()}` : "-"}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-1 mb-1"><ArrowRightLeft className="w-3 h-3 text-text-tertiary" /><p className="text-xs text-text-tertiary">通貨内訳</p></div>
            <p className="text-sm font-medium text-text">USD / SGD / JPY</p>
          </div>
        </div>

        {/* タイプフィルタ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${typeFilter === "all" ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
              すべて
            </button>
            {typeList.map((s) => (
              <button key={s} onClick={() => setTypeFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${typeFilter === s ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
                {typeLabels[s]}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />取引登録
          </button>
        </div>

        {/* 取引カード */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {allTransactions.map((t) => (
              <button key={t.id} onClick={() => setShowDetail(t.id)}
                className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[t.transactionType] ?? "bg-gray-50 text-gray-700"}`}>
                      {typeLabels[t.transactionType] ?? t.transactionType}
                    </span>
                    <span className="text-xs text-text-tertiary">{t.currency}</span>
                  </div>
                  <span className="text-sm text-text-secondary">{new Date(t.transactionDate).toLocaleDateString("ja-JP")}</span>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  {/* ルート表示 */}
                  <div className="flex items-center gap-2 flex-1">
                    {t.fromCountry && (
                      <div className="p-2 bg-blue-50 rounded-lg text-center min-w-[100px]">
                        <p className="text-xs text-blue-600">Origin</p>
                        <p className="text-sm font-medium text-blue-800">{t.fromCountry}</p>
                      </div>
                    )}
                    {t.fromCountry && t.toCountry && <Plane className="w-4 h-4 text-text-tertiary" />}
                    {t.toCountry && (
                      <div className="p-2 bg-emerald-50 rounded-lg text-center min-w-[100px]">
                        <p className="text-xs text-emerald-600">Destination</p>
                        <p className="text-sm font-medium text-emerald-800">{t.toCountry}</p>
                      </div>
                    )}
                  </div>
                  {t.note && (
                    <div className="text-right">
                      <p className="text-sm text-text">{t.note}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><span className="text-xs text-text-tertiary">金額({t.currency})</span><p className="font-bold text-text">{t.currency === "JPY" ? "¥" : t.currency === "USD" ? "$" : ""}{t.amount.toLocaleString()}</p></div>
                  <div><span className="text-xs text-text-tertiary">為替レート</span><p className="font-mono">{t.exchangeRate ?? "-"}</p></div>
                  <div><span className="text-xs text-text-tertiary">金額(JPY)</span><p className="font-medium text-text-secondary">{t.jpyAmount ? `¥${t.jpyAmount.toLocaleString()}` : "-"}</p></div>
                </div>
              </button>
            ))}
            {allTransactions.length === 0 && (
              <div className="text-center py-12 text-sm text-text-tertiary">取引データがありません</div>
            )}
          </div>
        )}
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="CTS取引登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("取引を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="取引種別" required><FormSelect placeholder="選択" options={[
            { value: "PURCHASE", label: "仕入" }, { value: "SALE", label: "販売" }, { value: "TRANSFER", label: "移転" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="出荷元国" required><FormInput placeholder="例: 日本" /></FormField>
            <FormField label="仕向地国" required><FormInput placeholder="例: インドネシア" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="通貨" required><FormSelect placeholder="選択" options={[
              { value: "USD", label: "USD" }, { value: "SGD", label: "SGD" }, { value: "JPY", label: "JPY" },
            ]} /></FormField>
            <FormField label="金額" required><FormInput type="number" placeholder="例: 34000" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="為替レート"><FormInput type="number" placeholder="例: 150.25" /></FormField>
            <FormField label="取引日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          </div>
          <FormField label="備考"><FormInput placeholder="例: PT. INDO PLASTICS PP Pellet" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `CTS取引詳細` : ""}
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[selected.transactionType] ?? "bg-gray-50 text-gray-700"}`}>
                {typeLabels[selected.transactionType] ?? selected.transactionType}
              </span>
              <span className="text-sm text-text-secondary">{new Date(selected.transactionDate).toLocaleDateString("ja-JP")}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">出荷元</p><p className="text-sm text-text">{selected.fromCountry ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">仕向地</p><p className="text-sm text-text">{selected.toCountry ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">通貨</p><p className="text-sm text-text">{selected.currency}</p></div>
              <div><p className="text-xs text-text-tertiary">会社</p><p className="text-sm text-text">{selected.companyId}</p></div>
            </div>
            {selected.note && (
              <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>
            )}
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-3">金額詳細</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">金額({selected.currency})</span><span className="font-mono font-bold">{selected.currency === "JPY" ? "¥" : selected.currency === "USD" ? "$" : ""}{selected.amount.toLocaleString()}</span></div>
                {selected.exchangeRate && (
                  <div className="border-t border-border pt-2 flex justify-between"><span className="text-text-secondary">為替レート</span><span className="font-mono">{selected.exchangeRate}</span></div>
                )}
                {selected.jpyAmount && (
                  <div className="flex justify-between"><span className="text-text-secondary">JPY換算</span><span className="font-mono">¥{selected.jpyAmount.toLocaleString()}</span></div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
