"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { approvalItems, approvalStatusColors, approvalCategoryColors, type ApprovalStatus } from "@/lib/dummy-data-phase3";
import { CheckCircle, XCircle, ArrowLeft, Clock, ChevronRight, Filter } from "lucide-react";
import { useState } from "react";

const tabs: { label: string; filter: ApprovalStatus | "all" }[] = [
  { label: "承認待ち", filter: "承認待ち" },
  { label: "承認済", filter: "承認済" },
  { label: "却下", filter: "却下" },
  { label: "すべて", filter: "all" },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<ApprovalStatus | "all">("承認待ち");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = approvalItems.filter((item) => {
    if (activeTab === "all") return true;
    return item.status === activeTab;
  });

  const pendingCount = approvalItems.filter((i) => i.status === "承認待ち").length;
  const selected = approvalItems.find((i) => i.id === showDetail);

  return (
    <>
      <Header title="承認管理" />
      <div className="p-6 space-y-4">
        {/* 承認待ちサマリ */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">承認待ちの案件があります</p>
              <p className="text-xs text-amber-600">お金が動く全ての取引は社長承認が必要です</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-700">{pendingCount}件</span>
        </div>

        {/* タブ */}
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((tab) => {
            const count = tab.filter === "all" ? approvalItems.length : approvalItems.filter((i) => i.status === tab.filter).length;
            return (
              <button key={tab.filter} onClick={() => setActiveTab(tab.filter)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.filter ? "border-primary-600 text-primary-700" : "border-transparent text-text-secondary hover:text-text"}`}>
                {tab.label}
                <span className="ml-1.5 text-xs bg-surface-tertiary px-1.5 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>

        {/* 承認リスト */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <button key={item.id} onClick={() => setShowDetail(item.id)}
              className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${approvalCategoryColors[item.category]}`}>{item.category}</span>
                  <span className="text-sm font-medium text-text">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${approvalStatusColors[item.status]}`}>{item.status}</span>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-3">{item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                  <span>申請者: {item.applicant}（{item.applicantRole}）</span>
                  <span>申請日: {item.date}</span>
                  {item.amount && <span className="font-medium text-text">¥{item.amount.toLocaleString()}</span>}
                </div>
                {/* 承認ステップインジケーター */}
                <div className="flex items-center gap-1">
                  {item.steps.map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        step.status === "承認済" ? "bg-emerald-100 text-emerald-700" :
                        step.status === "却下" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {step.status === "承認済" ? "✓" : step.status === "却下" ? "×" : "?"}
                      </div>
                      {i < item.steps.length - 1 && <div className="w-3 h-0.5 bg-border" />}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">該当する案件はありません</p>
            </div>
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `承認詳細` : ""}
        footer={<>
          {selected?.status === "承認待ち" && <>
            <button onClick={() => { setShowDetail(null); showToast("差戻ししました（モック）", "warning"); }} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><ArrowLeft className="w-4 h-4" />差戻し</button>
            <button onClick={() => { setShowDetail(null); showToast("却下しました（モック）", "warning"); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"><XCircle className="w-4 h-4" />却下</button>
            <button onClick={() => { setShowDetail(null); showToast("承認しました（モック）", "success"); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"><CheckCircle className="w-4 h-4" />承認</button>
          </>}
          {selected?.status !== "承認待ち" && <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>}
        </>}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${approvalCategoryColors[selected.category]}`}>{selected.category}</span>
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${approvalStatusColors[selected.status]}`}>{selected.status}</span>
            </div>
            <div>
              <h3 className="text-base font-medium text-text">{selected.title}</h3>
              <p className="text-sm text-text-secondary mt-1">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">申請者</p><p className="text-sm text-text">{selected.applicant}（{selected.applicantRole}）</p></div>
              <div><p className="text-xs text-text-tertiary">申請日</p><p className="text-sm text-text">{selected.date}</p></div>
              {selected.amount && <div><p className="text-xs text-text-tertiary">金額</p><p className="text-sm font-bold text-text">¥{selected.amount.toLocaleString()}</p></div>}
            </div>

            {/* 承認フロー */}
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-3">承認フロー</p>
              <div className="space-y-3">
                {selected.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.status === "承認済" ? "bg-emerald-100 text-emerald-700" :
                      step.status === "却下" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {step.status === "承認済" ? <CheckCircle className="w-4 h-4" /> : step.status === "却下" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-text">{step.role}: {step.user}</p>
                        <span className={`text-xs font-medium ${
                          step.status === "承認済" ? "text-emerald-600" : step.status === "却下" ? "text-red-600" : "text-amber-600"
                        }`}>{step.status}</span>
                      </div>
                      {step.date && <p className="text-xs text-text-tertiary">{step.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
