"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Eye, FileText, Receipt, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ExternalAnalysisItem = {
  id: string;
  sampleId: string;
  laboratoryName: string;
  requestDate: string;
  resultDate: string | null;
  reportPath: string | null;
  cost: number | null;
  note: string | null;
  sample: {
    id: string;
    sampleNumber: string;
    sampleName: string;
    status: string;
  };
};

// Derive display status from the ExternalAnalysis data
// The Prisma model doesn't have a status field; we derive it from dates/paths
type DisplayStatus = "依頼受付" | "分析中" | "報告済";

function deriveStatus(item: ExternalAnalysisItem): DisplayStatus {
  if (item.resultDate) return "報告済";
  if (item.reportPath) return "報告済";
  // If request exists but no result yet
  return item.requestDate ? "分析中" : "依頼受付";
}

const displayStatusColors: Record<DisplayStatus, string> = {
  "依頼受付": "bg-gray-50 text-gray-700",
  "分析中": "bg-amber-50 text-amber-700",
  "報告済": "bg-emerald-50 text-emerald-700",
};

const statusList: DisplayStatus[] = ["依頼受付", "分析中", "報告済"];

export default function ExternalAnalysisPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: externals, isLoading } = useSWR<ExternalAnalysisItem[]>("/api/lab/external", fetcher);

  if (isLoading) {
    return (
      <>
        <Header title="外部受託分析" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  const allExternals = externals ?? [];

  const withStatus = allExternals.map((e) => ({
    ...e,
    displayStatus: deriveStatus(e),
  }));

  const filtered = withStatus.filter((a) => {
    if (statusFilter !== "all" && a.displayStatus !== statusFilter) return false;
    return true;
  });

  const selected = withStatus.find((a) => a.id === showDetail);
  const totalCost = allExternals.reduce((sum, a) => sum + (a.cost ?? 0), 0);

  return (
    <>
      <Header title="外部受託分析" />
      <div className="p-6 space-y-4">
        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">依頼件数</p>
            <p className="text-2xl font-bold text-text">{allExternals.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">費用合計</p>
            <p className="text-2xl font-bold text-text">¥{totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">未完了</p>
            <p className="text-2xl font-bold text-amber-600">{withStatus.filter((a) => a.displayStatus !== "報告済").length}件</p>
          </div>
        </div>

        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusList.map((step, i) => {
              const count = withStatus.filter((a) => a.displayStatus === step).length;
              const isActive = statusFilter === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step)}
                    className={`flex-1 p-2 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{step}</p>
                  </button>
                  {i < statusList.length - 1 && <ChevronRight className="w-4 h-4 text-text-tertiary mx-0.5 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">{filtered.length}件</p>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />依頼登録
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプルID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">外部機関名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプル名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">依頼日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">結果日</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">費用</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{a.sample.sampleNumber}</td>
                  <td className="px-4 py-3 text-sm text-text">{a.laboratoryName}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.sample.sampleName}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{new Date(a.requestDate).toLocaleDateString("ja-JP")}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.resultDate ? new Date(a.resultDate).toLocaleDateString("ja-JP") : "-"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">{a.cost != null ? `¥${a.cost.toLocaleString()}` : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${displayStatusColors[a.displayStatus]}`}>{a.displayStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(a.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 依頼登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="外部分析依頼 登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("依頼を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="外部分析機関名" required><FormInput placeholder="例: SGS Japan" /></FormField>
          <FormField label="サンプル" required><FormSelect placeholder="サンプルを選択" options={[]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="依頼日" required><FormInput type="date" defaultValue="2026-03-17" /></FormField>
            <FormField label="費用(円)"><FormInput type="number" placeholder="例: 35000" /></FormField>
          </div>
          <FormField label="備考"><FormInput placeholder="備考" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `外部分析: ${selected.sample.sampleNumber}` : ""}
        footer={<>
          {selected?.displayStatus === "依頼受付" && <button onClick={() => { setShowDetail(null); showToast("分析中に更新しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">分析開始</button>}
          {selected?.displayStatus === "分析中" && <button onClick={() => { setShowDetail(null); showToast("報告済に更新しました（モック）", "success"); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700"><FileText className="w-4 h-4" />結果登録</button>}
          {selected?.displayStatus === "報告済" && <button onClick={() => { setShowDetail(null); showToast("請求処理しました（モック）", "success"); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700"><Receipt className="w-4 h-4" />請求する</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.sample.sampleNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${displayStatusColors[selected.displayStatus]}`}>{selected.displayStatus}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">外部機関名</p><p className="text-sm text-text">{selected.laboratoryName}</p></div>
              <div><p className="text-xs text-text-tertiary">依頼日</p><p className="text-sm text-text">{new Date(selected.requestDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">サンプル名</p><p className="text-sm text-text">{selected.sample.sampleName}</p></div>
              <div><p className="text-xs text-text-tertiary">結果日</p><p className="text-sm text-text">{selected.resultDate ? new Date(selected.resultDate).toLocaleDateString("ja-JP") : "未着"}</p></div>
              <div><p className="text-xs text-text-tertiary">費用</p><p className="text-sm font-bold text-text">{selected.cost != null ? `¥${selected.cost.toLocaleString()}` : "-"}</p></div>
              {selected.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
