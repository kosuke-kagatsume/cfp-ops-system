"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, TestTube, Loader2 } from "lucide-react";
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

const statusList: SampleStatus[] = ["RECEIVED", "ANALYZING", "JUDGED", "REPORTED"];

type LabSampleItem = {
  id: string;
  sampleNumber: string;
  sampleName: string;
  source: string | null;
  receivedDate: string;
  status: SampleStatus;
  note: string | null;
  product: {
    id: string;
    code: string;
    displayName: string | null;
    name: { name: string };
  } | null;
  _count: { analysisResults: number };
};

export default function LabSamplesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: samples, isLoading } = useSWR<LabSampleItem[]>("/api/lab/samples", fetcher);

  if (isLoading) {
    return (
      <>
        <Header title="サンプル受付" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  const allSamples = samples ?? [];

  const filtered = allSamples.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.sampleNumber.toLowerCase().includes(q) ||
        s.sampleName.toLowerCase().includes(q) ||
        (s.source ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selected = allSamples.find((s) => s.id === showDetail);
  const productName = (s: LabSampleItem) =>
    s.product?.displayName ?? s.product?.name?.name ?? "-";

  return (
    <>
      <Header title="サンプル受付" />
      <div className="p-6 space-y-4">
        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusList.map((step, i) => {
              const count = allSamples.filter((s) => s.status === step).length;
              const isActive = statusFilter === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step)}
                    className={`flex-1 p-3 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{statusMap[step]}</p>
                  </button>
                  {i < statusList.length - 1 && <div className="w-4 h-0.5 bg-border mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="サンプルID、サンプル名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {statusFilter !== "all" && <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />サンプル受付
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプルID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプル名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプル元</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受付日</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">分析数</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm font-mono text-primary-600">{s.sampleNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text">{s.sampleName}</td>
                  <td className="px-4 py-3 text-sm text-text">{productName(s)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{s.source ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{new Date(s.receivedDate).toLocaleDateString("ja-JP")}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary text-center">{s._count.analysisResults}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[s.status]}`}>{statusMap[s.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(s.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {allSamples.length}件</p>
          </div>
        </div>
      </div>

      {/* 受付モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="サンプル受付"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("サンプルを受付しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">受付する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="サンプル番号" required><FormInput placeholder="例: SA-2026-0189" /></FormField>
          <FormField label="サンプル名" required><FormInput placeholder="例: CPO軽質サンプル" /></FormField>
          <FormField label="製品" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "Circular Pyrolysis Oil（軽質）" }, { value: "2", label: "Circular Pyrolysis Oil（重質）" }, { value: "3", label: "Circular Pyrolysis Oil（混合）" },
          ]} /></FormField>
          <FormField label="サンプル元"><FormInput placeholder="例: 岡ケミ CR装置 ロット260312-TC" /></FormField>
          <FormField label="受付日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `サンプル: ${selected.sampleNumber}` : ""}
        footer={<>
          {selected?.status === "RECEIVED" && <button onClick={() => { setShowDetail(null); showToast("分析を開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">分析開始</button>}
          {selected?.status === "JUDGED" && <button onClick={() => { setShowDetail(null); showToast("報告書を発行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">報告書発行</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.sampleNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{statusMap[selected.status]}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">サンプル名</p><p className="text-sm text-text">{selected.sampleName}</p></div>
              <div><p className="text-xs text-text-tertiary">受付日</p><p className="text-sm text-text">{new Date(selected.receivedDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">製品</p><p className="text-sm text-text">{productName(selected)}</p></div>
              <div><p className="text-xs text-text-tertiary">サンプル元</p><p className="text-sm text-text">{selected.source ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">分析結果数</p><p className="text-sm text-text">{selected._count.analysisResults}件</p></div>
              {selected.note && <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
