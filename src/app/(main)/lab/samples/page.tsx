"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { labSamples, sampleStatusColors, type SampleStatus } from "@/lib/dummy-data-phase2";
import { Plus, Search, Eye, TestTube } from "lucide-react";
import { useState } from "react";

const statusList: SampleStatus[] = ["受付済", "分析中", "判定済", "報告済"];

export default function LabSamplesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = labSamples.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.sampleId.toLowerCase().includes(q) || s.lot.includes(q) || s.product.includes(q);
    }
    return true;
  });

  const selected = labSamples.find((s) => s.id === showDetail);

  return (
    <>
      <Header title="サンプル受付" />
      <div className="p-6 space-y-4">
        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusList.map((step, i) => {
              const count = labSamples.filter((s) => s.status === step).length;
              const isActive = statusFilter === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <button onClick={() => setStatusFilter(isActive ? "all" : step)}
                    className={`flex-1 p-3 rounded-lg text-center transition-colors ${isActive ? "bg-primary-100 border-2 border-primary-400" : "bg-surface-secondary hover:bg-surface-tertiary border-2 border-transparent"}`}>
                    <p className="text-lg font-bold text-text">{count}</p>
                    <p className="text-xs text-text-secondary">{step}</p>
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
              <input type="text" placeholder="サンプルID、ロット番号で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ロット</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">製品</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">工程</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">依頼日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">担当</th>
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
                      <span className="text-sm font-mono text-primary-600">{s.sampleId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{s.lot}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.product}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{s.process}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{s.requestDate}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.assignedTo}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${sampleStatusColors[s.status]}`}>{s.status}</span>
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
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {labSamples.length}件</p>
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
          <FormField label="ロット番号" required><FormInput placeholder="例: 260312-TC" /></FormField>
          <FormField label="製品" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "Circular Pyrolysis Oil（軽質）" }, { value: "2", label: "Circular Pyrolysis Oil（重質）" }, { value: "3", label: "Circular Pyrolysis Oil（混合）" },
          ]} /></FormField>
          <FormField label="工程" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "岡ケミ CR装置" }, { value: "2", label: "美の浜 CR装置" },
          ]} /></FormField>
          <FormField label="担当者" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "中村 理恵" },
          ]} /></FormField>
          <FormField label="依頼日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `サンプル: ${selected.sampleId}` : ""}
        footer={<>
          {selected?.status === "受付済" && <button onClick={() => { setShowDetail(null); showToast("分析を開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">分析開始</button>}
          {selected?.status === "判定済" && <button onClick={() => { setShowDetail(null); showToast("報告書を発行しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">報告書発行</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.sampleId}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${sampleStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">ロット</p><p className="text-sm font-mono text-text">{selected.lot}</p></div>
              <div><p className="text-xs text-text-tertiary">依頼日</p><p className="text-sm text-text">{selected.requestDate}</p></div>
              <div><p className="text-xs text-text-tertiary">製品</p><p className="text-sm text-text">{selected.product}</p></div>
              <div><p className="text-xs text-text-tertiary">工程</p><p className="text-sm text-text">{selected.process}</p></div>
              <div><p className="text-xs text-text-tertiary">担当者</p><p className="text-sm text-text">{selected.assignedTo}</p></div>
              {"result" in selected && <div><p className="text-xs text-text-tertiary">判定結果</p><p className="text-sm font-medium text-emerald-600">{(selected as { result: string }).result}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
