"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Download, Eye, FileText, ArrowRight, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type Document = {
  id: string;
  documentType: string;
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

const typeLabel: Record<string, string> = {
  DELIVERY_NOTE_TEMP: "仮納品書",
  DELIVERY_NOTE_FINAL: "本納品書",
};

const typeColor: Record<string, string> = {
  DELIVERY_NOTE_TEMP: "bg-amber-50 text-amber-700",
  DELIVERY_NOTE_FINAL: "bg-blue-50 text-blue-700",
};

export default function DeliveryNotesPage() {
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { items: documents, total, page, limit, isLoading, onPageChange } = usePaginated<Document>(
    "/api/sales/delivery-notes"
  );

  const selected = documents.find((d) => d.id === showDetail);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ja-JP");

  const formatFileSize = (size: number | null) => {
    if (!size) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Header title="納品書管理" />
      <div className="p-6 space-y-4">
        {/* フロー説明 */}
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs font-medium text-text-secondary mb-2">納品書発行フロー</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">仮納品書</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">本納品書</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">発行済</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button onClick={() => showToast("一括PDF生成は個別の印刷ボタンをご利用ください", "info")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
            <Download className="w-4 h-4" />PDF一括出力
          </button>
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">タイトル</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ファイルパス</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">サイズ</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">作成日</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text">{d.title}</td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary truncate max-w-[200px]">{d.filePath}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-right">{formatFileSize(d.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(d.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${typeColor[d.documentType] ?? "bg-gray-100 text-gray-700"}`}>
                          {typeLabel[d.documentType] ?? d.documentType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => window.open(`/api/documents/delivery-note/${d.id}`, "_blank")} className="p-1 hover:bg-surface-tertiary rounded transition-colors" title="納品書印刷">
                            <Printer className="w-4 h-4 text-text-tertiary" />
                          </button>
                          <a href={`/api/pdf/delivery-note?id=${d.id}`} download className="p-1 hover:bg-surface-tertiary rounded transition-colors" title="PDFダウンロード">
                            <Download className="w-4 h-4 text-text-tertiary" />
                          </a>
                          <button onClick={() => setShowDetail(d.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                            <Eye className="w-4 h-4 text-text-tertiary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!documents || documents.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-tertiary">納品書データがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border bg-surface-secondary">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `納品書詳細: ${selected.title}` : ""}
        footer={<>
          {selected?.documentType === "DELIVERY_NOTE_TEMP" && <button onClick={() => { setShowDetail(null); showToast("本納品書に昇格しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">本納品書に昇格</button>}
          {selected?.documentType === "DELIVERY_NOTE_FINAL" && <button onClick={() => { setShowDetail(null); showToast("納品書を発行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">発行する</button>}
          <button onClick={() => { if (selected) window.open(`/api/documents/delivery-note/${selected.id}`, "_blank"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">PDF印刷</button>
          {selected && <a href={`/api/pdf/delivery-note?id=${selected.id}`} download className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary flex items-center gap-1"><Download className="w-4 h-4" />PDFダウンロード</a>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">{selected.title}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${typeColor[selected.documentType] ?? "bg-gray-100 text-gray-700"}`}>
                {typeLabel[selected.documentType] ?? selected.documentType}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">ファイルパス</p><p className="text-sm font-mono text-text">{selected.filePath}</p></div>
              <div><p className="text-xs text-text-tertiary">サイズ</p><p className="text-sm text-text">{formatFileSize(selected.fileSize)}</p></div>
              <div><p className="text-xs text-text-tertiary">MIME</p><p className="text-sm text-text">{selected.mimeType ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">作成日</p><p className="text-sm text-text">{formatDate(selected.createdAt)}</p></div>
              <div><p className="text-xs text-text-tertiary">元データ種別</p><p className="text-sm text-text">{selected.sourceType ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note ?? "-"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
