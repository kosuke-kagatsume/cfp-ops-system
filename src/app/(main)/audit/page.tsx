"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import { Search, Download, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";

type AuditLogEntry = {
  id: string;
  userId: string | null;
  user: { id: string; name: string; email: string } | null;
  action: string;
  tableName: string;
  recordId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

const actionLabels: Record<string, string> = {
  CREATE: "追加",
  UPDATE: "更新",
  DELETE: "削除",
};

function formatJson(data: Record<string, unknown> | null): string {
  if (!data) return "-";
  return JSON.stringify(data, null, 2);
}

function summarizeChange(log: AuditLogEntry): string {
  if (log.action === "CREATE" && log.newData) {
    const keys = Object.keys(log.newData);
    return `${log.tableName}に新規レコード作成 (${keys.length}項目)`;
  }
  if (log.action === "UPDATE" && log.oldData && log.newData) {
    const changedKeys = Object.keys(log.newData).filter(
      (k) => JSON.stringify(log.oldData?.[k]) !== JSON.stringify(log.newData?.[k])
    );
    return `${changedKeys.length}項目を変更: ${changedKeys.slice(0, 3).join(", ")}${changedKeys.length > 3 ? "..." : ""}`;
  }
  if (log.action === "DELETE") {
    return `${log.tableName}のレコードを削除`;
  }
  return `${log.action} on ${log.tableName}`;
}

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (actionFilter !== "all") params.set("action", actionFilter);

  const { items: logs, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<AuditLogEntry>(
    `/api/audit?${params.toString()}`
  );

  const selectedLog = logs.find((l) => l.id === showDetail);

  return (
    <>
      <Header title="監査ログ" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="ユーザー、テーブル、操作内容で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">全操作</option>
              <option value="CREATE">追加</option>
              <option value="UPDATE">更新</option>
              <option value="DELETE">削除</option>
            </select>
          </div>
          <button
            onClick={() => showToast("監査ログCSVをダウンロードしました", "success")}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV出力
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日時</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ユーザー</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">操作</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">テーブル</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">概要</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{log.user?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${
                        log.action === "CREATE" ? "bg-emerald-50 text-emerald-700"
                          : log.action === "UPDATE" ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-700"
                      }`}>{actionLabels[log.action] ?? log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary">{log.tableName}</td>
                    <td className="px-4 py-3 text-sm text-text">{summarizeChange(log)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setShowDetail(log.id)} className="p-2 hover:bg-surface-tertiary rounded transition-colors">
                        <Eye className="w-4 h-4 text-text-tertiary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
          </div>
        )}
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)}
        title="監査ログ詳細"
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>}
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">日時</p><p className="text-sm font-mono text-text">{new Date(selectedLog.createdAt).toLocaleString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">ユーザー</p><p className="text-sm text-text">{selectedLog.user?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">操作</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${
                  selectedLog.action === "CREATE" ? "bg-emerald-50 text-emerald-700"
                    : selectedLog.action === "UPDATE" ? "bg-blue-50 text-blue-700"
                    : "bg-red-50 text-red-700"
                }`}>{actionLabels[selectedLog.action] ?? selectedLog.action}</span>
              </div>
              <div><p className="text-xs text-text-tertiary">テーブル</p><p className="text-sm font-mono text-text">{selectedLog.tableName}</p></div>
            </div>
            <div><p className="text-xs text-text-tertiary">レコードID</p><p className="text-sm font-mono text-text">{selectedLog.recordId}</p></div>
            {selectedLog.ipAddress && (
              <div><p className="text-xs text-text-tertiary">IPアドレス</p><p className="text-sm font-mono text-text">{selectedLog.ipAddress}</p></div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 mb-1">変更前データ</p>
                <pre className="text-xs font-mono text-red-700 whitespace-pre-wrap max-h-40 overflow-auto">{formatJson(selectedLog.oldData)}</pre>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-600 mb-1">変更後データ</p>
                <pre className="text-xs font-mono text-emerald-700 whitespace-pre-wrap max-h-40 overflow-auto">{formatJson(selectedLog.newData)}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
