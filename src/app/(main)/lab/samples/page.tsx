"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, Pencil, Trash2, TestTube, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

type SampleStatus = "RECEIVED" | "ANALYZING" | "JUDGED" | "REPORTED";
const statusMap: Record<SampleStatus, string> = { RECEIVED: "受付済", ANALYZING: "分析中", JUDGED: "判定済", REPORTED: "報告済" };
const statusColors: Record<SampleStatus, string> = { RECEIVED: "bg-gray-50 text-gray-700", ANALYZING: "bg-blue-50 text-blue-700", JUDGED: "bg-amber-50 text-amber-700", REPORTED: "bg-emerald-50 text-emerald-700" };
const statusList: SampleStatus[] = ["RECEIVED", "ANALYZING", "JUDGED", "REPORTED"];
const statusOptions = statusList.map((s) => ({ value: s, label: statusMap[s] }));

type LabSampleItem = { id: string; sampleNumber: string; sampleName: string; source: string | null; receivedDate: string; status: SampleStatus; note: string | null; product: { id: string; code: string; displayName: string | null; name: { name: string } } | null; _count: { analysisResults: number } };

export default function LabSamplesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const { items: samples, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<LabSampleItem>(
    "/api/lab/samples"
  );
  const allSamples = samples ?? [];
  const filtered = allSamples.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) { const q = search.toLowerCase(); return s.sampleNumber.toLowerCase().includes(q) || s.sampleName.toLowerCase().includes(q) || (s.source ?? "").toLowerCase().includes(q); }
    return true;
  });
  const selected = allSamples.find((s) => s.id === showDetail);
  const productName = (s: LabSampleItem) => s.product?.displayName ?? s.product?.name?.name ?? "-";

  const [newForm, setNewForm] = useState({ sampleName: "", source: "", receivedDate: new Date().toISOString().split("T")[0], note: "" });
  const [editForm, setEditForm] = useState({ sampleName: "", source: "", receivedDate: "", status: "" as string, note: "" });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/lab/samples", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleName: newForm.sampleName, source: newForm.source || undefined, receivedDate: newForm.receivedDate, note: newForm.note || undefined }) });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false); setNewForm({ sampleName: "", source: "", receivedDate: new Date().toISOString().split("T")[0], note: "" }); mutate(); showToast("サンプルを受付しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const openEdit = (s: LabSampleItem) => { setEditingId(s.id); setEditForm({ sampleName: s.sampleName, source: s.source ?? "", receivedDate: s.receivedDate.split("T")[0], status: s.status, note: s.note ?? "" }); setShowDetail(null); setShowEditModal(true); };

  const handleEdit = async () => {
    try {
      const res = await fetch(`/api/lab/samples/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleName: editForm.sampleName, source: editForm.source || null, receivedDate: editForm.receivedDate, status: editForm.status, note: editForm.note || null }) });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false); mutate(); showToast("サンプル情報を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このサンプルを削除しますか？")) return;
    try { const res = await fetch(`/api/lab/samples/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); setShowDetail(null); mutate(); showToast("サンプルを削除しました", "success"); } catch { showToast("削除に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="サンプル受付" />
      <div className="p-6 space-y-4">
        <div className="bg-surface rounded-xl border border-border p-4"><div className="flex items-center gap-2">
          {statusList.map((step, i) => { const count = allSamples.filter((s) => s.status === step).length; const isActive = statusFilter === step; return (
            <div key={step} className="flex items-center flex-1"><button onClick={() => setStatusFilter(isActive ? "all" : step)} className={`flex-1 p-3 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}><p className="text-lg font-bold text-text">{count}</p><p className="text-xs text-text-secondary">{statusMap[step]}</p></button>{i < statusList.length - 1 && <div className="w-4 h-0.5 bg-border mx-1" />}</div>
          ); })}
        </div></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" /><input type="text" placeholder="サンプルID、サンプル名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            {statusFilter !== "all" && <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"><Plus className="w-4 h-4" />サンプル受付</button>
        </div>

        {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div> : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full"><thead><tr className="border-b border-border bg-surface-secondary">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプルID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプル名</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受付日</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">分析数</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
              <th className="w-24"></th>
            </tr></thead><tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><TestTube className="w-4 h-4 text-text-tertiary" /><span className="text-sm font-mono text-primary-600">{s.sampleNumber}</span></div></td>
                  <td className="px-4 py-3 text-sm text-text">{s.sampleName}</td>
                  <td className="px-4 py-3 text-sm text-text">{productName(s)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{new Date(s.receivedDate).toLocaleDateString("ja-JP")}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary text-center">{s._count.analysisResults}</td>
                  <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[s.status]}`}>{statusMap[s.status]}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <button onClick={() => setShowDetail(s.id)} className="p-1 hover:bg-surface-tertiary rounded"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                    <button onClick={() => openEdit(s)} className="p-1 hover:bg-surface-tertiary rounded"><Pencil className="w-4 h-4 text-text-tertiary" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody></table>
            <div className="px-4 py-3 border-t border-border bg-surface-secondary"><Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} /></div>
          </div>
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="サンプル受付"
        footer={<><button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">受付する</button></>}>
        <div className="space-y-4">
          <FormField label="サンプル名" required><FormInput placeholder="例: CPO軽質サンプル" value={newForm.sampleName} onChange={(e) => setNewForm({ ...newForm, sampleName: e.target.value })} /></FormField>
          <FormField label="サンプル元"><FormInput placeholder="例: 岡ケミ CR装置 ロット260312-TC" value={newForm.source} onChange={(e) => setNewForm({ ...newForm, source: e.target.value })} /></FormField>
          <FormField label="受付日" required><FormInput type="date" value={newForm.receivedDate} onChange={(e) => setNewForm({ ...newForm, receivedDate: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="サンプル 編集"
        footer={<><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button><button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button></>}>
        <div className="space-y-4">
          <FormField label="サンプル名" required><FormInput value={editForm.sampleName} onChange={(e) => setEditForm({ ...editForm, sampleName: e.target.value })} /></FormField>
          <FormField label="サンプル元"><FormInput value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} /></FormField>
          <FormField label="受付日" required><FormInput type="date" value={editForm.receivedDate} onChange={(e) => setEditForm({ ...editForm, receivedDate: e.target.value })} /></FormField>
          <FormField label="ステータス"><FormSelect value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={statusOptions} /></FormField>
          <FormField label="備考"><FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `サンプル: ${selected.sampleNumber}` : ""}
        footer={<>
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm font-mono font-medium">{selected.sampleNumber}</span><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{statusMap[selected.status]}</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">サンプル名</p><p className="text-sm text-text">{selected.sampleName}</p></div>
              <div><p className="text-xs text-text-tertiary">受付日</p><p className="text-sm text-text">{new Date(selected.receivedDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">製品</p><p className="text-sm text-text">{productName(selected)}</p></div>
              <div><p className="text-xs text-text-tertiary">サンプル元</p><p className="text-sm text-text">{selected.source ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">分析結果数</p><p className="text-sm text-text">{selected._count.analysisResults}件</p></div>
              {selected.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
