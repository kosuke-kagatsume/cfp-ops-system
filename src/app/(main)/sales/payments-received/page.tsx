"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Upload, Search, Eye, Pencil, Trash2, Zap, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type PaymentReceived = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  isReconciled: boolean;
  note: string | null;
  customer: { id: string; code: string; name: string };
};

type Partner = {
  id: string;
  code: string;
  name: string;
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

export default function PaymentsReceivedPage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentReceived | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { items: payments, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<PaymentReceived>(
    `/api/sales/payments-received?${params.toString(
  )}`
  );

  const { data: partners } = useSWR<Partner[]>(
    showNewModal || showEditModal ? "/api/masters/partners?type=customer" : null
  );

  const selected = payments.find((p) => p.id === showDetail);

  const [newForm, setNewForm] = useState({
    customerId: "",
    paymentDate: "",
    amount: "",
    paymentMethod: "TRANSFER",
    note: "",
  });

  const [editForm, setEditForm] = useState({
    customerId: "",
    paymentDate: "",
    amount: "",
    paymentMethod: "",
    note: "",
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/sales/payments-received", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newForm.customerId,
          paymentDate: newForm.paymentDate,
          amount: parseFloat(newForm.amount) || 0,
          paymentMethod: newForm.paymentMethod,
          note: newForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      setNewForm({ customerId: "", paymentDate: "", amount: "", paymentMethod: "TRANSFER", note: "" });
      mutate();
      showToast("入金を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const handleEdit = (p: PaymentReceived) => {
    setEditTarget(p);
    setEditForm({
      customerId: p.customer.id,
      paymentDate: p.paymentDate.slice(0, 10),
      amount: String(p.amount),
      paymentMethod: p.paymentMethod,
      note: p.note ?? "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/sales/payments-received/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: editForm.customerId,
          paymentDate: editForm.paymentDate,
          amount: parseFloat(editForm.amount) || 0,
          paymentMethod: editForm.paymentMethod,
          note: editForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      setEditTarget(null);
      mutate();
      showToast("入金を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (p: PaymentReceived) => {
    if (!confirm(`入金 ${p.paymentNumber} を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/sales/payments-received/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      mutate();
      showToast("入金を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ja-JP");
  };

  return (
    <>
      <Header title="入金管理" />
      <div className="p-6 space-y-4">
        {/* CSV upload area */}
        <div className="p-6 border-2 border-dashed border-border rounded-xl bg-surface text-center">
          <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-1">銀行CSVファイルをドラッグ＆ドロップ</p>
          <p className="text-xs text-text-tertiary mb-3">または</p>
          <button onClick={() => showToast("CSVファイルを選択してください（モック）", "info")} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            ファイルを選択
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="入金番号、顧客名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("自動消込を実行しました（モック）", "success")} className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors">
              <Zap className="w-4 h-4" />自動消込
            </button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" />入金登録
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">入金番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">入金日</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払方法</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">消込</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.paymentNumber}</td>
                      <td className="px-4 py-3 text-sm text-text">{p.customer.name}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 text-sm text-text text-right font-medium">{"\u00a5"}{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{paymentMethodLabels[p.paymentMethod] ?? p.paymentMethod}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${p.isReconciled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {p.isReconciled ? "消込済" : "未消込"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowDetail(p.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Eye className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleEdit(p)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Pencil className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleDelete(p)} className="p-1 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        入金データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
                <p className="text-xs text-text-secondary">合計: {"\u00a5"}{(payments.reduce((s, p) => s + p.amount, 0) ?? 0).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="入金登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required>
            <FormSelect placeholder="選択してください" value={newForm.customerId} onChange={(e) => setNewForm({ ...newForm, customerId: e.target.value })}
              options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="入金日" required>
            <FormInput type="date" value={newForm.paymentDate} onChange={(e) => setNewForm({ ...newForm, paymentDate: e.target.value })} />
          </FormField>
          <FormField label="金額" required>
            <FormInput type="number" placeholder="例: 500000" value={newForm.amount} onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })} />
          </FormField>
          <FormField label="支払方法" required>
            <FormSelect value={newForm.paymentMethod} onChange={(e) => setNewForm({ ...newForm, paymentMethod: e.target.value })}
              options={Object.entries(paymentMethodLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="備考">
            <FormInput value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} placeholder="備考を入力..." />
          </FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`入金編集: ${editTarget?.paymentNumber ?? ""}`}
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="顧客" required>
            <FormSelect placeholder="選択してください" value={editForm.customerId} onChange={(e) => setEditForm({ ...editForm, customerId: e.target.value })}
              options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="入金日" required>
            <FormInput type="date" value={editForm.paymentDate} onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })} />
          </FormField>
          <FormField label="金額" required>
            <FormInput type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
          </FormField>
          <FormField label="支払方法" required>
            <FormSelect value={editForm.paymentMethod} onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
              options={Object.entries(paymentMethodLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="備考">
            <FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="備考を入力..." />
          </FormField>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="入金詳細"
        footer={<>
          {selected && !selected.isReconciled && <button onClick={() => { setShowDetail(null); showToast("手動消込画面へ（開発中）", "info"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">手動消込</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.paymentNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${selected.isReconciled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {selected.isReconciled ? "消込済" : "未消込"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.customer.name}</p></div>
              <div><p className="text-xs text-text-tertiary">入金日</p><p className="text-sm text-text">{formatDate(selected.paymentDate)}</p></div>
              <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-primary-700">{"\u00a5"}{selected.amount.toLocaleString()}</p></div>
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
