"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Download, Search, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Revenue = {
  id: string;
  revenueNumber: string;
  division: string;
  salesCategory: string;
  revenueDate: string;
  billingDate: string | null;
  shipmentDate: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
  taxRate: number;
  taxAmount: number;
  isExportExempt: boolean;
  note: string | null;
  product: {
    id: string;
    code: string;
    name: { name: string } | null;
    shape: { name: string } | null;
    color: { name: string } | null;
    grade: { name: string } | null;
  } | null;
  shipment: {
    shipmentNumber: string;
    customer: { name: string } | null;
  } | null;
  invoice: {
    invoiceNumber: string;
  } | null;
};

const divisionLabels: Record<string, string> = {
  MR: "MR",
  CR: "CR",
};

const divisionColors: Record<string, string> = {
  MR: "bg-blue-50 text-blue-700",
  CR: "bg-purple-50 text-purple-700",
};

const salesCategoryLabels: Record<string, string> = {
  SALES: "売上",
  RETURN: "返品",
  DISCOUNT: "値引",
  OTHER: "その他",
  TAX: "税",
};

const salesCategoryColors: Record<string, string> = {
  SALES: "bg-emerald-50 text-emerald-700",
  RETURN: "bg-red-50 text-red-700",
  DISCOUNT: "bg-amber-50 text-amber-700",
  OTHER: "bg-gray-50 text-gray-700",
  TAX: "bg-blue-50 text-blue-700",
};

export default function RevenuePage() {
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (divisionFilter !== "all") params.set("division", divisionFilter);

  const { data: revenues, isLoading } = useSWR<Revenue[]>(
    `/api/sales/revenue?${params.toString()}`,
    fetcher
  );

  // Fetch all for summary
  const { data: allRevenues } = useSWR<Revenue[]>("/api/sales/revenue", fetcher);

  const selected = revenues?.find((r) => r.id === showDetail);
  const totalSales = revenues?.reduce((s, r) => s + r.amount, 0) ?? 0;
  const totalTax = revenues?.reduce((s, r) => s + r.taxAmount, 0) ?? 0;

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ja-JP");
  };

  return (
    <>
      <Header title="売上管理" />
      <div className="p-6 space-y-4">
        {/* Division tabs */}
        <div className="flex items-center gap-2">
          <button onClick={() => setDivisionFilter("all")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${divisionFilter === "all" ? "bg-primary-600 text-text-inverse" : "bg-surface border border-border text-text-secondary hover:bg-surface-tertiary"}`}>
            全区分
          </button>
          {(["MR", "CR"] as const).map((div) => (
            <button key={div} onClick={() => setDivisionFilter(divisionFilter === div ? "all" : div)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${divisionFilter === div ? "border-2 border-primary-400" : "border border-border hover:border-primary-200"} ${divisionColors[div]}`}>
              {divisionLabels[div]}
              <span className="ml-1.5 text-xs">({allRevenues?.filter((r) => r.division === div).length ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">¥{totalSales.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">売上合計（税抜）</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">¥{totalTax.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">消費税合計</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">{revenues?.length ?? 0}</p>
            <p className="text-xs text-text-secondary">売上件数</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="売上番号、品名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => showToast("CSVダウンロードしました", "success")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
            <Download className="w-4 h-4" />CSV出力
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">売上番号</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">区分</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">消費税</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">売上区分</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">売上日</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {revenues?.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{r.revenueNumber}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${divisionColors[r.division] ?? "bg-gray-50 text-gray-700"}`}>{divisionLabels[r.division] ?? r.division}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">{r.shipment?.customer?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {r.product ? (
                          <>
                            <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{r.product.code}</span>
                            <p className="text-xs text-text-tertiary mt-0.5">{r.product.name?.name ?? "-"}</p>
                          </>
                        ) : (
                          <span className="text-xs text-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text text-right">{r.quantity?.toLocaleString() ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text text-right font-medium">¥{r.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-right">¥{r.taxAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${salesCategoryColors[r.salesCategory] ?? "bg-gray-50 text-gray-700"}`}>
                          {salesCategoryLabels[r.salesCategory] ?? r.salesCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(r.revenueDate)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDetail(r.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {revenues?.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        売上データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
                <p className="text-xs text-text-tertiary">{revenues?.length ?? 0}件</p>
                <p className="text-xs text-text-secondary">合計（税込）: ¥{(totalSales + totalTax).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `売上詳細: ${selected.revenueNumber}` : ""}
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.revenueNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${salesCategoryColors[selected.salesCategory] ?? "bg-gray-50 text-gray-700"}`}>
                {salesCategoryLabels[selected.salesCategory] ?? selected.salesCategory}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">区分</p><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${divisionColors[selected.division]}`}>{divisionLabels[selected.division]}</span></div>
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.shipment?.customer?.name ?? "—"}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text-secondary mb-2">3軸日付</p>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-xs text-text-tertiary">売上日</p><p className="text-sm text-text">{formatDate(selected.revenueDate)}</p></div>
                <div><p className="text-xs text-text-tertiary">出荷日</p><p className="text-sm text-text">{formatDate(selected.shipmentDate)}</p></div>
                <div><p className="text-xs text-text-tertiary">請求日</p><p className="text-sm text-text">{formatDate(selected.billingDate)}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">品目</p><p className="text-sm font-mono text-text">{selected.product?.code ?? "-"}</p><p className="text-xs text-text-secondary">{selected.product?.name?.name ?? ""}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm text-text">{selected.quantity?.toLocaleString() ?? "-"}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">金額（税抜）</p><p className="text-sm font-medium text-text">¥{selected.amount.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">消費税</p><p className="text-sm text-text">¥{selected.taxAmount.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">合計（税込）</p><p className="text-sm font-bold text-primary-700">¥{(selected.amount + selected.taxAmount).toLocaleString()}</p></div>
            </div>
            {selected.invoice && (
              <div><p className="text-xs text-text-tertiary">請求書</p><p className="text-sm font-mono text-primary-600">{selected.invoice.invoiceNumber}</p></div>
            )}
            {selected.isExportExempt && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">輸出免税対象</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
