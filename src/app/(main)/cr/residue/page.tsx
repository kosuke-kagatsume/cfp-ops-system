"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Trash2, Plus, TrendingUp, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ResidueRow = {
  id: string;
  disposalDate: string;
  quantity: number;
  disposalMethod: string | null;
  disposalCost: number | null;
  contractor: string | null;
  note: string | null;
};

export default function CrResiduePage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: allResidues, isLoading } = useSWR<ResidueRow[]>("/api/cr/residue", fetcher);

  const residues = allResidues ?? [];

  const selected = residues.find((r) => r.id === showDetail);
  const totalQuantity = residues.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <>
      <Header title="残渣管理" />
      <div className="p-6 space-y-4">
        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="w-4 h-4 text-text-tertiary" />
              <p className="text-xs text-text-tertiary">総排出量（当月）</p>
            </div>
            <p className="text-2xl font-bold text-text">{totalQuantity.toLocaleString()} kg</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-text-tertiary">登録件数</p>
            </div>
            <p className="text-2xl font-bold text-text">{residues.length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-text-tertiary" />
              <p className="text-xs text-text-tertiary">平均残渣率</p>
            </div>
            <p className="text-2xl font-bold text-text">—</p>
          </div>
        </div>

        {/* マニフェスト管理バナー */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">産業廃棄物マニフェスト管理</p>
            <p className="text-xs text-amber-600">全ての残渣はマニフェスト番号と紐付けて管理。処理完了後にマニフェストの返送確認を行います。</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">{residues.length}件の残渣記録</p>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />残渣記録登録
          </button>
        </div>

        {/* テーブル */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">日付</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">処理方法</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">処理委託先</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">処理費用</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {residues.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(r.disposalDate).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">{r.quantity.toLocaleString()} kg</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{r.disposalMethod ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-text">{r.contractor ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-text text-right">{r.disposalCost != null ? `${r.disposalCost.toLocaleString()} 円` : "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setShowDetail(r.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors text-text-tertiary hover:text-text-secondary">
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border bg-surface-secondary">
              <p className="text-xs text-text-tertiary">{residues.length}件</p>
            </div>
          </div>
        )}
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="残渣記録登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("残渣記録を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="製造指図" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "CPO-2026-0034 (2026-03-12)" }, { value: "2", label: "CPO-2026-0033 (2026-03-11)" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 390" /></FormField>
            <FormField label="記録日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          </div>
          <FormField label="処理方法" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "産廃処理" }, { value: "2", label: "セメント原料" }, { value: "3", label: "再投入" },
          ]} /></FormField>
          <FormField label="処理委託先"><FormSelect placeholder="選択" options={[
            { value: "1", label: "広島環境サービス株式会社" }, { value: "2", label: "中国セメント株式会社" },
          ]} /></FormField>
          <FormField label="マニフェスト番号"><FormInput placeholder="例: MF-2026-0035" /></FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `残渣詳細` : ""}
        footer={<>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">日付</p><p className="text-sm text-text">{new Date(selected.disposalDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} kg</p></div>
            </div>
            <div className="p-3 bg-surface-tertiary rounded-lg space-y-2">
              <p className="text-xs font-medium text-text">処理情報</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-text-tertiary">処理方法</p><p className="text-text">{selected.disposalMethod ?? "—"}</p></div>
                <div><p className="text-xs text-text-tertiary">処理委託先</p><p className="text-text">{selected.contractor ?? "—"}</p></div>
                <div><p className="text-xs text-text-tertiary">処理費用</p><p className="text-text">{selected.disposalCost != null ? `${selected.disposalCost.toLocaleString()} 円` : "—"}</p></div>
              </div>
            </div>
            {selected.note && (
              <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selected.note}</p></div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
