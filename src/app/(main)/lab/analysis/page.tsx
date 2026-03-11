"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput } from "@/components/modal";
import { useToast } from "@/components/toast";
import { analysisResults, labSamples, sampleStatusColors } from "@/lib/dummy-data-phase2";
import { Beaker, CheckCircle, XCircle, Save } from "lucide-react";
import { useState } from "react";

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
  const [showResultModal, setShowResultModal] = useState(false);
  const { showToast } = useToast();

  // 分析対象のサンプル（受付済 or 分析中）
  const pendingSamples = labSamples.filter((s) => s.status === "受付済" || s.status === "分析中");
  const completedSamples = labSamples.filter((s) => s.status === "判定済" || s.status === "報告済");

  const existingResult = analysisResults.find((r) => r.sampleId === selectedSample);

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
                <button key={s.id} onClick={() => setSelectedSample(s.sampleId)}
                  className={`p-4 rounded-xl border text-left transition-colors ${selectedSample === s.sampleId ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-primary-600">{s.sampleId}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${sampleStatusColors[s.status]}`}>{s.status}</span>
                  </div>
                  <p className="text-sm text-text">{s.product}</p>
                  <p className="text-xs text-text-tertiary">ロット: {s.lot} | {s.process}</p>
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
              <button onClick={() => showToast("分析結果を保存しました（モック）", "success")}
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
                      <input type="text" className="w-24 px-2 py-1 text-sm border border-border rounded bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" placeholder="入力" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-text-tertiary">-</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button onClick={() => showToast("合格判定しました（モック）", "success")}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                <CheckCircle className="w-4 h-4" />合格判定
              </button>
              <button onClick={() => showToast("不合格判定しました（モック）", "warning")}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
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
              const result = analysisResults.find((r) => r.sampleId === s.sampleId);
              return (
                <div key={s.id} className="bg-surface rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-primary-600">{s.sampleId}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${sampleStatusColors[s.status]}`}>{s.status}</span>
                    </div>
                    {result && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        result.judgment === "合格" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {result.judgment === "合格" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {result.judgment}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{s.product} | ロット: {s.lot}</p>
                  {result && (
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
                          {result.items.map((item) => (
                            <tr key={item.name} className="border-b border-border last:border-0">
                              <td className="px-2 py-1 text-text">{item.name}</td>
                              <td className="px-2 py-1 font-mono text-text-secondary">{item.spec}</td>
                              <td className="px-2 py-1 font-mono font-medium text-text">{item.value}{item.unit ? ` ${item.unit}` : ""}</td>
                              <td className="px-2 py-1 text-center">
                                {item.pass ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline" /> : <XCircle className="w-3.5 h-3.5 text-red-500 inline" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!result && <p className="text-xs text-text-tertiary">分析データなし</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
