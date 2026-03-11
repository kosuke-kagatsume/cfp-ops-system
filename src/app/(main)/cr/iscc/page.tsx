"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { isccCertificates, massBalanceEntries, sdDocuments } from "@/lib/dummy-data-phase3";
import { Shield, FileText, Eye, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

type Tab = "certificates" | "massBalance" | "sdDocuments";

export default function IsccPage() {
  const [activeTab, setActiveTab] = useState<Tab>("certificates");
  const [showSdDetail, setShowSdDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const selectedSd = sdDocuments.find((d) => d.id === showSdDetail);

  return (
    <>
      <Header title="ISCC PLUS管理" />
      <div className="p-6 space-y-4">
        {/* 認証ステータスバナー */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">ISCC PLUS認証 - 有効</p>
            <p className="text-xs text-emerald-600">マスバランス方式による認証原料の投入・出荷管理。全ての取引に監査証跡を記録。</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-600">認証サイト</p>
            <p className="text-sm font-medium text-emerald-800">{isccCertificates.length}拠点</p>
          </div>
        </div>

        {/* タブ */}
        <div className="flex items-center gap-1 border-b border-border">
          {([
            { key: "certificates", label: "認証情報" },
            { key: "massBalance", label: "マスバランス" },
            { key: "sdDocuments", label: "SD文書" },
          ] as { key: Tab; label: string }[]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary-600 text-primary-700" : "border-transparent text-text-secondary hover:text-text"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 認証情報タブ */}
        {activeTab === "certificates" && (
          <div className="space-y-4">
            {isccCertificates.map((cert) => (
              <div key={cert.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-mono font-medium text-text">{cert.number}</p>
                      <p className="text-xs text-text-tertiary">{cert.site}</p>
                    </div>
                  </div>
                  <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">{cert.status}</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div><p className="text-xs text-text-tertiary">有効期間</p><p className="text-sm text-text">{cert.validFrom} 〜 {cert.validUntil}</p></div>
                  <div><p className="text-xs text-text-tertiary">スコープ</p><p className="text-sm text-text">{cert.scope}</p></div>
                  <div><p className="text-xs text-text-tertiary">最終監査日</p><p className="text-sm text-text">{cert.lastAudit}</p></div>
                  <div><p className="text-xs text-text-tertiary">残日数</p><p className="text-sm font-medium text-text">
                    {Math.ceil((new Date(cert.validUntil).getTime() - new Date("2026-03-11").getTime()) / (1000 * 60 * 60 * 24))}日
                  </p></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* マスバランスタブ */}
        {activeTab === "massBalance" && (
          <div className="space-y-4">
            <p className="text-xs text-text-tertiary">認証原料の投入量と出荷量のバランスを管理。投入量を超える出荷はできません。</p>
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">期間</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サイト</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">認証投入(kg)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">総投入(kg)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">認証出荷(kg)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">総出荷(kg)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">認証残高(kg)</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">SD数</th>
                  </tr>
                </thead>
                <tbody>
                  {massBalanceEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                      <td className="px-4 py-3 text-sm font-medium text-text">{entry.period}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{entry.site}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{entry.inputCertified.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-text-secondary">{entry.inputTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">{entry.outputCertified.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-text-secondary">{entry.outputTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-text">{entry.balance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">{entry.sdDocuments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SD文書タブ */}
        {activeTab === "sdDocuments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-tertiary">Sustainability Declaration（持続可能性宣言）文書の管理</p>
              <button onClick={() => showToast("SD文書を新規作成（開発中）", "info")} className="px-3 py-1.5 text-xs bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">新規作成</button>
            </div>
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">SD番号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">取引先</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量(kg)</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {sdDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{doc.number}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${doc.type === "出荷" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{doc.type}</span></td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{doc.date}</td>
                      <td className="px-4 py-3 text-sm text-text">{doc.customer}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{doc.product}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text text-right">{doc.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowSdDetail(doc.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SD詳細モーダル */}
      <Modal isOpen={!!showSdDetail} onClose={() => setShowSdDetail(null)} title={selectedSd ? `SD文書: ${selectedSd.number}` : ""}
        footer={<>
          <button onClick={() => showToast("SD文書PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Download className="w-4 h-4" />PDF</button>
          <button onClick={() => setShowSdDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selectedSd && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">SD番号</p><p className="text-sm font-mono text-text">{selectedSd.number}</p></div>
              <div><p className="text-xs text-text-tertiary">ISCC番号</p><p className="text-sm font-mono text-text">{selectedSd.isccNumber}</p></div>
              <div><p className="text-xs text-text-tertiary">種別</p><p className="text-sm text-text">{selectedSd.type}</p></div>
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{selectedSd.date}</p></div>
              <div><p className="text-xs text-text-tertiary">取引先</p><p className="text-sm text-text">{selectedSd.customer}</p></div>
              <div><p className="text-xs text-text-tertiary">製品</p><p className="text-sm text-text">{selectedSd.product}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selectedSd.quantity.toLocaleString()} kg</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
