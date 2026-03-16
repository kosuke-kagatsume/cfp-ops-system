"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Shield, Eye, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "certificates" | "massBalance" | "sdDocuments";

type IsccCertificateItem = {
  id: string;
  certNumber: string;
  holderName: string;
  scope: string | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  partner: { id: string; name: string } | null;
  _count: { massBalances: number };
};

type MassBalanceItem = {
  id: string;
  period: string;
  inputQuantity: number;
  outputQuantity: number;
  balanceQuantity: number;
  ghgEmission: number | null;
  note: string | null;
  certificate: { id: string; certNumber: string; holderName: string };
  product: { id: string; code: string; name: { name: string } | null };
};

type SdDocumentItem = {
  id: string;
  sdNumber: string;
  issueDate: string;
  rawMaterial: string | null;
  countryOfOrigin: string | null;
  ghgValue: number | null;
  pdfPath: string | null;
  note: string | null;
};

const statusLabel: Record<string, string> = {
  ACTIVE: "有効",
  EXPIRING: "期限間近",
  EXPIRED: "期限切れ",
  SUSPENDED: "停止",
};

export default function IsccPage() {
  const [activeTab, setActiveTab] = useState<Tab>("certificates");
  const [showSdDetail, setShowSdDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: certificates, isLoading: loadingCerts } = useSWR<IsccCertificateItem[]>(
    "/api/iscc/certificates",
    fetcher
  );
  const { data: massBalances, isLoading: loadingMb } = useSWR<MassBalanceItem[]>(
    "/api/iscc/mass-balance",
    fetcher
  );
  const { data: sdDocuments, isLoading: loadingSd } = useSWR<SdDocumentItem[]>(
    "/api/iscc/sd",
    fetcher
  );

  const selectedSd = sdDocuments?.find((d) => d.id === showSdDetail);

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
            <p className="text-sm font-medium text-emerald-800">{certificates?.length ?? 0}拠点</p>
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
            {loadingCerts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : certificates && certificates.length > 0 ? (
              certificates.map((cert) => (
                <div key={cert.id} className="bg-surface rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-mono font-medium text-text">{cert.certNumber}</p>
                        <p className="text-xs text-text-tertiary">{cert.holderName}</p>
                      </div>
                    </div>
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">{statusLabel[cert.status] ?? cert.status}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div><p className="text-xs text-text-tertiary">有効期間</p><p className="text-sm text-text">{new Date(cert.issueDate).toLocaleDateString("ja-JP")} 〜 {new Date(cert.expiryDate).toLocaleDateString("ja-JP")}</p></div>
                    <div><p className="text-xs text-text-tertiary">スコープ</p><p className="text-sm text-text">{cert.scope ?? "-"}</p></div>
                    <div><p className="text-xs text-text-tertiary">マスバランス件数</p><p className="text-sm text-text">{cert._count.massBalances}件</p></div>
                    <div><p className="text-xs text-text-tertiary">残日数</p><p className="text-sm font-medium text-text">
                      {Math.ceil((new Date(cert.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日
                    </p></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-text-tertiary">認証情報がありません</p>
              </div>
            )}
          </div>
        )}

        {/* マスバランスタブ */}
        {activeTab === "massBalance" && (
          <div className="space-y-4">
            <p className="text-xs text-text-tertiary">認証原料の投入量と出荷量のバランスを管理。投入量を超える出荷はできません。</p>
            {loadingMb ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : massBalances && massBalances.length > 0 ? (
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">期間</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">認証番号</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">投入量(kg)</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">産出量(kg)</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">残高(kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {massBalances.map((entry) => (
                      <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                        <td className="px-4 py-3 text-sm font-medium text-text">{entry.period}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary font-mono">{entry.certificate.certNumber}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{entry.product.name?.name ?? entry.product.code}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{entry.inputQuantity.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">{entry.outputQuantity.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-text">{entry.balanceQuantity.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-text-tertiary">マスバランスデータがありません</p>
              </div>
            )}
          </div>
        )}

        {/* SD文書タブ */}
        {activeTab === "sdDocuments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-tertiary">Sustainability Declaration（持続可能性宣言）文書の管理</p>
              <button onClick={() => showToast("SD文書を新規作成（開発中）", "info")} className="px-3 py-1.5 text-xs bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">新規作成</button>
            </div>
            {loadingSd ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : sdDocuments && sdDocuments.length > 0 ? (
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">SD番号</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">発行日</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">原材料</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">原産国</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">GHG値</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sdDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                        <td className="px-4 py-3 text-sm font-mono text-primary-600">{doc.sdNumber}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{new Date(doc.issueDate).toLocaleDateString("ja-JP")}</td>
                        <td className="px-4 py-3 text-sm text-text">{doc.rawMaterial ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{doc.countryOfOrigin ?? "-"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-text text-right">{doc.ghgValue != null ? doc.ghgValue.toFixed(2) : "-"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setShowSdDetail(doc.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-text-tertiary">SD文書がありません</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SD詳細モーダル */}
      <Modal isOpen={!!showSdDetail} onClose={() => setShowSdDetail(null)} title={selectedSd ? `SD文書: ${selectedSd.sdNumber}` : ""}
        footer={<>
          <button onClick={() => showToast("SD文書PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Download className="w-4 h-4" />PDF</button>
          <button onClick={() => setShowSdDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selectedSd && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">SD番号</p><p className="text-sm font-mono text-text">{selectedSd.sdNumber}</p></div>
              <div><p className="text-xs text-text-tertiary">発行日</p><p className="text-sm text-text">{new Date(selectedSd.issueDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">原材料</p><p className="text-sm text-text">{selectedSd.rawMaterial ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">原産国</p><p className="text-sm text-text">{selectedSd.countryOfOrigin ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">GHG値</p><p className="text-sm font-medium text-text">{selectedSd.ghgValue != null ? selectedSd.ghgValue.toFixed(2) : "-"}</p></div>
              {selectedSd.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selectedSd.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
