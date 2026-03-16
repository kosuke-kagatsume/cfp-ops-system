"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, AlertTriangle, FileText, Calendar, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ContractStatusEnum = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "DRAFT";

const statusLabel: Record<ContractStatusEnum, string> = {
  ACTIVE: "有効",
  EXPIRING_SOON: "期限間近",
  EXPIRED: "期限切れ",
  DRAFT: "下書き",
};

const statusColors: Record<ContractStatusEnum, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  EXPIRING_SOON: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-700",
  DRAFT: "bg-gray-50 text-gray-700",
};

type ContractData = {
  id: string;
  contractNumber: string;
  title: string;
  contractType: string | null;
  startDate: string;
  endDate: string | null;
  autoRenewal: boolean;
  status: ContractStatusEnum;
  filePath: string | null;
  note: string | null;
  createdBy: string | null;
  partner: { id: string; code: string; name: string };
};

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data: contracts, isLoading } = useSWR<ContractData[]>(
    `/api/contracts?${params.toString()}`,
    fetcher
  );

  const allContracts = contracts ?? [];
  const selected = allContracts.find((c) => c.id === showDetail);

  // For summary counts, we need all contracts (not filtered)
  const { data: allContractsData } = useSWR<ContractData[]>("/api/contracts", fetcher);
  const all = allContractsData ?? [];
  const expiringSoon = all.filter((c) => c.status === "EXPIRING_SOON").length;
  const expired = all.filter((c) => c.status === "EXPIRED").length;

  if (isLoading) {
    return (
      <>
        <Header title="契約書管理" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </>
    );
  }

  const statusKeys: ContractStatusEnum[] = ["ACTIVE", "EXPIRING_SOON", "EXPIRED", "DRAFT"];

  return (
    <>
      <Header title="契約書管理" />
      <div className="p-6 space-y-4">
        {/* アラート */}
        {(expiringSoon > 0 || expired > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">契約期限に注意が必要です</p>
              <p className="text-xs text-amber-600">期限間近: {expiringSoon}件、期限切れ: {expired}件</p>
            </div>
          </div>
        )}

        {/* サマリ */}
        <div className="grid grid-cols-4 gap-3">
          {statusKeys.map((status) => {
            const count = all.filter((c) => c.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button key={status} onClick={() => setStatusFilter(isActive ? "all" : status)}
                className={`p-3 rounded-xl border text-center transition-colors ${isActive ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{statusLabel[status]}</p>
              </button>
            );
          })}
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="契約番号、件名、取引先で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />契約登録
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">契約番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">件名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">取引先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">有効期間</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">自動更新</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">状態</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {allContracts.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{c.contractNumber}</td>
                  <td className="px-4 py-3 text-sm text-text">{c.title}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{c.partner.name}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">{c.contractType ?? "-"}</span></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{new Date(c.startDate).toLocaleDateString("ja-JP")} 〜 {c.endDate ? new Date(c.endDate).toLocaleDateString("ja-JP") : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {c.autoRenewal ? <RefreshCw className="w-4 h-4 text-emerald-500 inline" /> : <span className="text-xs text-text-tertiary">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[c.status]}`}>{statusLabel[c.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(c.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="契約登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("契約を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="件名" required><FormInput placeholder="例: PP再生ペレット販売基本契約" /></FormField>
          <FormField label="取引先" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "東洋プラスチック株式会社" }, { value: "2", label: "九州リサイクル株式会社" },
            { value: "3", label: "関西化学工業株式会社" }, { value: "4", label: "中国運輸株式会社" },
          ]} /></FormField>
          <FormField label="種別" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "販売契約" }, { value: "2", label: "仕入契約" }, { value: "3", label: "運送契約" },
            { value: "4", label: "加工委託" }, { value: "5", label: "処理委託" }, { value: "6", label: "販売契約（海外）" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="開始日" required><FormInput type="date" /></FormField>
            <FormField label="終了日" required><FormInput type="date" /></FormField>
          </div>
          <FormField label="備考"><FormInput placeholder="例: 自動更新条項あり" /></FormField>
          <div className="border-t border-border pt-4">
            <button onClick={() => showToast("契約書PDF添付（開発中）", "info")} className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-border rounded-lg text-text-secondary hover:bg-surface-tertiary w-full justify-center">
              <FileText className="w-4 h-4" />契約書PDFを添付
            </button>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `契約: ${selected.contractNumber}` : ""}
        footer={<>
          <button onClick={() => showToast("契約書PDF表示（開発中）", "info")} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><FileText className="w-4 h-4" />PDF表示</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.contractNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{statusLabel[selected.status]}</span>
            </div>
            <div><p className="text-base font-medium text-text">{selected.title}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">取引先</p><p className="text-sm text-text">{selected.partner.name}</p></div>
              <div><p className="text-xs text-text-tertiary">種別</p><p className="text-sm text-text">{selected.contractType ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">有効期間</p><p className="text-sm text-text">{new Date(selected.startDate).toLocaleDateString("ja-JP")} 〜 {selected.endDate ? new Date(selected.endDate).toLocaleDateString("ja-JP") : "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">自動更新</p><p className="text-sm text-text">{selected.autoRenewal ? "あり" : "なし"}</p></div>
            </div>
            {selected.note && (
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">備考</p>
                <p className="text-sm text-text">{selected.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
