"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Shield, Eye, Download, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


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
  const [showNewCertModal, setShowNewCertModal] = useState(false);
  const [showNewSdModal, setShowNewSdModal] = useState(false);
  const { showToast } = useToast();

  const { items: certificates, total, page, limit, isLoading: loadingCerts, mutate: mutateCerts, onPageChange } = usePaginated<IsccCertificateItem>(
    "/api/iscc/certificates"
  );
  const { data: massBalances, isLoading: loadingMb } = useSWR<MassBalanceItem[]>(
    "/api/iscc/mass-balance"
  );
  const { data: sdDocuments, isLoading: loadingSd, mutate: mutateSd } = useSWR<SdDocumentItem[]>(
    "/api/iscc/sd"
  );

  const selectedSd = sdDocuments?.find((d) => d.id === showSdDetail);

  const [newCertForm, setNewCertForm] = useState({ certNumber: "", holderName: "", scope: "", issueDate: "", expiryDate: "", status: "ACTIVE" });
  const [newSdForm, setNewSdForm] = useState({ sdNumber: "", issueDate: new Date().toISOString().split("T")[0], rawMaterial: "", countryOfOrigin: "", ghgValue: "", note: "" });

  const handleCreateCert = async () => {
    try {
      const res = await fetch("/api/iscc/certificates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certNumber: newCertForm.certNumber, holderName: newCertForm.holderName, scope: newCertForm.scope || undefined, issueDate: newCertForm.issueDate, expiryDate: newCertForm.expiryDate, status: newCertForm.status }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewCertModal(false);
      setNewCertForm({ certNumber: "", holderName: "", scope: "", issueDate: "", expiryDate: "", status: "ACTIVE" });
      mutateCerts();
      showToast("ISCC認証を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm("この認証情報を削除しますか？")) return;
    try {
      const res = await fetch(`/api/iscc/certificates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      mutateCerts();
      showToast("認証情報を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  const handleCreateSd = async () => {
    try {
      const res = await fetch("/api/iscc/sd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdNumber: newSdForm.sdNumber, issueDate: newSdForm.issueDate, rawMaterial: newSdForm.rawMaterial || undefined, countryOfOrigin: newSdForm.countryOfOrigin || undefined, ghgValue: newSdForm.ghgValue ? parseFloat(newSdForm.ghgValue) : undefined, note: newSdForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewSdModal(false);
      setNewSdForm({ sdNumber: "", issueDate: new Date().toISOString().split("T")[0], rawMaterial: "", countryOfOrigin: "", ghgValue: "", note: "" });
      mutateSd();
      showToast("SD文書を登録しました", "success");
    } catch { showToast("登録に失敗しました", "error"); }
  };

  const handleDeleteSd = async (id: string) => {
    if (!confirm("このSD文書を削除しますか？")) return;
    try {
      const res = await fetch(`/api/iscc/sd/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowSdDetail(null);
      mutateSd();
      showToast("SD文書を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  return (
    <>
      <Header title="ISCC PLUS管理" />
      <div className="p-4 md:p-6 space-y-4">
        {/* 認証ステータスバナー */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">ISCC PLUS認証 - 有効</p>
            <p className="text-xs text-emerald-600">マスバランス方式による認証原料の投入・出荷管理。全ての取引に監査証跡を記録。</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-600">認証サイト</p>
            <p className="text-sm font-medium text-emerald-800">{certificates.length ?? 0}拠点</p>
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
            <div className="flex items-center justify-end">
              <button onClick={() => setShowNewCertModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
                <Plus className="w-4 h-4" />認証登録
              </button>
            </div>
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
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">{statusLabel[cert.status] ?? cert.status}</span>
                      <button onClick={() => handleDeleteCert(cert.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="bg-surface rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-[800px]">
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-text-tertiary">Sustainability Declaration（持続可能性宣言）文書の管理</p>
              <button onClick={() => setShowNewSdModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">
                <Plus className="w-3 h-3" />新規作成
              </button>
            </div>
            {loadingSd ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : sdDocuments && sdDocuments.length > 0 ? (
              <div className="bg-surface rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">SD番号</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">発行日</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">原材料</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">原産国</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">GHG値</th>
                      <th className="w-20"></th>
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
                          <div className="flex items-center gap-1">
                            <button onClick={() => setShowSdDetail(doc.id)} className="p-2 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                            <button onClick={() => handleDeleteSd(doc.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              
              <div className="px-4 py-3 border-t border-border">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
</div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-text-tertiary">SD文書がありません</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ISCC認証登録モーダル */}
      <Modal isOpen={showNewCertModal} onClose={() => setShowNewCertModal(false)} title="ISCC認証 登録"
        footer={<>
          <button onClick={() => setShowNewCertModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreateCert} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="認証番号" required><FormInput placeholder="例: ISCC-PLUS-Cert-DE999-99999999" value={newCertForm.certNumber} onChange={(e) => setNewCertForm({ ...newCertForm, certNumber: e.target.value })} /></FormField>
          <FormField label="保有者名" required><FormInput placeholder="例: 株式会社CFP 福山工場" value={newCertForm.holderName} onChange={(e) => setNewCertForm({ ...newCertForm, holderName: e.target.value })} /></FormField>
          <FormField label="スコープ"><FormInput placeholder="例: Collection, Trading, Processing" value={newCertForm.scope} onChange={(e) => setNewCertForm({ ...newCertForm, scope: e.target.value })} /></FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="発行日" required><FormInput type="date" value={newCertForm.issueDate} onChange={(e) => setNewCertForm({ ...newCertForm, issueDate: e.target.value })} /></FormField>
            <FormField label="有効期限" required><FormInput type="date" value={newCertForm.expiryDate} onChange={(e) => setNewCertForm({ ...newCertForm, expiryDate: e.target.value })} /></FormField>
          </div>
          <FormField label="ステータス"><FormSelect value={newCertForm.status} onChange={(e) => setNewCertForm({ ...newCertForm, status: e.target.value })} options={[
            { value: "ACTIVE", label: "有効" }, { value: "EXPIRING", label: "期限間近" }, { value: "EXPIRED", label: "期限切れ" }, { value: "SUSPENDED", label: "停止" },
          ]} /></FormField>
        </div>
      </Modal>

      {/* SD文書登録モーダル */}
      <Modal isOpen={showNewSdModal} onClose={() => setShowNewSdModal(false)} title="SD文書 新規作成"
        footer={<>
          <button onClick={() => setShowNewSdModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreateSd} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">作成する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="SD番号" required><FormInput placeholder="例: SD-CFP-2026-001" value={newSdForm.sdNumber} onChange={(e) => setNewSdForm({ ...newSdForm, sdNumber: e.target.value })} /></FormField>
          <FormField label="発行日" required><FormInput type="date" value={newSdForm.issueDate} onChange={(e) => setNewSdForm({ ...newSdForm, issueDate: e.target.value })} /></FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="原材料"><FormInput placeholder="例: 廃プラスチック" value={newSdForm.rawMaterial} onChange={(e) => setNewSdForm({ ...newSdForm, rawMaterial: e.target.value })} /></FormField>
            <FormField label="原産国"><FormInput placeholder="例: 日本" value={newSdForm.countryOfOrigin} onChange={(e) => setNewSdForm({ ...newSdForm, countryOfOrigin: e.target.value })} /></FormField>
          </div>
          <FormField label="GHG値"><FormInput type="number" placeholder="例: 12.5" value={newSdForm.ghgValue} onChange={(e) => setNewSdForm({ ...newSdForm, ghgValue: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput placeholder="備考" value={newSdForm.note} onChange={(e) => setNewSdForm({ ...newSdForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      {/* SD詳細モーダル */}
      <Modal isOpen={!!showSdDetail} onClose={() => setShowSdDetail(null)} title={selectedSd ? `SD文書: ${selectedSd.sdNumber}` : ""}
        footer={<>
          <button onClick={() => showToast("SD文書PDF生成（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><Download className="w-4 h-4" />PDF</button>
          <button onClick={() => selectedSd && handleDeleteSd(selectedSd.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">削除</button>
          <button onClick={() => setShowSdDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selectedSd && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
