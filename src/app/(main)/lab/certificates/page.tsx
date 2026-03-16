"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Award, Download, Mail, Printer, Eye, Search, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SampleStatus = "RECEIVED" | "ANALYZING" | "JUDGED" | "REPORTED";

const statusMap: Record<SampleStatus, string> = {
  RECEIVED: "受付済",
  ANALYZING: "分析中",
  JUDGED: "判定済",
  REPORTED: "報告済",
};

const statusColors: Record<SampleStatus, string> = {
  RECEIVED: "bg-gray-50 text-gray-700",
  ANALYZING: "bg-blue-50 text-blue-700",
  JUDGED: "bg-amber-50 text-amber-700",
  REPORTED: "bg-emerald-50 text-emerald-700",
};

type AnalysisResultInCert = {
  id: string;
  testItem: string;
  result: string;
  unit: string | null;
  standard: string | null;
  isPassed: boolean | null;
};

type CertificateItem = {
  id: string;
  certificateNumber: string;
  sampleId: string;
  issueDate: string;
  pdfPath: string | null;
  note: string | null;
  sample: {
    id: string;
    sampleNumber: string;
    sampleName: string;
    status: SampleStatus;
    source: string | null;
    receivedDate: string;
    product: {
      displayName: string | null;
      name: { name: string };
    } | null;
    analysisResults: AnalysisResultInCert[];
  };
};

export default function LabCertificatesPage() {
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: certificates, isLoading } = useSWR<CertificateItem[]>("/api/lab/certificates", fetcher);

  if (isLoading) {
    return (
      <>
        <Header title="成績書発行" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  const allCerts = certificates ?? [];

  const filtered = allCerts.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        c.certificateNumber.toLowerCase().includes(q) ||
        c.sample.sampleNumber.toLowerCase().includes(q) ||
        c.sample.sampleName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selected = allCerts.find((c) => c.id === showPreview);
  const productName = (c: CertificateItem) =>
    c.sample.product?.displayName ?? c.sample.product?.name?.name ?? "-";

  const judgedCount = allCerts.filter((c) => c.sample.status === "JUDGED").length;
  const reportedCount = allCerts.filter((c) => c.sample.status === "REPORTED").length;

  return (
    <>
      <Header title="成績書発行" />
      <div className="p-6 space-y-4">
        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-text-tertiary" />
              <p className="text-xs text-text-tertiary">成績書総数</p>
            </div>
            <p className="text-2xl font-bold text-text">{allCerts.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">判定済サンプル</p>
            <p className="text-2xl font-bold text-amber-600">{judgedCount}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">報告済サンプル</p>
            <p className="text-2xl font-bold text-emerald-600">{reportedCount}件</p>
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="成績書番号、サンプルIDで検索..." value={search} onChange={(e) => setSearch(e.target.value)}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">成績書番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプルID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">発行日</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">判定</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const allPassed = c.sample.analysisResults.length > 0 && c.sample.analysisResults.every((r) => r.isPassed === true);
                const anyFailed = c.sample.analysisResults.some((r) => r.isPassed === false);
                const judgment = c.sample.analysisResults.length === 0 ? null : anyFailed ? "不合格" : allPassed ? "合格" : null;

                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{c.certificateNumber}</td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary">{c.sample.sampleNumber}</td>
                    <td className="px-4 py-3 text-sm text-text">{productName(c)}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(c.issueDate).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-center">
                      {judgment ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          judgment === "合格" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>{judgment}</span>
                      ) : <span className="text-xs text-text-tertiary">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[c.sample.status]}`}>{statusMap[c.sample.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowPreview(c.id)} className="p-1.5 hover:bg-surface-tertiary rounded transition-colors" title="プレビュー">
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
      <Modal isOpen={!!showPreview} onClose={() => setShowPreview(null)} title={selected ? `分析成績書: ${selected.certificateNumber}` : ""}
        footer={<>
          <button onClick={() => showToast("PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Printer className="w-4 h-4" />PDF出力</button>
          <button onClick={() => showToast("メール送信（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Mail className="w-4 h-4" />メール</button>
          {selected?.sample.status === "JUDGED" && <button onClick={() => { setShowPreview(null); showToast("成績書を発行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">発行する</button>}
          <button onClick={() => setShowPreview(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            {/* 成績書プレビュー */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 bg-white min-h-[400px]">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold">分析成績書</h3>
                <p className="text-xs text-text-tertiary">Certificate of Analysis</p>
              </div>
              <div className="border-t border-border pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-tertiary">成績書番号</p>
                    <p className="text-sm font-mono">{selected.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">サンプルID</p>
                    <p className="text-sm font-mono">{selected.sample.sampleNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">製品名</p>
                    <p className="text-sm">{productName(selected)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">発行日</p>
                    <p className="text-sm">{new Date(selected.issueDate).toLocaleDateString("ja-JP")}</p>
                  </div>
                </div>

                {selected.sample.analysisResults.length > 0 && (
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
                        {selected.sample.analysisResults.map((r) => (
                          <tr key={r.id} className="border-b border-border last:border-0">
                            <td className="px-3 py-2">{r.testItem}</td>
                            <td className="px-3 py-2 font-mono">{r.standard ?? "-"}</td>
                            <td className="px-3 py-2 font-mono font-medium">{r.result}{r.unit ? ` ${r.unit}` : ""}</td>
                            <td className="px-3 py-2 text-center">{r.isPassed === true ? "○" : r.isPassed === false ? "×" : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(() => {
                      const allPassed = selected.sample.analysisResults.every((r) => r.isPassed === true);
                      const anyFailed = selected.sample.analysisResults.some((r) => r.isPassed === false);
                      const j = anyFailed ? "不合格" : allPassed ? "合格" : null;
                      return j ? (
                        <div className="text-center">
                          <span className={`inline-flex px-4 py-1 text-sm font-bold rounded-full ${
                            j === "合格" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>総合判定: {j}</span>
                        </div>
                      ) : null;
                    })()}
                  </>
                )}

                <div className="text-right pt-4 border-t border-border">
                  <p className="text-xs text-text-tertiary">発行元</p>
                  <p className="text-sm font-medium">株式会社CFP 研究室</p>
                  <p className="text-xs text-text-tertiary">〒721-0942 広島県福山市引野町5丁目11番4号</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-text-tertiary text-center">※ これはプレビューです。実際のPDF生成はDB接続後に実装します。</p>
          </div>
        )}
      </Modal>
    </>
  );
}
