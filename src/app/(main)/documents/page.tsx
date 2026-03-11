"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { documents, documentTypeColors, type DocumentType } from "@/lib/dummy-data-phase1";
import { Search, Download, Eye, Printer, Mail, FileText, Filter } from "lucide-react";
import { useState } from "react";

const documentTypes: DocumentType[] = [
  "請求書", "納品書（本）", "納品書（仮）", "買受書", "Invoice/PackingList",
  "引取連絡", "運送指示書", "送り状・受領書", "搬入連絡",
];

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = documents.filter((d) => {
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.number.toLowerCase().includes(q) || d.partner.includes(q) || d.product.includes(q);
    }
    return true;
  });

  const selected = documents.find((d) => d.id === showPreview);

  return (
    <>
      <Header title="帳票管理" />
      <div className="p-6 space-y-4">
        {/* 帳票種別カード */}
        <div className="grid grid-cols-3 gap-3">
          {(["請求書", "納品書（本）", "買受書", "Invoice/PackingList", "引取連絡", "運送指示書", "送り状・受領書", "搬入連絡", "納品書（仮）"] as DocumentType[]).map((type) => {
            const count = documents.filter((d) => d.type === type).length;
            const isActive = typeFilter === type;
            return (
              <button key={type} onClick={() => setTypeFilter(isActive ? "all" : type)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${isActive ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${documentTypeColors[type]}`}>
                  {count}
                </span>
                <span className="text-sm text-text">{type}</span>
              </button>
            );
          })}
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="帳票番号、取引先で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">全ステータス</option>
              <option value="発行済">発行済</option>
              <option value="作成中">作成中</option>
              <option value="未発行">未発行</option>
            </select>
            {typeFilter !== "all" && <button onClick={() => setTypeFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>}
          </div>
          <button onClick={() => showToast("一括PDF生成（開発中）", "info")} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
            <Download className="w-4 h-4" />一括PDF
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">帳票番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">取引先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">品目</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${documentTypeColors[doc.type]}`}>{doc.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{doc.number}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{doc.date}</td>
                  <td className="px-4 py-3 text-sm text-text">{doc.partner}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{doc.product}</td>
                  <td className="px-4 py-3 text-sm text-text text-right font-medium">{doc.amount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      doc.status === "発行済" ? "bg-emerald-50 text-emerald-700" :
                      doc.status === "作成中" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-50 text-gray-700"
                    }`}>{doc.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowPreview(doc.id)} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="プレビュー">
                        <Eye className="w-4 h-4 text-text-tertiary" />
                      </button>
                      <button onClick={() => showToast(`${doc.type} PDF生成（開発中）`, "info")} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="PDF出力">
                        <Printer className="w-4 h-4 text-text-tertiary" />
                      </button>
                      <button onClick={() => showToast("メール送信（開発中）", "info")} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="メール送信">
                        <Mail className="w-4 h-4 text-text-tertiary" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {documents.length}件</p>
          </div>
        </div>
      </div>

      {/* プレビューモーダル */}
      <Modal isOpen={!!showPreview} onClose={() => setShowPreview(null)} title={selected ? `${selected.type}: ${selected.number}` : ""}
        footer={<>
          <button onClick={() => showToast("PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Printer className="w-4 h-4" />PDF出力</button>
          <button onClick={() => showToast("メール送信（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Mail className="w-4 h-4" />メール</button>
          <button onClick={() => setShowPreview(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            {/* 帳票プレビュー（モック） */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 bg-white min-h-[300px]">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">{selected.type}</h3>
                <p className="text-xs text-text-tertiary">No. {selected.number}</p>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-text-tertiary">宛先</p>
                    <p className="text-sm font-medium">{selected.partner} 御中</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">発行日</p>
                    <p className="text-sm">{selected.date}</p>
                  </div>
                </div>
                <div className="border border-border rounded p-3">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border"><th className="text-left py-1 text-xs">品名</th><th className="text-right py-1 text-xs">金額</th></tr></thead>
                    <tbody><tr><td className="py-1">{selected.product}</td><td className="text-right py-1 font-medium">{selected.amount}</td></tr></tbody>
                  </table>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-tertiary">発行元</p>
                  <p className="text-sm font-medium">株式会社CFP MR事業部</p>
                  <p className="text-xs text-text-tertiary">〒721-0942 広島県福山市引野町5丁目11番4号</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-text-tertiary text-center">※ これはプレビューモックです。実際のPDF生成はDB接続後に実装します。</p>
          </div>
        )}
      </Modal>
    </>
  );
}
