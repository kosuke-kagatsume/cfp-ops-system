"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import { auditLogs } from "@/lib/dummy-data";
import { Search, Download, Eye } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/modal";

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = auditLogs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return log.user.includes(q) || log.summary.includes(q) || log.table.includes(q);
    }
    return true;
  });

  const selectedLog = auditLogs.find((l) => l.id === showDetail);

  return (
    <>
      <Header title="監査ログ" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="ユーザー、テーブル、操作内容で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">全操作</option>
              <option value="INSERT">追加</option>
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

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日時</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ユーザー</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">操作</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">テーブル</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">概要</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">変更前</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">変更後</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3 text-sm text-text">{log.user}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${
                      log.action === "INSERT" ? "bg-emerald-50 text-emerald-700"
                        : log.action === "UPDATE" ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-700"
                    }`}>{log.action === "INSERT" ? "追加" : log.action === "UPDATE" ? "更新" : "削除"}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{log.table}</td>
                  <td className="px-4 py-3 text-sm text-text">{log.summary}</td>
                  <td className="px-4 py-3 text-sm text-red-600 font-mono">{log.oldValue}</td>
                  <td className="px-4 py-3 text-sm text-emerald-600 font-mono">{log.newValue}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(log.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件表示</p>
          </div>
        </div>
      </div>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)}
        title="監査ログ詳細"
        footer={<button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>}
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">日時</p><p className="text-sm font-mono text-text">{selectedLog.timestamp}</p></div>
              <div><p className="text-xs text-text-tertiary">ユーザー</p><p className="text-sm text-text">{selectedLog.user}</p></div>
              <div><p className="text-xs text-text-tertiary">操作</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${
                  selectedLog.action === "INSERT" ? "bg-emerald-50 text-emerald-700"
                    : selectedLog.action === "UPDATE" ? "bg-blue-50 text-blue-700"
                    : "bg-red-50 text-red-700"
                }`}>{selectedLog.action === "INSERT" ? "追加" : selectedLog.action === "UPDATE" ? "更新" : "削除"}</span>
              </div>
              <div><p className="text-xs text-text-tertiary">テーブル</p><p className="text-sm font-mono text-text">{selectedLog.table}</p></div>
            </div>
            <div><p className="text-xs text-text-tertiary">レコードID</p><p className="text-sm font-mono text-text">{selectedLog.recordId}</p></div>
            <div><p className="text-xs text-text-tertiary">概要</p><p className="text-sm text-text">{selectedLog.summary}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 mb-1">変更前</p>
                <p className="text-sm font-mono text-red-700">{selectedLog.oldValue}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-600 mb-1">変更後</p>
                <p className="text-sm font-mono text-emerald-700">{selectedLog.newValue}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
