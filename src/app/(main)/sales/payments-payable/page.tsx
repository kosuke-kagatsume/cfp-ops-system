"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Download, Eye, Pencil, Trash2, ArrowRight, CheckCircle, Search, Loader2 } from "lucide-react";
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

export default function PaymentsPayablePage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentPayable | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { data: payments, isLoading, mutate } = useSWR<PaymentPayable[]>(
    `/api/sales/payments-payable?${params.toString()}`,
    fetcher
  );

  const { data: partners } = useSWR<Partner[]>(
    showNewModal || showEditModal ? "/api/masters/partners?type=supplier" : null,
    fetcher
  );

  const selected = payments?.find((p) => p.id === showDetail);

  const [newForm, setNewForm] = useState({
    supplierId: "",
    paymentDate: "",
    amount: "",
    paymentMethod: "TRANSFER",
    note: "",
  });

  const [editForm, setEditForm] = useState({
    supplierId: "",
    paymentDate: "",
    amount: "",
    paymentMethod: "",
    note: "",
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/sales/payments-payable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: newForm.supplierId,
          paymentDate: newForm.paymentDate,
          amount: parseFloat(newForm.amount) || 0,
          paymentMethod: newForm.paymentMethod,
          note: newForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      setNewForm({ supplierId: "", paymentDate: "", amount: "", paymentMethod: "TRANSFER", note: "" });
      mutate();
      showToast("支払を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const handleEdit = (p: PaymentPayable) => {
    setEditTarget(p);
    setEditForm({
      supplierId: p.supplier.id,
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
      const res = await fetch(`/api/sales/payments-payable/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: editForm.supplierId,
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
      showToast("支払を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (p: PaymentPayable) => {
    if (!confirm(`支払 ${p.paymentNumber} を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/sales/payments-payable/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      mutate();
      showToast("支払を削除しました", "success");
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
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("全銀データ（FBデータ）を出力しました（モック）", "success")} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4" />全銀データ出力
            </button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" />支払登録
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入先</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払日</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">支払方法</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">消込</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{p.paymentNumber}</td>
                      <td className="px-4 py-3 text-sm text-text">{p.supplier.name}</td>
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
                <p className="text-xs text-text-secondary">合計: {"\u00a5"}{(payments?.reduce((s, p) => s + p.amount, 0) ?? 0).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="支払登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required>
            <FormSelect placeholder="選択してください" value={newForm.supplierId} onChange={(e) => setNewForm({ ...newForm, supplierId: e.target.value })}
              options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="支払日" required>
            <FormInput type="date" value={newForm.paymentDate} onChange={(e) => setNewForm({ ...newForm, paymentDate: e.target.value })} />
          </FormField>
          <FormField label="金額" required>
            <FormInput type="number" placeholder="例: 300000" value={newForm.amount} onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })} />
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
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`支払編集: ${editTarget?.paymentNumber ?? ""}`}
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required>
            <FormSelect placeholder="選択してください" value={editForm.supplierId} onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}
              options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </FormField>
          <FormField label="支払日" required>
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
