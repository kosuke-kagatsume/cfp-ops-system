"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import { Upload, Search, Loader2, FileText, Trash2, Eye, Download, Calendar, DollarSign, Building2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ElectronicDocument = {
  id: string;
  transactionDate: string;
  amount: number;
  partnerName: string;
  documentType: string;
  originalFileName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  timestampedAt: string;
  ocrData: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
};

const docTypeOptions = ["領収書", "請求書", "見積書", "納品書", "契約書", "その他"];

export default function ElectronicDocumentsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<Record<string, unknown> | null>(null);

  // 検索3要件フィルタ
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [partner, setPartner] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");

  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (amountFrom) params.set("amountFrom", amountFrom);
  if (amountTo) params.set("amountTo", amountTo);
  if (partner) params.set("partner", partner);
  if (docTypeFilter) params.set("type", docTypeFilter);

  const { data: documents, isLoading, mutate } = useSWR<ElectronicDocument[]>(
    `/api/electronic-documents?${params.toString()}`,
    fetcher
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setOcrResult(null);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/electronic-documents", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const result = await res.json();

        if (result.ocrData) {
          setOcrResult(result.ocrData);
          showToast(
            `OCR完了: ${result.ocrData.partnerName ?? "取引先不明"} / ¥${(result.ocrData.amount ?? 0).toLocaleString()}`,
            "success"
          );
        } else {
          showToast("ファイルを保存しました", "success");
        }

        mutate();
      } catch {
        showToast("アップロードに失敗しました", "error");
      } finally {
        setIsUploading(false);
      }
    },
    [mutate, showToast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDelete = async (doc: ElectronicDocument) => {
    if (!confirm(`「${doc.originalFileName}」を削除しますか？`)) return;
    try {
      await fetch(`/api/electronic-documents?id=${doc.id}`, {
        method: "DELETE",
      });
      mutate();
      showToast("削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ja-JP");

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <>
      <Header title="電子帳簿保存" />
      <div className="p-6 space-y-4">
        {/* アップロードエリア */}
        <div
          className="p-6 border-2 border-dashed border-border rounded-xl bg-surface text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="text-sm text-text-secondary">
                アップロード + OCR処理中...
              </span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary mb-1">
                領収書・請求書をドラッグ＆ドロップ
              </p>
              <p className="text-xs text-text-tertiary mb-3">
                画像ファイルはOCRで自動読取
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                ファイルを選択
              </button>
            </>
          )}
        </div>

        {/* OCR結果プレビュー */}
        {ocrResult && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-sm font-medium text-emerald-800 mb-2">
              OCR抽出結果
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-xs text-emerald-600">日付:</span>{" "}
                <span className="text-emerald-800">
                  {(ocrResult.transactionDate as string) ?? "-"}
                </span>
              </div>
              <div>
                <span className="text-xs text-emerald-600">金額:</span>{" "}
                <span className="text-emerald-800 font-medium">
                  ¥{((ocrResult.amount as number) ?? 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-emerald-600">取引先:</span>{" "}
                <span className="text-emerald-800">
                  {(ocrResult.partnerName as string) ?? "-"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOcrResult(null)}
              className="mt-2 text-xs text-emerald-600 hover:underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* 検索3要件フィルタ */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-text-secondary mb-3">
            検索条件（電子帳簿保存法 検索3要件）
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-text-tertiary" />
                <span className="text-xs text-text-secondary">取引日付</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-border rounded bg-surface"
                />
                <span className="text-text-tertiary">〜</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-border rounded bg-surface"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-text-tertiary" />
                <span className="text-xs text-text-secondary">金額範囲</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="下限"
                  value={amountFrom}
                  onChange={(e) => setAmountFrom(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-border rounded bg-surface"
                />
                <span className="text-text-tertiary">〜</span>
                <input
                  type="number"
                  placeholder="上限"
                  value={amountTo}
                  onChange={(e) => setAmountTo(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-border rounded bg-surface"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Building2 className="w-3 h-3 text-text-tertiary" />
                <span className="text-xs text-text-secondary">取引先名</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="取引先名で検索..."
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-border rounded bg-surface"
                />
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="px-2 py-1 text-sm border border-border rounded bg-surface"
                >
                  <option value="">全種別</option>
                  {docTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ドキュメント一覧 */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-text-secondary">
                読み込み中...
              </span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">
                    取引日付
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">
                    取引先
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">
                    金額
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">
                    種別
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">
                    ファイル
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">
                    タイムスタンプ
                  </th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {documents?.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text">
                      {formatDate(doc.transactionDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text font-medium">
                      {doc.partnerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-text text-right font-medium">
                      ¥{doc.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">
                        <FileText className="w-3 h-3" />
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-text-secondary">
                        <p className="truncate max-w-[150px]">
                          {doc.originalFileName}
                        </p>
                        <p className="text-text-tertiary">
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-tertiary">
                      {new Date(doc.timestampedAt).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {doc.filePath && !doc.filePath.startsWith("data:") && (
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-surface-tertiary rounded transition-colors"
                            title="表示"
                          >
                            <Eye className="w-4 h-4 text-text-tertiary" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!documents || documents.length === 0) && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-text-tertiary"
                    >
                      電子帳簿保存データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="text-xs text-text-tertiary p-3 bg-surface-secondary rounded-lg">
          ※ 電子帳簿保存法の要件に基づき、取引日付・金額・取引先名での検索が可能です。
          タイムスタンプはアップロード時刻を自動記録しています。
        </div>
      </div>
    </>
  );
}
