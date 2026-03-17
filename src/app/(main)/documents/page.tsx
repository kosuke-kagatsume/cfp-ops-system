"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Search, Download, Eye, Printer, Mail, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type DocumentTypeEnum =
  | "PURCHASE_RECEIPT"
  | "DELIVERY_NOTE_TEMP"
  | "DELIVERY_NOTE_FINAL"
  | "WAYBILL"
  | "PICKUP_NOTICE"
  | "TRANSPORT_ORDER"
  | "DELIVERY_NOTICE"
  | "EXPORT_INVOICE"
  | "PACKING_LIST"
  | "BILLING_INVOICE"
  | "ANALYSIS_CERTIFICATE"
  | "SUSTAINABILITY_DECL"
  | "CONTRACT_DOC";

const documentTypeLabel: Record<DocumentTypeEnum, string> = {
  PURCHASE_RECEIPT: "買受書",
  DELIVERY_NOTE_TEMP: "納品書（仮）",
  DELIVERY_NOTE_FINAL: "納品書（本）",
  WAYBILL: "送り状・受領書",
  PICKUP_NOTICE: "引取連絡",
  TRANSPORT_ORDER: "運送指示書",
  DELIVERY_NOTICE: "搬入連絡",
  EXPORT_INVOICE: "Invoice/PackingList",
  PACKING_LIST: "Packing List",
  BILLING_INVOICE: "請求書",
  ANALYSIS_CERTIFICATE: "検査成績書",
  SUSTAINABILITY_DECL: "SD",
  CONTRACT_DOC: "契約書",
};

const documentTypeColors: Record<DocumentTypeEnum, string> = {
  PURCHASE_RECEIPT: "bg-purple-50 text-purple-700",
  DELIVERY_NOTE_TEMP: "bg-blue-50 text-blue-700",
  DELIVERY_NOTE_FINAL: "bg-blue-100 text-blue-800",
  WAYBILL: "bg-amber-50 text-amber-700",
  PICKUP_NOTICE: "bg-emerald-50 text-emerald-700",
  TRANSPORT_ORDER: "bg-orange-50 text-orange-700",
  DELIVERY_NOTICE: "bg-teal-50 text-teal-700",
  EXPORT_INVOICE: "bg-indigo-50 text-indigo-700",
  PACKING_LIST: "bg-indigo-50 text-indigo-700",
  BILLING_INVOICE: "bg-red-50 text-red-700",
  ANALYSIS_CERTIFICATE: "bg-cyan-50 text-cyan-700",
  SUSTAINABILITY_DECL: "bg-lime-50 text-lime-700",
  CONTRACT_DOC: "bg-gray-50 text-gray-700",
};

const mainDocumentTypes: DocumentTypeEnum[] = [
  "BILLING_INVOICE",
  "DELIVERY_NOTE_FINAL",
  "PURCHASE_RECEIPT",
  "EXPORT_INVOICE",
  "PICKUP_NOTICE",
  "TRANSPORT_ORDER",
  "WAYBILL",
  "DELIVERY_NOTICE",
  "DELIVERY_NOTE_TEMP",
];

const documentTypeOptions = Object.entries(documentTypeLabel).map(([v, l]) => ({ value: v, label: l }));

type DocumentData = {
  id: string;
  documentType: DocumentTypeEnum;
  title: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  sourceType: string | null;
  sourceId: string | null;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
};

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (typeFilter !== "all") params.set("documentType", typeFilter);

  const { data: documents, isLoading, mutate } = useSWR<DocumentData[]>(
    `/api/documents?${params.toString()}`,
    fetcher
  );

  const { data: allDocuments } = useSWR<DocumentData[]>("/api/documents", fetcher);

  const allDocs = documents ?? [];
  const allDocsForCount = allDocuments ?? [];
  const selected = allDocs.find((d) => d.id === showPreview);

  const [newForm, setNewForm] = useState({ documentType: "", title: "", filePath: "", note: "" });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: newForm.documentType, title: newForm.title, filePath: newForm.filePath || "/documents/placeholder.pdf", mimeType: "application/pdf", note: newForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ documentType: "", title: "", filePath: "", note: "" });
      mutate();
      showToast("帳票を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この帳票を削除しますか？")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowPreview(null);
      mutate();
      showToast("帳票を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  if (isLoading) {
    return (
      <>
        <Header title="帳票管理" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="帳票管理" />
      <div className="p-6 space-y-4">
        {/* 帳票種別カード */}
        <div className="grid grid-cols-3 gap-3">
          {mainDocumentTypes.map((type) => {
            const count = allDocsForCount.filter((d) => d.documentType === type).length;
            const isActive = typeFilter === type;
            return (
              <button key={type} onClick={() => setTypeFilter(isActive ? "all" : type)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${isActive ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${documentTypeColors[type]}`}>
                  {count}
                </span>
                <span className="text-sm text-text">{documentTypeLabel[type]}</span>
              </button>
            );
          })}
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="帳票タイトルで検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {typeFilter !== "all" && <button onClick={() => setTypeFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />帳票登録
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">タイトル</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ファイル</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {allDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${documentTypeColors[doc.documentType]}`}>{documentTypeLabel[doc.documentType]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text">{doc.title}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{new Date(doc.createdAt).toLocaleDateString("ja-JP")}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{doc.mimeType ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowPreview(doc.id)} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="プレビュー">
                        <Eye className="w-4 h-4 text-text-tertiary" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="削除">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{allDocs.length}件 / {allDocsForCount.length}件</p>
          </div>
        </div>
      </div>

      {/* 帳票登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="帳票登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="種別" required><FormSelect placeholder="選択" value={newForm.documentType} onChange={(e) => setNewForm({ ...newForm, documentType: e.target.value })} options={documentTypeOptions} /></FormField>
          <FormField label="タイトル" required><FormInput placeholder="例: 請求書 2026年3月分" value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput placeholder="備考" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      {/* プレビューモーダル */}
      <Modal isOpen={!!showPreview} onClose={() => setShowPreview(null)} title={selected ? `${documentTypeLabel[selected.documentType]}: ${selected.title}` : ""}
        footer={<>
          <button onClick={() => showToast("PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Printer className="w-4 h-4" />PDF出力</button>
          <button onClick={() => showToast("メール送信（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Mail className="w-4 h-4" />メール</button>
          <button onClick={() => selected && handleDelete(selected.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowPreview(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-6 bg-white min-h-[300px]">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">{documentTypeLabel[selected.documentType]}</h3>
                <p className="text-xs text-text-tertiary">{selected.title}</p>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-text-tertiary">ファイルパス</p>
                    <p className="text-sm font-medium">{selected.filePath}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">作成日</p>
                    <p className="text-sm">{new Date(selected.createdAt).toLocaleDateString("ja-JP")}</p>
                  </div>
                </div>
                {selected.note && (
                  <div>
                    <p className="text-xs text-text-tertiary">備考</p>
                    <p className="text-sm">{selected.note}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-text-tertiary">発行元</p>
                  <p className="text-sm font-medium">株式会社CFP MR事業部</p>
                  <p className="text-xs text-text-tertiary">〒721-0942 広島県福山市引野町5丁目11番4号</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
