"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Download, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
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
  customerId?: string;
};

type Partner = {
  id: string;
  code: string;
  name: string;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Quotation | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data: quotations, isLoading, mutate } = useSWR<Quotation[]>(
    `/api/sales/quotations?${params.toString()}`,
    fetcher
  );

  // Fetch all for summary counts
  const { data: allQuotations } = useSWR<Quotation[]>("/api/sales/quotations", fetcher);

  const { data: partners } = useSWR<Partner[]>(
    showNewModal || showEditModal ? "/api/masters/partners?type=customer" : null,
    fetcher
  );

  const selected = quotations?.find((q) => q.id === showDetail);

  const [newForm, setNewForm] = useState({
    customerId: "",
    quotationDate: "",
    validUntil: "",
    currency: "JPY",
    subject: "",
    itemProduct: "",
    itemName: "",
    itemQty: "",
    itemPrice: "",
    note: "",
  });

  const [editForm, setEditForm] = useState({
    customerId: "",
    quotationDate: "",
    validUntil: "",
    currency: "JPY",
    status: "",
    subject: "",
    note: "",
  });

  const handleCreate = async () => {
    try {
      const qty = parseFloat(newForm.itemQty) || 0;
      const price = parseFloat(newForm.itemPrice) || 0;
      const subtotal = qty * price;
      const taxAmount = Math.floor(subtotal * 0.1);
      const items = newForm.itemProduct ? [{ product: newForm.itemProduct, name: newForm.itemName, qty, price }] : [];

      const res = await fetch("/api/sales/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newForm.customerId,
          quotationDate: newForm.quotationDate,
          validUntil: newForm.validUntil || null,
          currency: newForm.currency,
          subject: newForm.subject || null,
          items,
          subtotal,
          taxAmount,
          total: subtotal + taxAmount,
          note: newForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      setNewForm({ customerId: "", quotationDate: "", validUntil: "", currency: "JPY", subject: "", itemProduct: "", itemName: "", itemQty: "", itemPrice: "", note: "" });
      mutate();
      showToast("見積を作成しました", "success");
    } catch {
      showToast("作成に失敗しました", "error");
    }
  };

  const handleEdit = (q: Quotation) => {
    setEditTarget(q);
    setEditForm({
      customerId: q.customerId ?? "",
      quotationDate: q.quotationDate.slice(0, 10),
      validUntil: q.validUntil?.slice(0, 10) ?? "",
      currency: q.currency,
      status: q.status,
      subject: q.subject ?? "",
      note: q.note ?? "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/sales/quotations/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: editForm.customerId || undefined,
          quotationDate: editForm.quotationDate,
          validUntil: editForm.validUntil || null,
          currency: editForm.currency,
          status: editForm.status,
          subject: editForm.subject || null,
          note: editForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      setEditTarget(null);
      mutate();
      showToast("見積を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (q: Quotation) => {
    if (!confirm(`見積 ${q.quotationNumber} を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/sales/quotations/${q.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      mutate();
      showToast("見積を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

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
                    <th className="w-24"></th>
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
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowDetail(q.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Eye className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleEdit(q)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Pencil className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleDelete(q)} className="p-1 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
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

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="新規見積作成"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">作成する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required>
            <FormSelect placeholder="選択してください" value={newForm.customerId} onChange={(e) => setNewForm({ ...newForm, customerId: e.target.value })}
              options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="見積日" required>
            <FormInput type="date" value={newForm.quotationDate} onChange={(e) => setNewForm({ ...newForm, quotationDate: e.target.value })} />
          </FormField>
          <FormField label="通貨" required>
            <FormSelect value={newForm.currency} onChange={(e) => setNewForm({ ...newForm, currency: e.target.value })}
              options={[{ value: "JPY", label: "JPY（日本円）" }, { value: "USD", label: "USD（米ドル）" }, { value: "SGD", label: "SGD（シンガポールドル）" }]} />
          </FormField>
          <FormField label="件名">
            <FormInput value={newForm.subject} onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })} placeholder="件名を入力..." />
          </FormField>
          <FormField label="品目コード">
            <FormInput value={newForm.itemProduct} onChange={(e) => setNewForm({ ...newForm, itemProduct: e.target.value })} placeholder="例: PP-PEL-N-A1" />
          </FormField>
          <FormField label="品名">
            <FormInput value={newForm.itemName} onChange={(e) => setNewForm({ ...newForm, itemName: e.target.value })} placeholder="例: PP ペレット ナチュラル A級" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required>
              <FormInput type="number" placeholder="例: 10000" value={newForm.itemQty} onChange={(e) => setNewForm({ ...newForm, itemQty: e.target.value })} />
            </FormField>
            <FormField label="単価" required>
              <FormInput type="number" placeholder="例: 185" value={newForm.itemPrice} onChange={(e) => setNewForm({ ...newForm, itemPrice: e.target.value })} />
            </FormField>
          </div>
          <FormField label="有効期限">
            <FormInput type="date" value={newForm.validUntil} onChange={(e) => setNewForm({ ...newForm, validUntil: e.target.value })} />
          </FormField>
          <FormField label="備考">
            <FormInput value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} placeholder="備考を入力..." />
          </FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`見積編集: ${editTarget?.quotationNumber ?? ""}`}
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required>
            <FormSelect placeholder="選択してください" value={editForm.customerId} onChange={(e) => setEditForm({ ...editForm, customerId: e.target.value })}
              options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="見積日" required>
            <FormInput type="date" value={editForm.quotationDate} onChange={(e) => setEditForm({ ...editForm, quotationDate: e.target.value })} />
          </FormField>
          <FormField label="通貨">
            <FormSelect value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
              options={[{ value: "JPY", label: "JPY（日本円）" }, { value: "USD", label: "USD（米ドル）" }, { value: "SGD", label: "SGD（シンガポールドル）" }]} />
          </FormField>
          <FormField label="ステータス" required>
            <FormSelect value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={Object.entries(statusMap).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="件名">
            <FormInput value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} placeholder="件名を入力..." />
          </FormField>
          <FormField label="有効期限">
            <FormInput type="date" value={editForm.validUntil} onChange={(e) => setEditForm({ ...editForm, validUntil: e.target.value })} />
          </FormField>
          <FormField label="備考">
            <FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="備考を入力..." />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
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
                    <p className="text-sm text-text">{item.qty.toLocaleString()} kg x {selected.currency === "JPY" ? "\u00a5" : "$"}{item.price}</p>
                    <p className="text-xs font-medium text-text">{selected.currency === "JPY" ? "\u00a5" : "$"}{(item.qty * item.price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">合計金額</p><p className="text-sm font-bold text-primary-700">{formatCurrency(selected.total, selected.currency)}</p></div>
              <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note || "\u2014"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
