"use client";

import { Modal } from "@/components/modal";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useCallback, useRef, type DragEvent } from "react";

type ImportResult = {
  total: number;
  created: number;
  updated?: number;
  errors: Array<{ row: number; errors: string[] }>;
};

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  endpoint: string;
  type: string;
  onSuccess?: () => void;
}

export function ImportDialog({ isOpen, onClose, title, endpoint, type, onSuccess }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setResult(null);
    setError(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parsePreview = (text: string) => {
    const cleaned = text.replace(/^\uFEFF/, "");
    const lines = cleaned.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length < 1) return;

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (inQuotes) {
          if (line[i] === '"') {
            if (line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = false;
          } else current += line[i];
        } else {
          if (line[i] === '"') inQuotes = true;
          else if (line[i] === ",") { result.push(current.trim()); current = ""; }
          else current += line[i];
        }
      }
      result.push(current.trim());
      return result;
    };

    const hdrs = parseLine(lines[0]);
    setHeaders(hdrs);
    const rows = lines.slice(1, 6).map(parseLine); // Show first 5 rows
    setPreview(rows);
  };

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setError("CSVファイルを選択してください");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parsePreview(text);
    };
    reader.readAsText(f);
  };

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          setResult(data);
        } else {
          setError(data.error || "インポートに失敗しました");
        }
        return;
      }

      setResult(data);
      onSuccess?.();
    } catch {
      setError("インポート中にエラーが発生しました");
    } finally {
      setIsUploading(false);
    }
  };

  const hasErrors = result && result.errors && result.errors.length > 0;
  const isSuccess = result && (result.created > 0 || (result.updated ?? 0) > 0) && !hasErrors;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            閉じる
          </button>
          {file && !isSuccess && (
            <button
              onClick={handleImport}
              disabled={isUploading}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              インポート実行
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Drop zone */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging ? "border-primary-500 bg-primary-500/5" : "border-border hover:border-primary-300"
            }`}
          >
            <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              CSVファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              またはクリックして選択
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {/* File info */}
        {file && (
          <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
            <FileText className="w-5 h-5 text-primary-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!isSuccess && (
              <button
                onClick={reset}
                className="text-xs text-text-tertiary hover:text-text-secondary"
              >
                変更
              </button>
            )}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && !result && (
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">
              プレビュー（先頭{preview.length}行）
            </p>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-secondary">
                    {headers.map((h, i) => (
                      <th key={i} className="px-2 py-1.5 text-left font-medium text-text-secondary whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1.5 text-text whitespace-nowrap max-w-[150px] truncate">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-danger/5 border border-danger/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Result with errors */}
        {hasErrors && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-warning">バリデーションエラー</p>
                <p className="text-text-secondary mt-1">
                  {result!.errors.length}件のエラーがあります
                </p>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
              {result!.errors.slice(0, 20).map((err, i) => (
                <div key={i} className="px-3 py-2 border-b border-border last:border-0 text-xs">
                  <span className="font-medium text-text">行 {err.row}:</span>{" "}
                  <span className="text-text-secondary">{err.errors.join(", ")}</span>
                </div>
              ))}
              {result!.errors.length > 20 && (
                <div className="px-3 py-2 text-xs text-text-tertiary">
                  他 {result!.errors.length - 20}件のエラー
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="flex items-start gap-2 p-3 bg-success/5 border border-success/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-success">インポート完了</p>
              <p className="text-text-secondary mt-1">
                {result!.created}件作成
                {result!.updated !== undefined && result!.updated > 0 && `、${result!.updated}件更新`}
                （全{result!.total}件）
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
