"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { tanks, tankTypeColors, type TankType } from "@/lib/dummy-data-phase2";
import { Eye, AlertTriangle, Droplets } from "lucide-react";
import { useState } from "react";

const tankTypes: TankType[] = ["軽質油", "重質油", "混合油", "残渣"];

export default function CrTanksPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = tanks.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  const selected = tanks.find((t) => t.id === showDetail);

  // 総容量サマリ
  const totalCapacity = tanks.reduce((sum, t) => sum + t.capacityKl, 0);
  const totalCurrent = tanks.reduce((sum, t) => sum + t.currentKl, 0);

  return (
    <>
      <Header title="タンク管理" />
      <div className="p-6 space-y-4">
        {/* サマリカード */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">総タンク数</p>
            <p className="text-2xl font-bold text-text">{tanks.length}基</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">総容量</p>
            <p className="text-2xl font-bold text-text">{totalCapacity} kL</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">現在保有量</p>
            <p className="text-2xl font-bold text-text">{totalCurrent.toFixed(1)} kL</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">平均充填率</p>
            <p className="text-2xl font-bold text-text">{Math.round((totalCurrent / totalCapacity) * 100)}%</p>
          </div>
        </div>

        {/* 油種フィルタ */}
        <div className="flex items-center gap-2">
          <button onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${typeFilter === "all" ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
            すべて
          </button>
          {tankTypes.map((type) => (
            <button key={type} onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${typeFilter === type ? "bg-primary-100 text-primary-700 font-medium" : "text-text-secondary hover:bg-surface-tertiary"}`}>
              {type}
            </button>
          ))}
        </div>

        {/* タンクカード */}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((t) => {
            const isHigh = t.percentage >= 80;
            const isLow = t.percentage <= 20;
            return (
              <button key={t.id} onClick={() => setShowDetail(t.id)}
                className="bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-text-tertiary" />
                    <span className="text-sm font-medium text-text">{t.name}</span>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${tankTypeColors[t.type]}`}>{t.type}</span>
                </div>

                <p className="text-xs text-text-tertiary mb-1">{t.plant} / {t.code}</p>

                {/* タンクゲージ */}
                <div className="mt-3 space-y-2">
                  <div className="relative h-32 w-full bg-surface-tertiary rounded-lg overflow-hidden border border-border">
                    <div
                      className={`absolute bottom-0 left-0 right-0 transition-all ${
                        isHigh ? "bg-red-200" : isLow ? "bg-amber-200" : "bg-blue-200"
                      }`}
                      style={{ height: `${t.percentage}%` }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-text">{t.percentage}%</p>
                      <p className="text-xs text-text-secondary">{t.currentKl} / {t.capacityKl} kL</p>
                    </div>
                  </div>
                  {(isHigh || isLow) && (
                    <div className={`flex items-center gap-1 text-xs ${isHigh ? "text-red-600" : "text-amber-600"}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {isHigh ? "容量上限に注意" : "在庫残少"}
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-text-tertiary">質量: </span><span className="font-medium text-text">{t.currentKg.toLocaleString()} kg</span></div>
                  <div><span className="text-text-tertiary">比重: </span><span className="font-medium text-text">{t.specificGravity}</span></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 換算説明 */}
        <div className="bg-surface-secondary rounded-xl p-4">
          <p className="text-xs text-text-tertiary">※ 質量(kg) = 体積(kL) × 比重 × 1000 で自動換算。比重は油種・温度により変動します。</p>
        </div>
      </div>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `タンク詳細: ${selected.code} ${selected.name}` : ""}
        footer={<>
          <button onClick={() => { showToast("在庫補正（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">在庫補正</button>
          <button onClick={() => { showToast("タンク移送（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">タンク間移送</button>
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-medium">{selected.code}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${tankTypeColors[selected.type]}`}>{selected.type}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">タンク名</p><p className="text-sm text-text">{selected.name}</p></div>
              <div><p className="text-xs text-text-tertiary">工場</p><p className="text-sm text-text">{selected.plant}</p></div>
            </div>
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-3">容量情報</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-text-tertiary">タンク容量</p><p className="text-sm font-bold text-text">{selected.capacityKl} kL</p></div>
                <div><p className="text-xs text-text-tertiary">現在量（体積）</p><p className="text-sm font-bold text-text">{selected.currentKl} kL</p></div>
                <div><p className="text-xs text-text-tertiary">現在量（質量）</p><p className="text-sm font-bold text-text">{selected.currentKg.toLocaleString()} kg</p></div>
                <div><p className="text-xs text-text-tertiary">比重</p><p className="text-sm font-bold text-text">{selected.specificGravity}</p></div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                  <span>充填率</span><span>{selected.percentage}%</span>
                </div>
                <div className="h-3 bg-surface rounded-full">
                  <div className={`h-3 rounded-full ${selected.percentage >= 80 ? "bg-red-400" : selected.percentage <= 20 ? "bg-amber-400" : "bg-primary-500"}`} style={{ width: `${selected.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
