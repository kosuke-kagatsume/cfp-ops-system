"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, Eye, AlertTriangle, Camera, FileText, Shield, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ExpenseStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";

const statusLabel: Record<ExpenseStatus, string> = {
  DRAFT: "下書き",
  SUBMITTED: "申請中",
  APPROVED: "承認済",
  REJECTED: "却下",
  PAID: "精算済",
};

const statusColors: Record<ExpenseStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  PAID: "bg-blue-50 text-blue-700",
};

type ExpenseItemData = {
  id: string;
  description: string;
  category: string | null;
  amount: number;
  receiptPath: string | null;
  note: string | null;
};

type ExpenseData = {
  id: string;
  expenseNumber: string;
  applicant: string;
  department: string | null;
  expenseDate: string;
  totalAmount: number;
  status: ExpenseStatus;
  note: string | null;
  createdAt: string;
  items: ExpenseItemData[];
};

export default function ExpensesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data: expenses, isLoading } = useSWR<ExpenseData[]>(
    `/api/expenses?${params.toString()}`,
    fetcher
  );

  const allExpenses = expenses ?? [];
  const selected = allExpenses.find((e) => e.id === showDetail);
  const requiresApproval = (e: ExpenseData) => e.totalAmount >= 30000;

  if (isLoading) {
    return (
      <>
        <Header title="経費管理" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="経費管理" />
      <div className="p-6 space-y-4">
        {/* 電帳法バナー */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">電子帳簿保存法対応</p>
            <p className="text-xs text-blue-600">領収書はタイムスタンプ付きで電子保存。3万円以上の経費は社長承認が必要です。</p>
          </div>
        </div>

        {/* サマリ */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">当月合計</p>
            <p className="text-xl font-bold text-text">¥{allExpenses.reduce((s, e) => s + e.totalAmount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">申請中</p>
            <p className="text-xl font-bold text-amber-600">{allExpenses.filter((e) => e.status === "SUBMITTED").length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">承認済</p>
            <p className="text-xl font-bold text-emerald-600">{allExpenses.filter((e) => e.status === "APPROVED" || e.status === "PAID").length}件</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary">要承認（3万超）</p>
            <p className="text-xl font-bold text-text">{allExpenses.filter((e) => requiresApproval(e)).length}件</p>
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="経費番号、件名で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">全ステータス</option>
              <option value="SUBMITTED">申請中</option>
              <option value="APPROVED">承認済</option>
              <option value="PAID">精算済</option>
              <option value="REJECTED">却下</option>
            </select>
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />経費申請
          </button>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">番号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">件名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">申請者</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">申請日</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase">金額</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">領収書</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {allExpenses.map((e) => {
                const hasReceipts = e.items.some((item) => item.receiptPath);
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                    <td className="px-4 py-3 text-sm font-mono text-primary-600">{e.expenseNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text">{e.note ?? e.expenseNumber}</p>
                      {requiresApproval(e) && <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />3万円以上・要承認</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{e.applicant}<br /><span className="text-xs text-text-tertiary">{e.department ?? ""}</span></td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(e.expenseDate).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text text-right">¥{e.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {hasReceipts ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Camera className="w-3 h-3" />あり</span>
                      ) : <span className="text-xs text-text-tertiary">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[e.status]}`}>{statusLabel[e.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setShowDetail(e.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors"><Eye className="w-4 h-4 text-text-tertiary" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 申請モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="経費申請"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("経費を申請しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">申請する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="件名" required><FormInput placeholder="例: 大阪出張 3/15" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="区分" required><FormSelect placeholder="選択" options={[
              { value: "1", label: "交通費" }, { value: "2", label: "宿泊費" }, { value: "3", label: "接待費" },
              { value: "4", label: "事務用品" }, { value: "5", label: "消耗品" }, { value: "6", label: "修繕費" },
            ]} /></FormField>
            <FormField label="金額(円)" required><FormInput type="number" placeholder="例: 35000" /></FormField>
          </div>
          <FormField label="申請日" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          <FormField label="備考"><FormInput placeholder="例: 顧客訪問のため" /></FormField>
          <div className="border-t border-border pt-4">
            <button onClick={() => showToast("領収書OCR（開発中）", "info")} className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-border rounded-lg text-text-secondary hover:bg-surface-tertiary w-full justify-center">
              <Camera className="w-4 h-4" />領収書をアップロード（OCR自動読取）
            </button>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={selected ? `経費詳細: ${selected.expenseNumber}` : ""}
        footer={<>
          {selected?.status === "SUBMITTED" && requiresApproval(selected) && <>
            <button onClick={() => { setShowDetail(null); showToast("却下しました（モック）", "warning"); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">却下</button>
            <button onClick={() => { setShowDetail(null); showToast("承認しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">承認</button>
          </>}
          <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">{selected.note ?? selected.expenseNumber}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selected.status]}`}>{statusLabel[selected.status]}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">申請者</p><p className="text-sm text-text">{selected.applicant}{selected.department ? `（${selected.department}）` : ""}</p></div>
              <div><p className="text-xs text-text-tertiary">申請日</p><p className="text-sm text-text">{new Date(selected.expenseDate).toLocaleDateString("ja-JP")}</p></div>
            </div>
            {/* 明細 */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-3 py-2 text-xs text-text-secondary">項目</th>
                    <th className="text-left px-3 py-2 text-xs text-text-secondary">区分</th>
                    <th className="text-right px-3 py-2 text-xs text-text-secondary">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-text">{item.description}</td>
                      <td className="px-3 py-2 text-text-secondary">{item.category ?? "-"}</td>
                      <td className="px-3 py-2 text-right font-medium text-text">¥{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-secondary">
                    <td colSpan={2} className="px-3 py-2 text-xs font-medium text-text">合計</td>
                    <td className="px-3 py-2 text-right font-bold text-text">¥{selected.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* 電帳法情報 */}
            <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs text-blue-600">電子帳簿保存法タイムスタンプ</p>
                <p className="text-xs font-mono text-blue-800">{new Date(selected.createdAt).toLocaleString("ja-JP")}</p>
              </div>
            </div>
            {requiresApproval(selected) && (
              <div className="p-3 bg-amber-50 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">3万円以上のため社長承認が必要です</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
