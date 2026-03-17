"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type Dispatch = {
  id: string;
  shipmentId: string;
  carrierId: string;
  vehicleNumber: string | null;
  driverName: string | null;
  freightCost: number | null;
  dispatchDate: string;
  note: string | null;
  shipment: {
    shipmentNumber: string;
    customer: { name: string } | null;
  };
  carrier: { name: string } | null;
};

export default function FreightPage() {
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Dispatch | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { items: dispatches, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<Dispatch>(
    `/api/sales/freight?${params.toString(
  )}`
  );

  const selected = dispatches.find((f) => f.id === showDetail);
  const totalFreight = dispatches.reduce((s, f) => s + (f.freightCost ?? 0), 0) ?? 0;
  const withCostCount = dispatches.filter((f) => f.freightCost && f.freightCost > 0).length ?? 0;

  const [editForm, setEditForm] = useState({
    vehicleNumber: "",
    driverName: "",
    freightCost: "",
    note: "",
  });

  const handleEdit = (d: Dispatch) => {
    setEditTarget(d);
    setEditForm({
      vehicleNumber: d.vehicleNumber ?? "",
      driverName: d.driverName ?? "",
      freightCost: d.freightCost != null ? String(d.freightCost) : "",
      note: d.note ?? "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/sales/freight/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: editForm.vehicleNumber || null,
          driverName: editForm.driverName || null,
          freightCost: editForm.freightCost ? parseFloat(editForm.freightCost) : null,
          note: editForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      setEditTarget(null);
      mutate();
      showToast("運賃情報を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (d: Dispatch) => {
    if (!confirm(`配車 ${d.shipment.shipmentNumber} を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/sales/freight/${d.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      mutate();
      showToast("配車を削除しました", "success");
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
      <Header title="運賃管理" />
      <div className="p-6 space-y-4">
        {/* 集計 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">{"\u00a5"}{totalFreight.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">運賃合計</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-text">{dispatches.length ?? 0}</p>
            <p className="text-xs text-text-secondary">運賃件数</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface text-center">
            <p className="text-lg font-bold text-emerald-600">{withCostCount} / {dispatches.length ?? 0}</p>
            <p className="text-xs text-text-secondary">運賃確定済</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="出荷番号、運送会社で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">出荷番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">運送会社</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">顧客</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {dispatches.map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{f.shipment.shipmentNumber}</td>
                      <td className="px-4 py-3 text-sm text-text">{f.carrier?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{f.shipment.customer?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text text-right font-medium">{"\u00a5"}{(f.freightCost ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(f.dispatchDate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${f.freightCost && f.freightCost > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {f.freightCost && f.freightCost > 0 ? "確定済" : "未確定"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowDetail(f.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Eye className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleEdit(f)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Pencil className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <button onClick={() => handleDelete(f)} className="p-1 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
                <p className="text-xs text-text-secondary">合計: {"\u00a5"}{totalFreight.toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`運賃編集: ${editTarget?.shipment.shipmentNumber ?? ""}`}
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="車番">
            <FormInput value={editForm.vehicleNumber} onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })} placeholder="例: 滋賀 100 あ 1234" />
          </FormField>
          <FormField label="ドライバー">
            <FormInput value={editForm.driverName} onChange={(e) => setEditForm({ ...editForm, driverName: e.target.value })} placeholder="ドライバー名を入力..." />
          </FormField>
          <FormField label="運賃">
            <FormInput type="number" value={editForm.freightCost} onChange={(e) => setEditForm({ ...editForm, freightCost: e.target.value })} placeholder="例: 50000" />
          </FormField>
          <FormField label="備考">
            <FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="備考を入力..." />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `運賃詳細: ${selected.shipment.shipmentNumber}` : ""}
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium text-text">{selected.shipment.shipmentNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${selected.freightCost && selected.freightCost > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {selected.freightCost && selected.freightCost > 0 ? "確定済" : "未確定"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">運送会社</p><p className="text-sm text-text">{selected.carrier?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">顧客</p><p className="text-sm text-text">{selected.shipment.customer?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-primary-700">{"\u00a5"}{(selected.freightCost ?? 0).toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{formatDate(selected.dispatchDate)}</p></div>
              <div><p className="text-xs text-text-tertiary">車番</p><p className="text-sm text-text">{selected.vehicleNumber ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">ドライバー</p><p className="text-sm text-text">{selected.driverName ?? "-"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
