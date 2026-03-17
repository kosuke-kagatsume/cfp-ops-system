"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { CheckCircle, XCircle, ArrowLeft, Clock, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
type ApprovalCategory = "ORDER" | "INVOICE" | "PAYMENT" | "EXPENSE" | "PRICE_CHANGE" | "OTHER_AC";

type ApprovalStepItem = {
  id: string;
  stepOrder: number;
  status: ApprovalStatus;
  comment: string | null;
  actionAt: string | null;
  approver: { id: string; name: string };
};

type ApprovalRequestItem = {
  id: string;
  requestNumber: string;
  category: ApprovalCategory;
  targetType: string;
  targetId: string;
  title: string;
  description: string | null;
  status: ApprovalStatus;
  createdAt: string;
  createdBy: string | null;
  steps: ApprovalStepItem[];
};

const statusLabel: Record<ApprovalStatus, string> = {
  PENDING: "承認待ち",
  APPROVED: "承認済",
  REJECTED: "却下",
  RETURNED: "差戻し",
};

const statusColors: Record<ApprovalStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  RETURNED: "bg-blue-50 text-blue-700",
};

const categoryLabel: Record<ApprovalCategory, string> = {
  ORDER: "手配",
  INVOICE: "請求書",
  PAYMENT: "支払",
  EXPENSE: "経費",
  PRICE_CHANGE: "単価変更",
  OTHER_AC: "その他",
};

const categoryColors: Record<ApprovalCategory, string> = {
  ORDER: "bg-blue-100 text-blue-800",
  INVOICE: "bg-purple-100 text-purple-800",
  PAYMENT: "bg-orange-100 text-orange-800",
  EXPENSE: "bg-pink-100 text-pink-800",
  PRICE_CHANGE: "bg-teal-100 text-teal-800",
  OTHER_AC: "bg-gray-100 text-gray-800",
};

type TabFilter = ApprovalStatus | "all";

const tabs: { label: string; filter: TabFilter }[] = [
  { label: "承認待ち", filter: "PENDING" },
  { label: "承認済", filter: "APPROVED" },
  { label: "却下", filter: "REJECTED" },
  { label: "すべて", filter: "all" },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("PENDING");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: approvalItems, isLoading, mutate } = useSWR<ApprovalRequestItem[]>(
    "/api/approvals",
    fetcher
  );

  const filtered = approvalItems?.filter((item) => {
    if (activeTab === "all") return true;
    return item.status === activeTab;
  }) ?? [];

  const pendingCount = approvalItems?.filter((i) => i.status === "PENDING").length ?? 0;
  const selected = approvalItems?.find((i) => i.id === showDetail);

  const getTabCount = (filter: TabFilter) => {
    if (!approvalItems) return 0;
    if (filter === "all") return approvalItems.length;
    return approvalItems.filter((i) => i.status === filter).length;
  };

  const handleAction = async (id: string, action: "approve" | "reject", stepId?: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, stepId }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast(action === "approve" ? "承認しました" : "却下しました", action === "approve" ? "success" : "warning");
    } catch { showToast("処理に失敗しました", "error"); }
  };

  const handleReturn = async (id: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETURNED" }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowDetail(null);
      mutate();
      showToast("差戻ししました", "warning");
    } catch { showToast("処理に失敗しました", "error"); }
  };

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
          {tabs.map((tab) => (
            <button key={tab.filter} onClick={() => setActiveTab(tab.filter)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.filter ? "border-primary-600 text-primary-700" : "border-transparent text-text-secondary hover:text-text"}`}>
              {tab.label}
              <span className="ml-1.5 text-xs bg-surface-tertiary px-1.5 py-0.5 rounded-full">{getTabCount(tab.filter)}</span>
            </button>
          ))}
        </div>

        {/* 承認リスト */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <button key={item.id} onClick={() => setShowDetail(item.id)}
                className="w-full bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors text-left">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[item.category]}`}>{categoryLabel[item.category]}</span>
                    <span className="text-sm font-medium text-text">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[item.status]}`}>{statusLabel[item.status]}</span>
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  </div>
                </div>
                {item.description && <p className="text-sm text-text-secondary mb-3">{item.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <span>申請番号: {item.requestNumber}</span>
                    <span>申請日: {new Date(item.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                  {/* 承認ステップインジケーター */}
                  <div className="flex items-center gap-1">
                    {item.steps.map((step, i) => (
                      <div key={step.id} className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          step.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                          step.status === "REJECTED" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {step.status === "APPROVED" ? "\u2713" : step.status === "REJECTED" ? "\u00d7" : "?"}
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
        )}
      </div>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `承認詳細` : ""}
        footer={<>
          {selected?.status === "PENDING" && <>
            <button onClick={() => selected && handleReturn(selected.id)} className="flex items-center gap-1 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"><ArrowLeft className="w-4 h-4" />差戻し</button>
            <button onClick={() => { const step = selected?.steps.find((s) => s.status === "PENDING"); selected && handleAction(selected.id, "reject", step?.id); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"><XCircle className="w-4 h-4" />却下</button>
            <button onClick={() => { const step = selected?.steps.find((s) => s.status === "PENDING"); selected && handleAction(selected.id, "approve", step?.id); }} className="flex items-center gap-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"><CheckCircle className="w-4 h-4" />承認</button>
          </>}
          {selected?.status !== "PENDING" && <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>}
        </>}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${categoryColors[selected.category]}`}>{categoryLabel[selected.category]}</span>
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{statusLabel[selected.status]}</span>
            </div>
            <div>
              <h3 className="text-base font-medium text-text">{selected.title}</h3>
              {selected.description && <p className="text-sm text-text-secondary mt-1">{selected.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">申請番号</p><p className="text-sm text-text">{selected.requestNumber}</p></div>
              <div><p className="text-xs text-text-tertiary">申請日</p><p className="text-sm text-text">{new Date(selected.createdAt).toLocaleDateString("ja-JP")}</p></div>
            </div>

            {/* 承認フロー */}
            <div className="p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs font-medium text-text mb-3">承認フロー</p>
              <div className="space-y-3">
                {selected.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                      step.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {step.status === "APPROVED" ? <CheckCircle className="w-4 h-4" /> : step.status === "REJECTED" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-text">Step {step.stepOrder}: {step.approver.name}</p>
                        <span className={`text-xs font-medium ${
                          step.status === "APPROVED" ? "text-emerald-600" : step.status === "REJECTED" ? "text-red-600" : "text-amber-600"
                        }`}>{statusLabel[step.status]}</span>
                      </div>
                      {step.actionAt && <p className="text-xs text-text-tertiary">{new Date(step.actionAt).toLocaleString("ja-JP")}</p>}
                      {step.comment && <p className="text-xs text-text-secondary mt-1">{step.comment}</p>}
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
