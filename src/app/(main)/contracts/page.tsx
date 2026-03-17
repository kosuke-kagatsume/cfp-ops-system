"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, AlertTriangle, FileText, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type ContractStatusEnum = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "DRAFT";

const statusLabel: Record<ContractStatusEnum, string> = {
  ACTIVE: "有効",
  EXPIRING_SOON: "期限間近",
  EXPIRED: "期限切れ",
  DRAFT: "下書き",
};

const statusColors: Record<ContractStatusEnum, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  EXPIRING_SOON: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-700",
  DRAFT: "bg-gray-50 text-gray-700",
};

type ContractData = {
  id: string;
  contractNumber: string;
  title: string;
  contractType: string | null;
  startDate: string;
  endDate: string | null;
  autoRenewal: boolean;
  status: ContractStatusEnum;
  filePath: string | null;
  note: string | null;
  createdBy: string | null;
  partner: { id: string; code: string; name: string };
};

type PartnerOption = { id: string; code: string; name: string };

const contractTypeOptions = [
  { value: "販売契約", label: "販売契約" }, { value: "仕入契約", label: "仕入契約" }, { value: "運送契約", label: "運送契約" },
  { value: "加工委託", label: "加工委託" }, { value: "処理委託", label: "処理委託" }, { value: "販売契約（海外）", label: "販売契約（海外）" },
];

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { items: contracts, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<ContractData>(
    `/api/contracts?${params.toString(
  )}`
  );

  const needMasters = showNewModal || showEditModal;
  const { data: partners } = useSWR<PartnerOption[]>(needMasters ? "/api/masters/partners" : null);

  const allContracts = contracts ?? [];
  const selected = allContracts.find((c) => c.id === showDetail);

  // For summary counts, we need all contracts (not filtered)
  const { data: allContractsData } = useSWR<ContractData[]>("/api/contracts");
  const all = allContractsData ?? [];
  const expiringSoon = all.filter((c) => c.status === "EXPIRING_SOON").length;
  const expired = all.filter((c) => c.status === "EXPIRED").length;

  const [newForm, setNewForm] = useState({ partnerId: "", title: "", contractType: "", startDate: "", endDate: "", autoRenewal: false, note: "" });
  const [editForm, setEditForm] = useState({ partnerId: "", title: "", contractType: "", startDate: "", endDate: "", autoRenewal: false, status: "" as string, note: "" });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/contracts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: newForm.partnerId, title: newForm.title, contractType: newForm.contractType || undefined, startDate: newForm.startDate, endDate: newForm.endDate || undefined, autoRenewal: newForm.autoRenewal, note: newForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ partnerId: "", title: "", contractType: "", startDate: "", endDate: "", autoRenewal: false, note: "" });
      mutate();
      showToast("契約を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const openEdit = (c: ContractData) => {
    setEditingId(c.id);
    setEditForm({ partnerId: c.partner.id, title: c.title, contractType: c.contractType ?? "", startDate: c.startDate.split("T")[0], endDate: c.endDate?.split("T")[0] ?? "", autoRenewal: c.autoRenewal, status: c.status, note: c.note ?? "" });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      const res = await fetch(`/api/contracts/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: editForm.partnerId, title: editForm.title, contractType: editForm.contractType || null, startDate: editForm.startDate, endDate: editForm.endDate || null, autoRenewal: editForm.autoRenewal, status: editForm.status, note: editForm.note || null }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("契約を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この契約を削除しますか？")) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("契約を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  if (isLoading) {
    return (
      <>
        <Header title="契約書管理" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </>
    );
  }

  const statusKeys: ContractStatusEnum[] = ["ACTIVE", "EXPIRING_SOON", "EXPIRED", "DRAFT"];

  return (
    <>
      <Header title="契約書管理" />
      <div className="p-4 md:p-6 space-y-4">
        {/* アラート */}
        {(expiringSoon > 0 || expired > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">契約期限に注意が必要です</p>
              <p className="text-xs text-amber-600">期限間近: {expiringSoon}件、期限切れ: {expired}件</p>
            </div>
          </div>
        )}

        {/* サマリ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusKeys.map((status) => {
            const count = all.filter((c) => c.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button key={status} onClick={() => setStatusFilter(isActive ? "all" : status)}
                className={`p-3 rounded-xl border text-center transition-colors ${isActive ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{statusLabel[status]}</p>
              </button>
            );
          })}
        </div>

        {/* ツールバー */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="契約番号、件名、取引先で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />契約登録
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">契約番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">件名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">取引先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">有効期間</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">自動更新</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {allContracts.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{c.contractNumber}</td>
                  <td className="px-4 py-3 text-sm text-text">{c.title}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{c.partner.name}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">{c.contractType ?? "-"}</span></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{new Date(c.startDate).toLocaleDateString("ja-JP")} 〜 {c.endDate ? new Date(c.endDate).toLocaleDateString("ja-JP") : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {c.autoRenewal ? <RefreshCw className="w-4 h-4 text-emerald-500 inline" /> : <span className="text-xs text-text-tertiary">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[c.status]}`}>{statusLabel[c.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowDetail(c.id)} className="p-2 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                      <button onClick={() => openEdit(c)} className="p-2 hover:bg-surface-tertiary rounded"><Pencil className="w-4 h-4 text-text-tertiary" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        
              <div className="px-4 py-3 border-t border-border">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
</div>
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="契約登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="件名" required><FormInput placeholder="例: PP再生ペレット販売基本契約" value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} /></FormField>
          <FormField label="取引先" required><FormSelect placeholder="選択" value={newForm.partnerId} onChange={(e) => setNewForm({ ...newForm, partnerId: e.target.value })} options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} /></FormField>
          <FormField label="種別"><FormSelect placeholder="選択" value={newForm.contractType} onChange={(e) => setNewForm({ ...newForm, contractType: e.target.value })} options={contractTypeOptions} /></FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="開始日" required><FormInput type="date" value={newForm.startDate} onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })} /></FormField>
            <FormField label="終了日"><FormInput type="date" value={newForm.endDate} onChange={(e) => setNewForm({ ...newForm, endDate: e.target.value })} /></FormField>
          </div>
          <FormField label="備考"><FormInput placeholder="例: 自動更新条項あり" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="契約 編集"
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="件名" required><FormInput value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></FormField>
          <FormField label="取引先" required><FormSelect value={editForm.partnerId} onChange={(e) => setEditForm({ ...editForm, partnerId: e.target.value })} options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} /></FormField>
          <FormField label="種別"><FormSelect value={editForm.contractType} onChange={(e) => setEditForm({ ...editForm, contractType: e.target.value })} options={contractTypeOptions} /></FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="開始日" required><FormInput type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} /></FormField>
            <FormField label="終了日"><FormInput type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} /></FormField>
          </div>
          <FormField label="ステータス"><FormSelect value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={[
            { value: "ACTIVE", label: "有効" }, { value: "EXPIRING_SOON", label: "期限間近" }, { value: "EXPIRED", label: "期限切れ" }, { value: "DRAFT", label: "下書き" },
          ]} /></FormField>
          <FormField label="備考"><FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `契約: ${selected.contractNumber}` : ""}
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span className="text-sm font-mono font-medium">{selected.contractNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{statusLabel[selected.status]}</span>
            </div>
            <div><p className="text-base font-medium text-text">{selected.title}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">取引先</p><p className="text-sm text-text">{selected.partner.name}</p></div>
              <div><p className="text-xs text-text-tertiary">種別</p><p className="text-sm text-text">{selected.contractType ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">有効期間</p><p className="text-sm text-text">{new Date(selected.startDate).toLocaleDateString("ja-JP")} 〜 {selected.endDate ? new Date(selected.endDate).toLocaleDateString("ja-JP") : "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">自動更新</p><p className="text-sm text-text">{selected.autoRenewal ? "あり" : "なし"}</p></div>
            </div>
            {selected.note && (
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">備考</p>
                <p className="text-sm text-text">{selected.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
