"use client";

import { Header } from "@/components/header";
import { DivisionBadge } from "@/components/division-badge";
import { Pagination } from "@/components/pagination";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { usePaginated } from "@/lib/use-paginated";
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Download } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

type Purchase = {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  freightCost: number | null;
  packagingType: string | null;
  status: string;
  note: string | null;
  supplier: { id: string; code: string; name: string };
  pickupPartner: { id: string; name: string } | null;
  product: { id: string; code: string; name: { name: string } | null };
  warehouse: { id: string; code: string; name: string } | null;
};

type CrMaterial = {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  quantity: number;
  unitPrice: number | null;
  amount: number | null;
  status: string;
  note: string | null;
  supplier: { id: string; code: string; name: string };
  product: { id: string; code: string; name: { name: string } | null } | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const mrStatusLabels: Record<string, string> = {
  PLANNED: "予定", RECEIVED: "入荷済", INSPECTED: "検査済", CONFIRMED: "確定", RETURNED: "返品",
};
const mrStatusColors: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-700", RECEIVED: "bg-blue-50 text-blue-700",
  INSPECTED: "bg-amber-50 text-amber-700", CONFIRMED: "bg-emerald-50 text-emerald-700",
  RETURNED: "bg-red-50 text-red-700",
};

const crStatusLabels: Record<string, string> = {
  RECEIVED: "受入済", INSPECTED: "検査済", ACCEPTED: "合格", REJECTED: "不合格",
};
const crStatusColors: Record<string, string> = {
  RECEIVED: "bg-blue-50 text-blue-700", INSPECTED: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700",
};

export default function ProcurementPage() {
  const [tab, setTab] = useState<"MR" | "CR">("MR");
  const [mrSearch, setMrSearch] = useState("");
  const [crSearch, setCrSearch] = useState("");

  const mrParams = new URLSearchParams();
  if (mrSearch) mrParams.set("search", mrSearch);

  const crParams = new URLSearchParams();
  if (crSearch) crParams.set("search", crSearch);

  const { items: mrItems, total: mrTotal, page: mrPage, limit: mrLimit, isLoading: mrLoading, onPageChange: mrPageChange } = usePaginated<Purchase>(
    tab === "MR" ? `/api/mr/purchases?${mrParams.toString()}` : null
  );
  const { items: crItems, total: crTotal, page: crPage, limit: crLimit, isLoading: crLoading, onPageChange: crPageChange } = usePaginated<CrMaterial>(
    tab === "CR" ? `/api/cr/materials?${crParams.toString()}` : null
  );

  return (
    <>
      <Header title="仕入・受入管理" />
      <div className="p-4 md:p-6 space-y-4">
        {/* タブ */}
        <div className="flex items-center border-b border-border">
          <button
            onClick={() => setTab("MR")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "MR" ? "border-blue-500 text-blue-700" : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            <DivisionBadge division="MR" /> MR仕入・受入
          </button>
          <button
            onClick={() => setTab("CR")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "CR" ? "border-purple-500 text-purple-700" : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            <DivisionBadge division="CR" /> CR原料受入
          </button>
        </div>

        {tab === "MR" ? (
          /* MR仕入テーブル */
          <>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input type="text" placeholder="仕入番号、仕入先で検索..." value={mrSearch} onChange={(e) => setMrSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="bg-surface rounded-xl border border-border overflow-x-auto">
              {mrLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : (
                <>
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-secondary">
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">区分</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">仕入番号</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">日付</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">仕入先</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">品目</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">数量(kg)</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">金額</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary">ステータス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mrItems ?? []).map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                          <td className="px-4 py-3"><DivisionBadge division="MR" /></td>
                          <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.purchaseNumber}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{new Date(p.purchaseDate).toLocaleDateString("ja-JP")}</td>
                          <td className="px-4 py-3 text-sm text-text">{p.supplier.name}</td>
                          <td className="px-4 py-3"><span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{p.product.code}</span></td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{p.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right">¥{p.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${mrStatusColors[p.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {mrStatusLabels[p.status] ?? p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(mrItems ?? []).length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">データがありません</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-border bg-surface-secondary">
                    <Pagination page={mrPage} limit={mrLimit} total={mrTotal} onPageChange={mrPageChange} />
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* CR原料受入テーブル */
          <>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input type="text" placeholder="受入番号、仕入先で検索..." value={crSearch} onChange={(e) => setCrSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="bg-surface rounded-xl border border-border overflow-x-auto">
              {crLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : (
                <>
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-secondary">
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">区分</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">受入番号</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">受入日</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">仕入先</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">数量(kg)</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary">ステータス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(crItems ?? []).map((m) => (
                        <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                          <td className="px-4 py-3"><DivisionBadge division="CR" /></td>
                          <td className="px-4 py-3 text-sm font-mono text-primary-600">{m.receiptNumber}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{new Date(m.receivedDate).toLocaleDateString("ja-JP")}</td>
                          <td className="px-4 py-3 text-sm text-text">{m.supplier.name}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{m.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${crStatusColors[m.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {crStatusLabels[m.status] ?? m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(crItems ?? []).length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-text-tertiary">データがありません</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-border bg-surface-secondary">
                    <Pagination page={crPage} limit={crLimit} total={crTotal} onPageChange={crPageChange} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
