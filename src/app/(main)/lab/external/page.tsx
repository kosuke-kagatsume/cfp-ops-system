"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { externalAnalyses, externalAnalysisStatusColors, type ExternalAnalysisStatus } from "@/lib/dummy-data-phase3";
import { Plus, Search, Eye, FileText, Receipt, ChevronRight } from "lucide-react";
import { useState } from "react";

const statusList: ExternalAnalysisStatus[] = ["依頼受付", "サンプル受領", "分析中", "報告済", "請求済"];

export default function ExternalAnalysisPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = externalAnalyses.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const selected = externalAnalyses.find((a) => a.id === showDetail);
  const totalRevenue = externalAnalyses.reduce((sum, a) => sum + a.price, 0);

  return (
    <>
      <Header title="外部受託分析" />
      <div className="p-6 space-y-4">
        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">受託件数（当月）</p>
            <p className="text-2xl font-bold text-text">{externalAnalyses.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">売上合計</p>
            <p className="text-2xl font-bold text-text">¥{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">未請求</p>
            <p className="text-2xl font-bold text-amber-600">{externalAnalyses.filter((a) => a.status !== "請求済").length}件</p>
          </div>
        </div>

        {/* ステータスパイプライン */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            {statusList.map((step, i) => {
              const count = externalAnalyses.filter((a) => a.status === step).length;
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
            <Plus className="w-4 h-4" />受託登録
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">依頼ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">依頼元</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">サンプル名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">分析項目</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">納期</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{a.requestId}</td>
                  <td className="px-4 py-3 text-sm text-text">{a.customer}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.sampleName}</td>
                  <td className="px-4 py-3 text-xs text-text-tertiary">{a.analysisItems.join(", ")}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.dueDate}</td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">¥{a.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${externalAnalysisStatusColors[a.status]}`}>{a.status}</span>
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

      {/* 受託登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="外部受託分析 登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("受託を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="依頼元" required><FormInput placeholder="例: 関西化学工業株式会社" /></FormField>
          <FormField label="サンプル名" required><FormInput placeholder="例: 再生油サンプルA" /></FormField>
          <FormField label="分析項目" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "比重・動粘度・硫黄分・引火点（基本4項目）" },
            { value: "2", label: "上記＋残留塩素・水分（6項目）" },
            { value: "3", label: "GC/MS全項目（フルスペック）" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="納期" required><FormInput type="date" defaultValue="2026-03-19" /></FormField>
            <FormField label="金額(円)" required><FormInput type="number" placeholder="例: 35000" /></FormField>
          </div>
          <FormField label="担当者"><FormSelect placeholder="選択" options={[
            { value: "1", label: "中村 理恵" },
          ]} /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `受託分析: ${selected.requestId}` : ""}
        footer={<>
          {selected?.status === "依頼受付" && <button onClick={() => { setShowDetail(null); showToast("サンプル受領しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">サンプル受領</button>}
          {selected?.status === "分析中" && <button onClick={() => { setShowDetail(null); showToast("報告書を発行しました（モック）", "success"); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700"><FileText className="w-4 h-4" />報告書発行</button>}
          {selected?.status === "報告済" && <button onClick={() => { setShowDetail(null); showToast("請求しました（モック）", "success"); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700"><Receipt className="w-4 h-4" />請求する</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.requestId}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${externalAnalysisStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">依頼元</p><p className="text-sm text-text">{selected.customer}</p></div>
              <div><p className="text-xs text-text-tertiary">依頼日</p><p className="text-sm text-text">{selected.requestDate}</p></div>
              <div><p className="text-xs text-text-tertiary">サンプル名</p><p className="text-sm text-text">{selected.sampleName}</p></div>
              <div><p className="text-xs text-text-tertiary">納期</p><p className="text-sm text-text">{selected.dueDate}</p></div>
              <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-text">¥{selected.price.toLocaleString()}</p></div>
              <div><p className="text-xs text-text-tertiary">担当</p><p className="text-sm text-text">{selected.assignedTo || "未割当"}</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-2">分析項目</p>
              <div className="flex flex-wrap gap-1">
                {selected.analysisItems.map((item) => (
                  <span key={item} className="inline-flex px-2 py-0.5 text-xs bg-surface rounded border border-border">{item}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
