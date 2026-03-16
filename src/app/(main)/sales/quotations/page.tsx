"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Download, Search, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type QuotationItem = {
  product: string;
  name: string;
  qty: number;
  price: number;
};

type Quotation = {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string | null;
  subject: string | null;
  items: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  note: string | null;
  customer: { name: string } | null;
};

const statusMap: Record<string, string> = {
  DRAFT: "下書き",
  SENT: "申請中",
  ACCEPTED: "承認済",
  REJECTED: "却下",
  EXPIRED: "期限切れ",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-orange-50 text-orange-700",
};

const filterStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;

export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data: quotations, isLoading } = useSWR<Quotation[]>(
    `/api/sales/quotations?${params.toString()}`,
    fetcher
  );

  // Fetch all for summary counts
  const { data: allQuotations } = useSWR<Quotation[]>("/api/sales/quotations", fetcher);

  const selected = quotations?.find((q) => q.id === showDetail);

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ja-JP");
  };

  const formatCurrency = (amount: number, currency: string) => {
    return currency === "JPY" ? `\u00a5${amount.toLocaleString()}` : `$${amount.toLocaleString()}`;
  };

  return (
    <>
      <Header title="見積管理" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {filterStatuses.map((st) => {
            const count = allQuotations?.filter((q) => q.status === st).length ?? 0;
            return (
              <button key={st} onClick={() => setStatusFilter(statusFilter === st ? "all" : st)}
                className={`p-3 rounded-xl border text-center transition-colors ${statusFilter === st ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{statusMap[st]}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="見積番号、顧客名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("CSVダウンロードしました", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
              <Download className="w-4 h-4" />CSV出力
            </button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" />新規見積
            </button>
          </div>
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">見積番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">合計金額</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">通貨</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotations?.map((q) => (
                    <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{q.quotationNumber}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(q.quotationDate)}</td>
                      <td className="px-4 py-3 text-sm text-text">{q.customer?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text text-right font-medium">
                        {formatCurrency(q.total, q.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-center">{q.currency}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[q.status] ?? "bg-gray-100 text-gray-700"}`}>{statusMap[q.status] ?? q.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDetail(q.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
                <p className="text-xs text-text-tertiary">{quotations?.length ?? 0}件 / {allQuotations?.length ?? 0}件</p>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="新規見積作成"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("見積を作成しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">作成する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "東洋プラスチック株式会社" }, { value: "2", label: "関西化学工業株式会社" }, { value: "3", label: "HINDUSTAN POLYMERS PVT. LTD." },
          ]} /></FormField>
          <FormField label="通貨" required><FormSelect placeholder="選択" options={[
            { value: "JPY", label: "JPY（日本円）" }, { value: "USD", label: "USD（米ドル）" }, { value: "SGD", label: "SGD（シンガポールドル）" },
          ]} /></FormField>
          <FormField label="品目" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "PP-PEL-N-A1 PP ペレット ナチュラル A級" }, { value: "2", label: "ABS-PEL-BK-A1 ABS ペレット 黒 A級" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 10000" /></FormField>
            <FormField label="単価" required><FormInput type="number" placeholder="例: 185" /></FormField>
          </div>
          <FormField label="有効期限"><FormInput type="date" /></FormField>
        </div>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `見積詳細: ${selected.quotationNumber}` : ""}
        footer={<>
          {selected?.status === "DRAFT" && <button onClick={() => { setShowDetail(null); showToast("承認申請しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">承認申請</button>}
          {selected?.status === "SENT" && <button onClick={() => { setShowDetail(null); showToast("承認しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">承認する</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.quotationNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status] ?? "bg-gray-100 text-gray-700"}`}>{statusMap[selected.status] ?? selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{formatDate(selected.quotationDate)}</p></div>
              <div><p className="text-xs text-text-tertiary">有効期限</p><p className="text-sm text-text">{formatDate(selected.validUntil)}</p></div>
              <div><p className="text-xs text-text-tertiary">通貨</p><p className="text-sm text-text">{selected.currency}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-2">
              <p className="text-xs font-medium text-text-secondary">明細</p>
              {Array.isArray(selected.items) && selected.items.map((item: QuotationItem, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-text">{item.product}</p>
                    <p className="text-xs text-text-tertiary">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text">{item.qty.toLocaleString()} kg × {selected.currency === "JPY" ? "\u00a5" : "$"}{item.price}</p>
                    <p className="text-xs font-medium text-text">{selected.currency === "JPY" ? "\u00a5" : "$"}{(item.qty * item.price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">合計金額</p><p className="text-sm font-bold text-primary-700">{formatCurrency(selected.total, selected.currency)}</p></div>
              <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note || "—"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
