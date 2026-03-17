"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, Pencil, Trash2, Loader2, AlertTriangle, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SubsidyDocument = {
  id: string;
  subsidyName: string;
  documentType: string;
  title: string;
  dueDate: string | null;
  status: string;
  filePath: string | null;
  relatedInvoiceId: string | null;
  relatedQuotationId: string | null;
  note: string | null;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  DRAFT: "下書き",
  SUBMITTED: "提出済",
  APPROVED: "承認済",
  RETURNED: "差戻し",
  COMPLETED: "完了",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  RETURNED: "bg-red-50 text-red-700",
  COMPLETED: "bg-purple-50 text-purple-700",
};

const docTypes = [
  "申請書",
  "実績報告書",
  "見積書",
  "請求書",
  "領収書",
  "事業計画書",
  "収支決算書",
  "その他",
];

const emptyForm = {
  subsidyName: "",
  documentType: "申請書",
  title: "",
  dueDate: "",
  status: "DRAFT",
  note: "",
};

export default function SubsidiesPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SubsidyDocument | null>(null);
  const [form, setForm] = useState(emptyForm);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter) params.set("status", statusFilter);

  const { data: documents, isLoading, mutate } = useSWR<SubsidyDocument[]>(
    `/api/subsidies?${params.toString()}`,
    fetcher
  );

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/subsidies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setShowNewModal(false);
      setForm(emptyForm);
      mutate();
      showToast("補助金書類を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const handleEdit = (doc: SubsidyDocument) => {
    setEditTarget(doc);
    setForm({
      subsidyName: doc.subsidyName,
      documentType: doc.documentType,
      title: doc.title,
      dueDate: doc.dueDate?.slice(0, 10) ?? "",
      status: doc.status,
      note: doc.note ?? "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      const res = await fetch("/api/subsidies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTarget.id, ...form }),
      });
      if (!res.ok) throw new Error();
      setShowEditModal(false);
      setEditTarget(null);
      mutate();
      showToast("更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (doc: SubsidyDocument) => {
    if (!confirm(`「${doc.title}」を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/subsidies?id=${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      mutate();
      showToast("削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ja-JP");
  };

  // 期限アラート（7日以内）
  const isNearDue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).getTime() < Date.now();
  };

  const formFields = (
    <div className="space-y-4">
      <FormField label="補助金名" required>
        <FormInput value={form.subsidyName} onChange={(e) => setForm({ ...form, subsidyName: e.target.value })} placeholder="例: ものづくり補助金" />
      </FormField>
      <FormField label="書類種別" required>
        <FormSelect value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}
          options={docTypes.map((t) => ({ value: t, label: t }))} />
      </FormField>
      <FormField label="タイトル" required>
        <FormInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例: 第1次公募 申請書類一式" />
      </FormField>
      <FormField label="提出期限">
        <FormInput type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </FormField>
      <FormField label="ステータス">
        <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
          options={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))} />
      </FormField>
      <FormField label="備考">
        <FormInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="備考を入力..." />
      </FormField>
    </div>
  );

  return (
    <>
      <Header title="補助金書類管理" />
      <div className="p-6 space-y-4">
        {/* 期限アラート */}
        {documents && documents.filter((d) => d.status !== "COMPLETED" && (isNearDue(d.dueDate) || isOverdue(d.dueDate))).length > 0 && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">提出期限が近い書類があります</p>
              {documents.filter((d) => d.status !== "COMPLETED" && isOverdue(d.dueDate)).map((d) => (
                <p key={d.id} className="text-xs text-red-600 mt-1">期限超過: {d.title}（{formatDate(d.dueDate)}）</p>
              ))}
              {documents.filter((d) => d.status !== "COMPLETED" && isNearDue(d.dueDate) && !isOverdue(d.dueDate)).map((d) => (
                <p key={d.id} className="text-xs text-amber-700 mt-1">期限間近: {d.title}（{formatDate(d.dueDate)}）</p>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="補助金名、タイトルで検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setStatusFilter("")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${!statusFilter ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
                すべて
              </button>
              {Object.entries(statusLabels).map(([val, label]) => (
                <button key={val} onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === val ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { setForm(emptyForm); setShowNewModal(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />書類登録
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">補助金名</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">書類種別</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">タイトル</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">提出期限</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {documents?.map((doc) => (
                  <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-text">{doc.subsidyName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">
                        <FileText className="w-3 h-3" />{doc.documentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{doc.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`flex items-center gap-1 ${isOverdue(doc.dueDate) && doc.status !== "COMPLETED" ? "text-red-600 font-medium" : isNearDue(doc.dueDate) && doc.status !== "COMPLETED" ? "text-amber-600" : "text-text-secondary"}`}>
                        {(isOverdue(doc.dueDate) || isNearDue(doc.dueDate)) && doc.status !== "COMPLETED" && (
                          <Calendar className="w-3 h-3" />
                        )}
                        {formatDate(doc.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[doc.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {statusLabels[doc.status] ?? doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(doc)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                          <Pencil className="w-4 h-4 text-text-tertiary" />
                        </button>
                        <button onClick={() => handleDelete(doc)} className="p-1 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!documents || documents.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-tertiary">
                      補助金書類がありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="補助金書類登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        {formFields}
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`書類編集: ${editTarget?.title ?? ""}`}
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        {formFields}
      </Modal>
    </>
  );
}
