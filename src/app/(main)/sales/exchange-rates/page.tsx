"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { RefreshCw, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ExchangeRate = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  createdAt: string;
};

function getPair(r: ExchangeRate) {
  return `${r.fromCurrency}/${r.toCurrency}`;
}

function getYearMonth(d: string) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatRateDecimals(pair: string, rate: number) {
  if (pair.includes("SGD") && !pair.startsWith("SGD")) return rate.toFixed(3);
  return rate.toFixed(2);
}

export default function ExchangeRatesPage() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ExchangeRate | null>(null);
  const { showToast } = useToast();

  const { data: rates, isLoading, mutate } = useSWR<ExchangeRate[]>(
    "/api/sales/exchange-rates",
    fetcher
  );

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentRates = rates?.filter((r) => getYearMonth(r.effectiveDate) === currentMonth) ?? [];
  const historicalRates = rates?.filter((r) => getYearMonth(r.effectiveDate) !== currentMonth) ?? [];

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ja-JP");

  const [newForm, setNewForm] = useState({
    effectiveDate: "",
    usdJpy: "",
    sgdJpy: "",
    usdSgd: "",
  });

  const [editForm, setEditForm] = useState({
    fromCurrency: "",
    toCurrency: "",
    rate: "",
    effectiveDate: "",
  });

  const handleCreate = async () => {
    try {
      const pairs = [
        { fromCurrency: "USD", toCurrency: "JPY", rate: parseFloat(newForm.usdJpy) },
        { fromCurrency: "SGD", toCurrency: "JPY", rate: parseFloat(newForm.sgdJpy) },
        { fromCurrency: "USD", toCurrency: "SGD", rate: parseFloat(newForm.usdSgd) },
      ].filter((p) => !isNaN(p.rate) && p.rate > 0);

      for (const pair of pairs) {
        const res = await fetch("/api/sales/exchange-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromCurrency: pair.fromCurrency,
            toCurrency: pair.toCurrency,
            rate: pair.rate,
            effectiveDate: newForm.effectiveDate + "-01",
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
      }

      setShowUpdateModal(false);
      setNewForm({ effectiveDate: "", usdJpy: "", sgdJpy: "", usdSgd: "" });
      mutate();
      showToast("為替レートを更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleEdit = (r: ExchangeRate) => {
    setEditTarget(r);
    setEditForm({
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: String(r.rate),
      effectiveDate: r.effectiveDate.slice(0, 10),
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/sales/exchange-rates/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCurrency: editForm.fromCurrency,
          toCurrency: editForm.toCurrency,
          rate: parseFloat(editForm.rate),
          effectiveDate: editForm.effectiveDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      setEditTarget(null);
      mutate();
      showToast("為替レートを更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (r: ExchangeRate) => {
    if (!confirm(`${getPair(r)} のレートを削除しますか？`)) return;
    try {
      const res = await fetch(`/api/sales/exchange-rates/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      mutate();
      showToast("為替レートを削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="為替管理" />
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <>
            {/* 当月レート */}
            <div className="p-5 rounded-xl border border-primary-300 bg-primary-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-text">{currentMonth} 適用レート</h2>
                  <p className="text-xs text-text-tertiary">
                    {currentRates.length > 0
                      ? `最終更新: ${formatDate(currentRates[0].createdAt)}`
                      : "データなし"}
                  </p>
                </div>
                <button onClick={() => setShowUpdateModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
                  <RefreshCw className="w-4 h-4" />レート更新
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {currentRates.map((r) => (
                  <div key={r.id} className="p-4 bg-surface rounded-lg border border-border text-center relative group">
                    <p className="text-sm text-text-secondary mb-1">{getPair(r)}</p>
                    <p className="text-2xl font-bold text-text">{formatRateDecimals(getPair(r), r.rate)}</p>
                    <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                      <button onClick={() => handleEdit(r)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                        <Pencil className="w-3 h-3 text-text-tertiary" />
                      </button>
                      <button onClick={() => handleDelete(r)} className="p-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {currentRates.length === 0 && (
                  <div className="col-span-3 text-center py-4 text-sm text-text-tertiary">当月のレートデータがありません</div>
                )}
              </div>
            </div>

            {/* 過去レート */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface-secondary">
                <h3 className="text-sm font-medium text-text">過去の為替レート</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">年月</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">通貨ペア</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">レート</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">登録日</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {historicalRates.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text">{getYearMonth(r.effectiveDate)}</td>
                      <td className="px-4 py-3 text-sm text-text">{getPair(r)}</td>
                      <td className="px-4 py-3 text-sm text-text text-right font-mono">{formatRateDecimals(getPair(r), r.rate)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(r)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Pencil className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleDelete(r)} className="p-1 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historicalRates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-tertiary">過去のレートデータがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* レート新規登録モーダル */}
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="為替レート更新"
        footer={<>
          <button onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="適用年月" required>
            <FormInput type="month" value={newForm.effectiveDate} onChange={(e) => setNewForm({ ...newForm, effectiveDate: e.target.value })} />
          </FormField>
          <FormField label="USD/JPY" required>
            <FormInput type="number" placeholder="例: 150.25" value={newForm.usdJpy} onChange={(e) => setNewForm({ ...newForm, usdJpy: e.target.value })} />
          </FormField>
          <FormField label="SGD/JPY" required>
            <FormInput type="number" placeholder="例: 112.80" value={newForm.sgdJpy} onChange={(e) => setNewForm({ ...newForm, sgdJpy: e.target.value })} />
          </FormField>
          <FormField label="USD/SGD" required>
            <FormInput type="number" placeholder="例: 1.332" value={newForm.usdSgd} onChange={(e) => setNewForm({ ...newForm, usdSgd: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={editTarget ? `レート編集: ${getPair(editTarget)}` : ""}
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="通貨ペア（From）">
            <FormSelect value={editForm.fromCurrency} onChange={(e) => setEditForm({ ...editForm, fromCurrency: e.target.value })}
              options={[{ value: "USD", label: "USD" }, { value: "SGD", label: "SGD" }, { value: "JPY", label: "JPY" }]} />
          </FormField>
          <FormField label="通貨ペア（To）">
            <FormSelect value={editForm.toCurrency} onChange={(e) => setEditForm({ ...editForm, toCurrency: e.target.value })}
              options={[{ value: "JPY", label: "JPY" }, { value: "SGD", label: "SGD" }, { value: "USD", label: "USD" }]} />
          </FormField>
          <FormField label="レート" required>
            <FormInput type="number" value={editForm.rate} onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })} />
          </FormField>
          <FormField label="適用日" required>
            <FormInput type="date" value={editForm.effectiveDate} onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })} />
          </FormField>
        </div>
      </Modal>
    </>
  );
}
