"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { labSamples, analysisResults, sampleStatusColors } from "@/lib/dummy-data-phase2";
import { Award, Download, Mail, Printer, Eye, Search } from "lucide-react";
import { useState } from "react";

export default function LabCertificatesPage() {
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const { showToast } = useToast();

  // 成績書発行対象：判定済 or 報告済
  const certifiableSamples = labSamples.filter((s) => s.status === "判定済" || s.status === "報告済");

  const filtered = certifiableSamples.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      return s.sampleId.toLowerCase().includes(q) || s.lot.includes(q) || s.product.includes(q);
    }
    return true;
  });

  const selected = labSamples.find((s) => s.sampleId === showPreview);
  const selectedResult = analysisResults.find((r) => r.sampleId === showPreview);

  return (
    <>
      <Header title="成績書発行" />
      <div className="p-6 space-y-4">
        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-text-tertiary" />
              <p className="text-xs text-text-tertiary">発行可能</p>
            </div>
            <p className="text-2xl font-bold text-text">{certifiableSamples.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">未発行（判定済）</p>
            <p className="text-2xl font-bold text-amber-600">{labSamples.filter((s) => s.status === "判定済").length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">発行済（報告済）</p>
            <p className="text-2xl font-bold text-emerald-600">{labSamples.filter((s) => s.status === "報告済").length}件</p>
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="サンプルID、ロット番号で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => showToast("一括PDF生成（開発中）", "info")}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
            <Download className="w-4 h-4" />一括PDF
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプルID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ロット</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">工程</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">判定</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const result = analysisResults.find((r) => r.sampleId === s.sampleId);
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{s.sampleId}</td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary">{s.lot}</td>
                    <td className="px-4 py-3 text-sm text-text">{s.product}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{s.process}</td>
                    <td className="px-4 py-3 text-center">
                      {result ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          result.judgment === "合格" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>{result.judgment}</span>
                      ) : <span className="text-xs text-text-tertiary">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${sampleStatusColors[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowPreview(s.sampleId)} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="プレビュー">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                        <button onClick={() => showToast("PDF生成（開発中）", "info")} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="PDF出力">
                          <Printer className="w-4 h-4 text-text-tertiary" />
                        </button>
                        <button onClick={() => showToast("メール送信（開発中）", "info")} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="メール送信">
                          <Mail className="w-4 h-4 text-text-tertiary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件</p>
          </div>
        </div>
      </div>

      {/* 成績書プレビューモーダル */}
      <Modal isOpen={!!showPreview} onClose={() => setShowPreview(null)} title={selected ? `分析成績書: ${selected.sampleId}` : ""}
        footer={<>
          <button onClick={() => showToast("PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Printer className="w-4 h-4" />PDF出力</button>
          <button onClick={() => showToast("メール送信（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Mail className="w-4 h-4" />メール</button>
          {selected?.status === "判定済" && <button onClick={() => { setShowPreview(null); showToast("成績書を発行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">発行する</button>}
          <button onClick={() => setShowPreview(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            {/* 成績書プレビュー（モック） */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 bg-white min-h-[400px]">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold">分析成績書</h3>
                <p className="text-xs text-text-tertiary">Certificate of Analysis</p>
              </div>
              <div className="border-t border-border pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-tertiary">サンプルID</p>
                    <p className="text-sm font-mono">{selected.sampleId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">ロット番号</p>
                    <p className="text-sm font-mono">{selected.lot}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">製品名</p>
                    <p className="text-sm">{selected.product}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">分析日</p>
                    <p className="text-sm">{selected.requestDate}</p>
                  </div>
                </div>

                {selectedResult && (
                  <>
                    <table className="w-full text-sm border border-border">
                      <thead>
                        <tr className="bg-surface-secondary">
                          <th className="text-left px-3 py-2 text-xs border-b border-border">分析項目</th>
                          <th className="text-left px-3 py-2 text-xs border-b border-border">規格値</th>
                          <th className="text-left px-3 py-2 text-xs border-b border-border">測定値</th>
                          <th className="text-center px-3 py-2 text-xs border-b border-border">判定</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResult.items.map((item) => (
                          <tr key={item.name} className="border-b border-border last:border-0">
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 font-mono">{item.spec}</td>
                            <td className="px-3 py-2 font-mono font-medium">{item.value}{item.unit ? ` ${item.unit}` : ""}</td>
                            <td className="px-3 py-2 text-center">{item.pass ? "○" : "×"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-center">
                      <span className={`inline-flex px-4 py-1 text-sm font-bold rounded-full ${
                        selectedResult.judgment === "合格" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>総合判定: {selectedResult.judgment}</span>
                    </div>
                  </>
                )}

                <div className="text-right pt-4 border-t border-border">
                  <p className="text-xs text-text-tertiary">発行元</p>
                  <p className="text-sm font-medium">株式会社CFP 研究室</p>
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
