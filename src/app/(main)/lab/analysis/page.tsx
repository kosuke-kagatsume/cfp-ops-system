"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { useToast } from "@/components/toast";
import { Beaker, CheckCircle, XCircle, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


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

type AnalysisResultItem = {
  id: string;
  sampleId: string;
  testItem: string;
  testMethod: string | null;
  result: string;
  unit: string | null;
  standard: string | null;
  isPassed: boolean | null;
  analysisDate: string;
  analyst: string | null;
  sample: {
    id: string;
    sampleNumber: string;
    sampleName: string;
    status: SampleStatus;
    source: string | null;
    product: {
      displayName: string | null;
      name: { name: string };
    } | null;
  };
};

// 分析項目テンプレート
const analysisTemplate = [
  { name: "比重 (15℃)", unit: "", spec: "0.78-0.85" },
  { name: "動粘度 (40℃)", unit: "mm²/s", spec: "≤5.0" },
  { name: "硫黄分", unit: "%", spec: "≤0.05" },
  { name: "引火点", unit: "℃", spec: "≥21" },
  { name: "水分", unit: "%", spec: "≤0.1" },
  { name: "残留塩素", unit: "ppm", spec: "≤100" },
];

export default function LabAnalysisPage() {
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const { showToast } = useToast();

  const { items: results, total, page, limit, isLoading, onPageChange } = usePaginated<AnalysisResultItem>(
    "/api/lab/analysis"
  );
  const { data: allSamples } = useSWR<Array<{
    id: string;
    sampleNumber: string;
    sampleName: string;
    status: SampleStatus;
    source: string | null;
    product: { displayName: string | null; name: { name: string } } | null;
  }>>("/api/lab/samples");

  if (isLoading) {
    return (
      <>
        <Header title="分析入力" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  const allResults = results ?? [];
  const samples = allSamples ?? [];

  // 分析対象のサンプル（受付済 or 分析中）
  const pendingSamples = samples.filter((s) => s.status === "RECEIVED" || s.status === "ANALYZING");
  const completedSamples = samples.filter((s) => s.status === "JUDGED" || s.status === "REPORTED");

  const productName = (s: { product: { displayName: string | null; name: { name: string } } | null }) =>
    s.product?.displayName ?? s.product?.name?.name ?? "-";

  return (
    <>
      <Header title="分析入力" />
      <div className="p-6 space-y-6">
        {/* 分析待ちサンプル */}
        <div>
          <h2 className="text-sm font-medium text-text mb-3">分析待ち・分析中</h2>
          {pendingSamples.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-8 text-center">
              <Beaker className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">分析待ちのサンプルはありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pendingSamples.map((s) => (
                <button key={s.id} onClick={() => setSelectedSample(s.sampleNumber)}
                  className={`p-4 rounded-xl border text-left transition-colors ${selectedSample === s.sampleNumber ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-primary-600">{s.sampleNumber}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[s.status]}`}>{statusMap[s.status]}</span>
                  </div>
                  <p className="text-sm text-text">{productName(s)}</p>
                  <p className="text-xs text-text-tertiary">{s.sampleName} | {s.source ?? "-"}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 分析入力フォーム */}
        {selectedSample && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text">分析入力: {selectedSample}</h3>
              <button onClick={async () => {
                const inputs = document.querySelectorAll<HTMLInputElement>(`[data-sample="${selectedSample}"]`);
                const sample = samples.find((s) => s.sampleNumber === selectedSample);
                if (!sample) return;
                let created = 0;
                for (const input of inputs) {
                  if (!input.value) continue;
                  const item = analysisTemplate[parseInt(input.dataset.idx ?? "0")];
                  try {
                    await fetch("/api/lab/analysis", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sampleId: sample.id, testItem: item.name, testMethod: "JIS", result: input.value, unit: item.unit || undefined, standard: item.spec, analysisDate: new Date().toISOString() }),
                    });
                    created++;
                  } catch { /* skip */ }
                }
                if (created > 0) { showToast(`${created}件の分析結果を保存しました`, "success"); } else { showToast("入力値がありません", "warning"); }
              }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
                <Save className="w-4 h-4" />保存
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">分析項目</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">規格値</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">単位</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">測定値</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">判定</th>
                </tr>
              </thead>
              <tbody>
                {analysisTemplate.map((item) => (
                  <tr key={item.name} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 text-sm text-text">{item.name}</td>
                    <td className="px-3 py-3 text-sm text-text-secondary font-mono">{item.spec}</td>
                    <td className="px-3 py-3 text-sm text-text-tertiary">{item.unit || "-"}</td>
                    <td className="px-3 py-3">
                      <input type="text" data-sample={selectedSample} data-idx={analysisTemplate.indexOf(item)} className="w-24 px-2 py-1 text-sm border border-border rounded bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" placeholder="入力" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-text-tertiary">-</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button onClick={async () => {
                const sample = samples.find((s) => s.sampleNumber === selectedSample);
                if (!sample) return;
                await fetch(`/api/lab/samples/${sample.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "JUDGED" }) });
                showToast("合格判定しました", "success");
              }} className="flex items-center gap-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                <CheckCircle className="w-4 h-4" />合格判定
              </button>
              <button onClick={async () => {
                const sample = samples.find((s) => s.sampleNumber === selectedSample);
                if (!sample) return;
                await fetch(`/api/lab/samples/${sample.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "JUDGED" }) });
                showToast("不合格判定しました", "warning");
              }} className="flex items-center gap-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                <XCircle className="w-4 h-4" />不合格判定
              </button>
            </div>
          </div>
        )}

        {/* 完了済み分析結果 */}
        <div>
          <h2 className="text-sm font-medium text-text mb-3">分析済み結果</h2>
          <div className="space-y-3">
            {completedSamples.map((s) => {
              const sampleResults = allResults.filter((r) => r.sample.sampleNumber === s.sampleNumber);
              const allPassed = sampleResults.length > 0 && sampleResults.every((r) => r.isPassed === true);
              const anyFailed = sampleResults.some((r) => r.isPassed === false);
              const judgment = sampleResults.length === 0 ? null : anyFailed ? "不合格" : allPassed ? "合格" : null;

              return (
                <div key={s.id} className="bg-surface rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-primary-600">{s.sampleNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[s.status]}`}>{statusMap[s.status]}</span>
                    </div>
                    {judgment && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        judgment === "合格" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {judgment === "合格" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {judgment}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{productName(s)} | {s.sampleName}</p>
                  {sampleResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left px-2 py-1 text-text-tertiary">項目</th>
                            <th className="text-left px-2 py-1 text-text-tertiary">規格</th>
                            <th className="text-left px-2 py-1 text-text-tertiary">結果</th>
                            <th className="text-center px-2 py-1 text-text-tertiary">判定</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleResults.map((r) => (
                            <tr key={r.id} className="border-b border-border last:border-0">
                              <td className="px-2 py-1 text-text">{r.testItem}</td>
                              <td className="px-2 py-1 font-mono text-text-secondary">{r.standard ?? "-"}</td>
                              <td className="px-2 py-1 font-mono font-medium text-text">{r.result}{r.unit ? ` ${r.unit}` : ""}</td>
                              <td className="px-2 py-1 text-center">
                                {r.isPassed === true ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline" /> : r.isPassed === false ? <XCircle className="w-3.5 h-3.5 text-red-500 inline" /> : <span className="text-text-tertiary">-</span>}
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
                    <p className="text-xs text-text-tertiary">分析データなし</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
