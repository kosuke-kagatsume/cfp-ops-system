"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import {
  HardDrive,
  Plus,
  X,
  Loader2,
  Calculator,
  ChevronDown,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Asset = {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  residualValue: number;
  usefulLife: number;
  depreciationMethod: string;
  depreciationRate: number | null;
  accumulatedDepreciation: number;
  bookValue: number;
  location: string | null;
  note: string | null;
  isDisposed: boolean;
  disposedAt: string | null;
};

type ScheduleItem = {
  fiscalYear: number;
  amount: number;
  accumulated: number;
  bookValue: number;
};

const CATEGORIES = [
  "建物",
  "建物附属設備",
  "機械装置",
  "車両運搬具",
  "工具器具備品",
  "ソフトウェア",
  "その他",
];

export default function AssetsPage() {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showDisposed, setShowDisposed] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [depYear, setDepYear] = useState(new Date().getFullYear());
  const [depRunning, setDepRunning] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "工具器具備品",
    acquisitionDate: "",
    acquisitionCost: "",
    residualValue: "1",
    usefulLife: "",
    depreciationMethod: "STRAIGHT_LINE",
    depreciationRate: "",
    location: "",
    note: "",
  });

  const params = new URLSearchParams();
  if (categoryFilter) params.set("category", categoryFilter);
  if (showDisposed) params.set("disposed", "all");

  const {
    data: assets,
    isLoading,
    mutate,
  } = useSWR<Asset[]>(`/api/assets?${params.toString()}`, fetcher);

  const toggleSchedule = async (assetId: string) => {
    if (expandedAsset === assetId) {
      setExpandedAsset(null);
      setSchedule(null);
      return;
    }
    setExpandedAsset(assetId);
    setScheduleLoading(true);
    try {
      const res = await fetch(`/api/assets/depreciation?assetId=${assetId}`);
      const data = await res.json();
      setSchedule(data.schedule ?? []);
    } catch {
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.acquisitionDate || !form.acquisitionCost || !form.usefulLife) {
      showToast("必須項目を入力してください", "error");
      return;
    }
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          acquisitionCost: parseFloat(form.acquisitionCost),
          residualValue: parseFloat(form.residualValue || "1"),
          usefulLife: parseInt(form.usefulLife),
          depreciationRate: form.depreciationRate
            ? parseFloat(form.depreciationRate)
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("固定資産を登録しました", "success");
      setShowForm(false);
      setForm({
        name: "",
        category: "工具器具備品",
        acquisitionDate: "",
        acquisitionCost: "",
        residualValue: "1",
        usefulLife: "",
        depreciationMethod: "STRAIGHT_LINE",
        depreciationRate: "",
        location: "",
        note: "",
      });
      mutate();
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const handleDispose = async (asset: Asset) => {
    if (!confirm(`「${asset.name}」を除却しますか？`)) return;
    try {
      await fetch(`/api/assets?id=${asset.id}`, { method: "DELETE" });
      showToast("除却しました", "success");
      mutate();
    } catch {
      showToast("除却に失敗しました", "error");
    }
  };

  const handleDepreciation = async () => {
    if (!confirm(`${depYear}年度の減価償却を一括計算しますか？`)) return;
    setDepRunning(true);
    try {
      const res = await fetch("/api/assets/depreciation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiscalYear: depYear }),
      });
      const result = await res.json();
      showToast(
        `${result.processedCount}件の減価償却を計算しました`,
        "success"
      );
      mutate();
    } catch {
      showToast("減価償却計算に失敗しました", "error");
    } finally {
      setDepRunning(false);
    }
  };

  const formatCurrency = (n: number) => `¥${n.toLocaleString()}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("ja-JP");

  // 集計
  const totalAcquisition = assets?.filter((a) => !a.isDisposed).reduce((s, a) => s + a.acquisitionCost, 0) ?? 0;
  const totalBookValue = assets?.filter((a) => !a.isDisposed).reduce((s, a) => s + a.bookValue, 0) ?? 0;
  const totalAccumulated = assets?.filter((a) => !a.isDisposed).reduce((s, a) => s + a.accumulatedDepreciation, 0) ?? 0;

  return (
    <>
      <Header title="固定資産管理" />

      <div className="p-4 md:p-6 space-y-4">
        {/* アクションバー */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg px-2">
            <input
              type="number"
              value={depYear}
              onChange={(e) => setDepYear(parseInt(e.target.value))}
              className="w-20 py-1.5 text-sm bg-transparent"
            />
            <span className="text-xs text-text-tertiary">年度</span>
            <button
              onClick={handleDepreciation}
              disabled={depRunning}
              className="ml-1 px-3 py-1.5 text-xs bg-amber-500 text-white rounded font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1"
            >
              {depRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Calculator className="w-3 h-3" />
              )}
              一括償却
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-text-inverse rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            資産登録
          </button>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">取得価額合計</p>
            <p className="text-lg font-bold text-text">
              {formatCurrency(totalAcquisition)}
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">償却累計額</p>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(totalAccumulated)}
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">帳簿価額合計</p>
            <p className="text-lg font-bold text-primary-600">
              {formatCurrency(totalBookValue)}
            </p>
          </div>
        </div>

        {/* フィルタ */}
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg bg-surface"
          >
            <option value="">全カテゴリ</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={showDisposed}
              onChange={(e) => setShowDisposed(e.target.checked)}
              className="rounded"
            />
            除却済みを表示
          </label>
        </div>

        {/* 資産一覧 */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-text-secondary">
                読み込み中...
              </span>
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="w-8"></th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">
                    資産番号
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">
                    名称
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">
                    カテゴリ
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">
                    取得日
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">
                    取得価額
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">
                    帳簿価額
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary">
                    償却方法
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary">
                    耐用年数
                  </th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {assets?.map((asset) => (
                  <>
                    <tr
                      key={asset.id}
                      className={`border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors ${
                        asset.isDisposed ? "opacity-50" : ""
                      }`}
                    >
                      <td className="pl-2">
                        <button
                          onClick={() => toggleSchedule(asset.id)}
                          className="p-2 hover:bg-surface-tertiary rounded"
                        >
                          {expandedAsset === asset.id ? (
                            <ChevronDown className="w-4 h-4 text-text-tertiary" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-text-tertiary" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                        {asset.assetNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {asset.name}
                        {asset.isDisposed && (
                          <span className="ml-2 text-xs text-red-500">
                            除却済
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">
                          {asset.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {formatDate(asset.acquisitionDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text text-right">
                        {formatCurrency(asset.acquisitionCost)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        <span
                          className={
                            asset.bookValue <= asset.residualValue
                              ? "text-text-tertiary"
                              : "text-primary-600"
                          }
                        >
                          {formatCurrency(asset.bookValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-center text-text-secondary">
                        {asset.depreciationMethod === "STRAIGHT_LINE"
                          ? "定額法"
                          : "定率法"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-text-secondary">
                        {asset.usefulLife}年
                      </td>
                      <td className="px-4 py-3">
                        {!asset.isDisposed && (
                          <button
                            onClick={() => handleDispose(asset)}
                            className="text-xs text-red-400 hover:text-red-600 hover:underline"
                          >
                            除却
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedAsset === asset.id && (
                      <tr key={`${asset.id}-schedule`}>
                        <td colSpan={10} className="bg-surface-secondary/30 px-8 py-4">
                          {scheduleLoading ? (
                            <div className="flex items-center gap-2 py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                              <span className="text-sm text-text-secondary">
                                スケジュール計算中...
                              </span>
                            </div>
                          ) : schedule && schedule.length > 0 ? (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <TrendingDown className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-text">
                                  減価償却スケジュール
                                </span>
                              </div>
                              <table className="w-full min-w-[800px] text-sm">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-2 text-xs text-text-secondary">
                                      年度
                                    </th>
                                    <th className="text-right py-2 text-xs text-text-secondary">
                                      償却額
                                    </th>
                                    <th className="text-right py-2 text-xs text-text-secondary">
                                      累計額
                                    </th>
                                    <th className="text-right py-2 text-xs text-text-secondary">
                                      帳簿価額
                                    </th>
                                    <th className="text-right py-2 text-xs text-text-secondary">
                                      償却率
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {schedule.map((s) => (
                                    <tr
                                      key={s.fiscalYear}
                                      className="border-b border-border/50"
                                    >
                                      <td className="py-1.5 text-text">
                                        {s.fiscalYear}年
                                      </td>
                                      <td className="py-1.5 text-right text-amber-600">
                                        {formatCurrency(s.amount)}
                                      </td>
                                      <td className="py-1.5 text-right text-text-secondary">
                                        {formatCurrency(s.accumulated)}
                                      </td>
                                      <td className="py-1.5 text-right font-medium text-text">
                                        {formatCurrency(s.bookValue)}
                                      </td>
                                      <td className="py-1.5 text-right text-xs text-text-tertiary">
                                        {(
                                          (s.amount / asset.acquisitionCost) *
                                          100
                                        ).toFixed(1)}
                                        %
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-text-tertiary py-2">
                              償却スケジュールがありません
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {(!assets || assets.length === 0) && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm text-text-tertiary"
                    >
                      <HardDrive className="w-8 h-8 mx-auto mb-2 text-text-quaternary" />
                      固定資産データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 登録モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text">固定資産登録</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  資産名称 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                  placeholder="例: ノートPC ThinkPad X1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    カテゴリ *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    取得日 *
                  </label>
                  <input
                    type="date"
                    value={form.acquisitionDate}
                    onChange={(e) =>
                      setForm({ ...form, acquisitionDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    取得価額 *
                  </label>
                  <input
                    type="number"
                    value={form.acquisitionCost}
                    onChange={(e) =>
                      setForm({ ...form, acquisitionCost: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                    placeholder="円"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    残存価額
                  </label>
                  <input
                    type="number"
                    value={form.residualValue}
                    onChange={(e) =>
                      setForm({ ...form, residualValue: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    耐用年数 *
                  </label>
                  <input
                    type="number"
                    value={form.usefulLife}
                    onChange={(e) =>
                      setForm({ ...form, usefulLife: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                    placeholder="年"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    償却方法
                  </label>
                  <select
                    value={form.depreciationMethod}
                    onChange={(e) =>
                      setForm({ ...form, depreciationMethod: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                  >
                    <option value="STRAIGHT_LINE">定額法</option>
                    <option value="DECLINING_BALANCE">定率法</option>
                  </select>
                </div>
              </div>
              {form.depreciationMethod === "DECLINING_BALANCE" && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    償却率
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.depreciationRate}
                    onChange={(e) =>
                      setForm({ ...form, depreciationRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                    placeholder="例: 0.333"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  設置場所
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  備考
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-border">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-tertiary rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700"
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
