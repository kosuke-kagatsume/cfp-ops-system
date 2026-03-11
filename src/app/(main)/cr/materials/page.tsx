"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { crMaterials, crMaterialStatusColors, type CrMaterialStatus } from "@/lib/dummy-data-phase2";
import { Plus, Search, Eye, Shield, AlertTriangle } from "lucide-react";
import { useState } from "react";

const statusList: CrMaterialStatus[] = ["受入待ち", "検査中", "合格", "不合格"];

export default function CrMaterialsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = crMaterials.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.lotNumber.toLowerCase().includes(q) || m.supplier.includes(q) || m.product.includes(q);
    }
    return true;
  });

  const selected = crMaterials.find((m) => m.id === showDetail);

  return (
    <>
      <Header title="原料受入" />
      <div className="p-6 space-y-4">
        {/* ISCC認証バナー */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">ISCC PLUS認証管理</p>
            <p className="text-xs text-emerald-600">認証原料はSD番号とISCC番号を紐付けて管理。マスバランス方式で投入量を追跡します。</p>
          </div>
        </div>

        {/* ステータスカード */}
        <div className="grid grid-cols-4 gap-3">
          {statusList.map((status) => {
            const count = crMaterials.filter((m) => m.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button key={status} onClick={() => setStatusFilter(isActive ? "all" : status)}
                className={`p-3 rounded-xl border text-center transition-colors ${isActive ? "border-primary-400 bg-primary-50" : "border-border bg-surface hover:border-primary-200"}`}>
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-secondary">{status}</p>
              </button>
            );
          })}
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="ロット番号、仕入先で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {statusFilter !== "all" && <button onClick={() => setStatusFilter("all")} className="text-xs text-primary-600 hover:underline">フィルタ解除</button>}
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />原料受入登録
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ロット番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">受入日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">仕入先</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">原料</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">数量</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ISCC</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary-600">{m.lotNumber}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{m.receiveDate}</td>
                  <td className="px-4 py-3 text-sm text-text">{m.supplier}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{m.product}</td>
                  <td className="px-4 py-3 text-sm font-medium text-text text-right">{m.quantity.toLocaleString()} {m.unit}</td>
                  <td className="px-4 py-3 text-center">
                    {m.isIscCertified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                        <Shield className="w-3 h-3" />認証
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${crMaterialStatusColors[m.status]}`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetail(m.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {crMaterials.length}件</p>
          </div>
        </div>
      </div>

      {/* 登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="原料受入登録"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("原料受入を登録しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="仕入先" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "九州リサイクル株式会社" }, { value: "2", label: "広島産業廃棄物処理株式会社" },
          ]} /></FormField>
          <FormField label="原料名" required><FormSelect placeholder="選択" options={[
            { value: "1", label: "PP廃プラスチック" }, { value: "2", label: "PE混合廃プラ" }, { value: "3", label: "PS廃プラスチック" },
          ]} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量(kg)" required><FormInput type="number" placeholder="例: 8000" /></FormField>
            <FormField label="受入日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-text mb-3">ISCC認証情報（任意）</p>
            <div className="space-y-3">
              <FormField label="ISCC認証番号"><FormInput placeholder="例: ISCC-EU-123456" /></FormField>
              <FormField label="SD番号"><FormInput placeholder="例: CFP-000190-CA" /></FormField>
            </div>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `原料詳細: ${selected.lotNumber}` : ""}
        footer={<>
          {selected?.status === "受入待ち" && <button onClick={() => { setShowDetail(null); showToast("検査を開始しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">検査開始</button>}
          {selected?.status === "検査中" && <button onClick={() => { setShowDetail(null); showToast("合格判定しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">合格判定</button>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.lotNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${crMaterialStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">仕入先</p><p className="text-sm text-text">{selected.supplier}</p></div>
              <div><p className="text-xs text-text-tertiary">受入日</p><p className="text-sm text-text">{selected.receiveDate}</p></div>
              <div><p className="text-xs text-text-tertiary">原料</p><p className="text-sm text-text">{selected.product}</p></div>
              <div><p className="text-xs text-text-tertiary">数量</p><p className="text-sm font-medium text-text">{selected.quantity.toLocaleString()} {selected.unit}</p></div>
            </div>
            {selected.isIscCertified && (
              <div className="p-3 bg-emerald-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">ISCC PLUS認証原料</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-emerald-600">ISCC番号</p><p className="font-mono text-emerald-800">{selected.isccNumber}</p></div>
                  <div><p className="text-xs text-emerald-600">SD番号</p><p className="font-mono text-emerald-800">{selected.sdNumber}</p></div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
