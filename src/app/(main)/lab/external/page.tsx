"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Eye, Pencil, Trash2, FileText, Receipt, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type ExternalAnalysisItem = {
  id: string;
  sampleId: string;
  laboratoryName: string;
  requestDate: string;
  resultDate: string | null;
  reportPath: string | null;
  cost: number | null;
  note: string | null;
  sample: {
    id: string;
    sampleNumber: string;
    sampleName: string;
    status: string;
  };
};

type SampleOption = {
  id: string;
  sampleNumber: string;
  sampleName: string;
};

// Derive display status from the ExternalAnalysis data
type DisplayStatus = "依頼受付" | "分析中" | "報告済";

function deriveStatus(item: ExternalAnalysisItem): DisplayStatus {
  if (item.resultDate) return "報告済";
  if (item.reportPath) return "報告済";
  return item.requestDate ? "分析中" : "依頼受付";
}

const displayStatusColors: Record<DisplayStatus, string> = {
  "依頼受付": "bg-gray-50 text-gray-700",
  "分析中": "bg-amber-50 text-amber-700",
  "報告済": "bg-emerald-50 text-emerald-700",
};

const statusList: DisplayStatus[] = ["依頼受付", "分析中", "報告済"];

export default function ExternalAnalysisPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const { items: externals, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<ExternalAnalysisItem>(
    "/api/lab/external"
  );
  const needMasters = showNewModal || showEditModal;
  const { data: samples } = useSWR<SampleOption[]>(needMasters ? "/api/lab/samples" : null);

  if (isLoading) {
    return (
      <>
        <Header title="外部受託分析" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  const allExternals = externals ?? [];

  const withStatus = allExternals.map((e) => ({
    ...e,
    displayStatus: deriveStatus(e),
  }));

  const filtered = withStatus.filter((a) => {
    if (statusFilter !== "all" && a.displayStatus !== statusFilter) return false;
    return true;
  });

  const selected = withStatus.find((a) => a.id === showDetail);
  const totalCost = allExternals.reduce((sum, a) => sum + (a.cost ?? 0), 0);

  const [newForm, setNewForm] = useState({ sampleId: "", laboratoryName: "", requestDate: new Date().toISOString().split("T")[0], cost: "", note: "" });
  const [editForm, setEditForm] = useState({ sampleId: "", laboratoryName: "", requestDate: "", resultDate: "", cost: "", note: "" });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/lab/external", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId: newForm.sampleId, laboratoryName: newForm.laboratoryName, requestDate: newForm.requestDate, cost: newForm.cost ? parseFloat(newForm.cost) : undefined, note: newForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ sampleId: "", laboratoryName: "", requestDate: new Date().toISOString().split("T")[0], cost: "", note: "" });
      mutate();
      showToast("外部分析依頼を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const openEdit = (a: ExternalAnalysisItem) => {
    setEditingId(a.id);
    setEditForm({ sampleId: a.sampleId, laboratoryName: a.laboratoryName, requestDate: a.requestDate.split("T")[0], resultDate: a.resultDate?.split("T")[0] ?? "", cost: a.cost != null ? String(a.cost) : "", note: a.note ?? "" });
    setShowDetail(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      const res = await fetch(`/api/lab/external/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId: editForm.sampleId, laboratoryName: editForm.laboratoryName, requestDate: editForm.requestDate, resultDate: editForm.resultDate || null, cost: editForm.cost ? parseFloat(editForm.cost) : null, note: editForm.note || null }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("外部分析依頼を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この外部分析依頼を削除しますか？")) return;
    try {
      const res = await fetch(`/api/lab/external/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("外部分析依頼を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  const handleResultRegister = async (a: ExternalAnalysisItem) => {
    try {
      const res = await fetch(`/api/lab/external/${a.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("結果日を登録しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="外部受託分析" />
      <div className="p-4 md:p-6 space-y-4">
        {/* サマリ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">依頼件数</p>
            <p className="text-2xl font-bold text-text">{allExternals.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">費用合計</p>
            <p className="text-2xl font-bold text-text">¥{totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">未完了</p>
            <p className="text-2xl font-bold text-amber-600">{withStatus.filter((a) => a.displayStatus !== "報告済").length}件</p>
          </div>
        </div>

        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusList.map((step, i) => {
              const count = withStatus.filter((a) => a.displayStatus === step).length;
              const isActive = statusFilter === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step)}
                    className={`flex-1 p-2 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{step}</p>
                  </button>
                  {i < statusList.length - 1 && <ChevronRight className="w-4 h-4 text-text-tertiary mx-0.5 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-text-secondary">{filtered.length}件</p>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />依頼登録
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプルID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">外部機関名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプル名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">依頼日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">結果日</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">費用</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{a.sample.sampleNumber}</td>
                  <td className="px-4 py-3 text-sm text-text">{a.laboratoryName}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.sample.sampleName}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{new Date(a.requestDate).toLocaleDateString("ja-JP")}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.resultDate ? new Date(a.resultDate).toLocaleDateString("ja-JP") : "-"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">{a.cost != null ? `¥${a.cost.toLocaleString()}` : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${displayStatusColors[a.displayStatus]}`}>{a.displayStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowDetail(a.id)} className="p-2 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                      <button onClick={() => openEdit(a)} className="p-2 hover:bg-surface-tertiary rounded"><Pencil className="w-4 h-4 text-text-tertiary" /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
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

      {/* 依頼登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="外部分析依頼 登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="外部分析機関名" required><FormInput placeholder="例: SGS Japan" value={newForm.laboratoryName} onChange={(e) => setNewForm({ ...newForm, laboratoryName: e.target.value })} /></FormField>
          <FormField label="サンプル" required><FormSelect placeholder="サンプルを選択" value={newForm.sampleId} onChange={(e) => setNewForm({ ...newForm, sampleId: e.target.value })} options={(samples ?? []).map((s) => ({ value: s.id, label: `${s.sampleNumber} ${s.sampleName}` }))} /></FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="依頼日" required><FormInput type="date" value={newForm.requestDate} onChange={(e) => setNewForm({ ...newForm, requestDate: e.target.value })} /></FormField>
            <FormField label="費用(円)"><FormInput type="number" placeholder="例: 35000" value={newForm.cost} onChange={(e) => setNewForm({ ...newForm, cost: e.target.value })} /></FormField>
          </div>
          <FormField label="備考"><FormInput placeholder="備考" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="外部分析依頼 編集"
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="外部分析機関名" required><FormInput value={editForm.laboratoryName} onChange={(e) => setEditForm({ ...editForm, laboratoryName: e.target.value })} /></FormField>
          <FormField label="サンプル" required><FormSelect value={editForm.sampleId} onChange={(e) => setEditForm({ ...editForm, sampleId: e.target.value })} options={(samples ?? []).map((s) => ({ value: s.id, label: `${s.sampleNumber} ${s.sampleName}` }))} /></FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="依頼日" required><FormInput type="date" value={editForm.requestDate} onChange={(e) => setEditForm({ ...editForm, requestDate: e.target.value })} /></FormField>
            <FormField label="結果日"><FormInput type="date" value={editForm.resultDate} onChange={(e) => setEditForm({ ...editForm, resultDate: e.target.value })} /></FormField>
          </div>
          <FormField label="費用(円)"><FormInput type="number" value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `外部分析: ${selected.sample.sampleNumber}` : ""}
        footer={<>
          {selected?.displayStatus === "分析中" && <button onClick={() => selected && handleResultRegister(selected)} className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700"><FileText className="w-4 h-4" />結果登録</button>}
          <button onClick={() => selected && openEdit(selected)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span className="text-sm font-mono font-medium">{selected.sample.sampleNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${displayStatusColors[selected.displayStatus]}`}>{selected.displayStatus}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">外部機関名</p><p className="text-sm text-text">{selected.laboratoryName}</p></div>
              <div><p className="text-xs text-text-tertiary">依頼日</p><p className="text-sm text-text">{new Date(selected.requestDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">サンプル名</p><p className="text-sm text-text">{selected.sample.sampleName}</p></div>
              <div><p className="text-xs text-text-tertiary">結果日</p><p className="text-sm text-text">{selected.resultDate ? new Date(selected.resultDate).toLocaleDateString("ja-JP") : "未着"}</p></div>
              <div><p className="text-xs text-text-tertiary">費用</p><p className="text-sm font-bold text-text">{selected.cost != null ? `¥${selected.cost.toLocaleString()}` : "-"}</p></div>
              {selected.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
