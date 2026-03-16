"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Download, Search, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  product: {
    id: string;
    code: string;
    name: { name: string } | null;
    shape: { name: string } | null;
    color: { name: string } | null;
    grade: { name: string } | null;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  division: string;
  orderDate: string;
  deliveryDate: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  note: string | null;
  customer: { id: string; code: string; name: string };
  items: OrderItem[];
};

type Partner = {
  id: string;
  code: string;
  name: string;
};

const statusLabels: Record<string, string> = {
  DRAFT: "下書き",
  CONFIRMED: "確定",
  SHIPPED: "出荷中",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const summaryStatuses = ["DRAFT", "SHIPPED", "COMPLETED"] as const;

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data: orders, isLoading, mutate } = useSWR<Order[]>(
    `/api/sales/orders?${params.toString()}`,
    fetcher
  );

  // Fetch all orders (no filter) for summary counts
  const { data: allOrders } = useSWR<Order[]>("/api/sales/orders", fetcher);

  const { data: partners } = useSWR<Partner[]>(
    showNewModal ? "/api/masters/partners?type=customer" : null,
    fetcher
  );

  const selected = orders?.find((o) => o.id === showDetail);

  const [newForm, setNewForm] = useState({
    customerId: "",
    orderDate: "",
    deliveryDate: "",
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newForm.customerId,
          orderDate: newForm.orderDate,
          deliveryDate: newForm.deliveryDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      setNewForm({ customerId: "", orderDate: "", deliveryDate: "" });
      mutate();
      showToast("受注を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ja-JP");
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") return `$${amount.toLocaleString()}`;
    if (currency === "SGD") return `S$${amount.toLocaleString()}`;
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <>
      <Header title="受注管理" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {summaryStatuses.map((st) => {
            const count = allOrders?.filter((o) => o.status === st).length ?? 0;
            return (
              <button key={st} onClick={() => setStatusFilter(statusFilter === st ? "all" : st)}
                className={`p-3 rounded-xl border text-center transition-colors ${statusFilter === st ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{statusLabels[st]}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="受注番号、顧客名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
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
              <Plus className="w-4 h-4" />受注登録
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受注番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受注日</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">小計</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">合計</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((o) => {
                    const firstItem = o.items[0];
                    return (
                      <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-primary-600">{o.orderNumber}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(o.orderDate)}</td>
                        <td className="px-4 py-3 text-sm text-text">{o.customer.name}</td>
                        <td className="px-4 py-3">
                          {firstItem ? (
                            <>
                              <span className="text-xs font-mono bg-surface-tertiary px-1.5 py-0.5 rounded">{firstItem.product.code}</span>
                              <p className="text-xs text-text-tertiary mt-0.5">{firstItem.product.name?.name ?? "-"}</p>
                            </>
                          ) : (
                            <span className="text-xs text-text-tertiary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-text text-right">{formatCurrency(o.subtotal, o.currency)}</td>
                        <td className="px-4 py-3 text-sm text-text text-right font-medium">{formatCurrency(o.total, o.currency)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[o.status] ?? "bg-gray-50 text-gray-700"}`}>{statusLabels[o.status] ?? o.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setShowDetail(o.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Eye className="w-4 h-4 text-text-tertiary" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orders?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        受注データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
                <p className="text-xs text-text-tertiary">{orders?.length ?? 0}件</p>
                <p className="text-xs text-text-secondary">合計: {formatCurrency(orders?.reduce((s, o) => s + o.total, 0) ?? 0, "JPY")}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="受注登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required>
            <FormSelect
              placeholder="選択してください"
              value={newForm.customerId}
              onChange={(e) => setNewForm({ ...newForm, customerId: e.target.value })}
              options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))}
            />
          </FormField>
          <FormField label="受注日" required>
            <FormInput type="date" value={newForm.orderDate} onChange={(e) => setNewForm({ ...newForm, orderDate: e.target.value })} />
          </FormField>
          <FormField label="納品予定日">
            <FormInput type="date" value={newForm.deliveryDate} onChange={(e) => setNewForm({ ...newForm, deliveryDate: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `受注詳細: ${selected.orderNumber}` : ""}
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.orderNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status] ?? "bg-gray-50 text-gray-700"}`}>{statusLabels[selected.status] ?? selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer.name}</p></div>
              <div><p className="text-xs text-text-tertiary">通貨</p><p className="text-sm text-text">{selected.currency}</p></div>
              <div><p className="text-xs text-text-tertiary">受注日</p><p className="text-sm text-text">{formatDate(selected.orderDate)}</p></div>
              <div><p className="text-xs text-text-tertiary">納品予定日</p><p className="text-sm text-text">{formatDate(selected.deliveryDate)}</p></div>
            </div>
            {selected.items.length > 0 && (
              <div className="p-3 bg-surface-tertiary rounded-lg space-y-2">
                <p className="text-xs font-medium text-text-secondary">明細</p>
                {selected.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-text-tertiary">品目</p>
                      <p className="text-sm font-mono text-text">{item.product.code}</p>
                      <p className="text-xs text-text-secondary">{item.product.name?.name ?? "-"}</p>
                    </div>
                    <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{item.quantity.toLocaleString()}</p></div>
                    <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm text-text">{formatCurrency(item.amount, selected.currency)}</p></div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-text-tertiary">小計</p><p className="text-sm text-text">{formatCurrency(selected.subtotal, selected.currency)}</p></div>
              <div><p className="text-xs text-text-tertiary">消費税</p><p className="text-sm text-text">{formatCurrency(selected.taxAmount, selected.currency)}</p></div>
              <div><p className="text-xs text-text-tertiary">合計</p><p className="text-sm font-bold text-primary-700">{formatCurrency(selected.total, selected.currency)}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
