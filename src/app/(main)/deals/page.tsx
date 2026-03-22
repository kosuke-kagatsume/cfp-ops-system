"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { DivisionBadge } from "@/components/division-badge";
import { RecordComments } from "@/components/record-comments";
import { DivisionFilter } from "@/components/division-filter";
import { useToast } from "@/components/toast";
import {
  Plus, Loader2, Search, LayoutGrid, List, Phone, Mail,
  Users, StickyNote, ArrowRight, Pencil, Trash2,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

type DealActivity = {
  id: string;
  activityType: string;
  description: string;
  activityDate: string;
  createdAt: string;
};

type Deal = {
  id: string;
  dealNumber: string;
  title: string;
  stage: string;
  partnerId: string | null;
  partner: { id: string; code: string; name: string } | null;
  division: string | null;
  expectedAmount: number | null;
  probability: number | null;
  startDate: string;
  expectedCloseDate: string | null;
  closedDate: string | null;
  ndaDate: string | null;
  lostReason: string | null;
  note: string | null;
  assignee: string | null;
  businessCardId: string | null;
  activities: DealActivity[];
};

type PartnerOption = { id: string; code: string; name: string };

const stages = [
  { value: "LEAD", label: "リード", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "NDA", label: "NDA", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "NEGOTIATION", label: "商談中", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  { value: "PROPOSAL", label: "提案", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "CONTRACT", label: "契約交渉", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "WON", label: "成約", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
];

const lostStage = { value: "LOST", label: "失注", color: "bg-red-100 text-red-700 border-red-300" };

const allStages = [...stages, lostStage];

const stageMap = Object.fromEntries(allStages.map((s) => [s.value, s]));

const activityTypes = [
  { value: "CALL", label: "電話", icon: Phone },
  { value: "EMAIL", label: "メール", icon: Mail },
  { value: "MEETING", label: "面談", icon: Users },
  { value: "NOTE", label: "メモ", icon: StickyNote },
];

const activityTypeMap = Object.fromEntries(activityTypes.map((a) => [a.value, a]));

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [newActivityForm, setNewActivityForm] = useState({ activityType: "CALL", description: "" });
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (divisionFilter !== "all") params.set("division", divisionFilter);
  if (stageFilter !== "all") params.set("stage", stageFilter);

  const { data: deals, isLoading, mutate } = useSWR<Deal[]>(
    `/api/deals?${params.toString()}`,
    fetcher
  );

  const { data: partners } = useSWR<PartnerOption[]>(
    showNewModal ? "/api/masters/partners" : null,
    fetcher
  );

  const allDeals = deals ?? [];

  const [newForm, setNewForm] = useState({
    title: "", partnerId: "", division: "", expectedAmount: "",
    probability: "", assignee: "", note: "",
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newForm.title,
          partnerId: newForm.partnerId || undefined,
          division: newForm.division || undefined,
          expectedAmount: newForm.expectedAmount ? parseFloat(newForm.expectedAmount) : undefined,
          probability: newForm.probability ? parseInt(newForm.probability) : undefined,
          assignee: newForm.assignee || undefined,
          note: newForm.note || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ title: "", partnerId: "", division: "", expectedAmount: "", probability: "", assignee: "", note: "" });
      mutate();
      showToast("案件を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const handleStageChange = async (deal: Deal, newStage: string) => {
    try {
      const body: Record<string, unknown> = { stage: newStage };
      if (newStage === "LOST") {
        const reason = prompt("失注理由を入力してください:");
        if (reason === null) return;
        body.lostReason = reason;
      }
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
      showToast("ステージを更新しました", "success");
      // Refresh detail if open
      if (selectedDeal?.id === deal.id) {
        const updated = await res.json();
        setSelectedDeal(updated);
      }
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleAddActivity = async () => {
    if (!selectedDeal || !newActivityForm.description) return;
    try {
      const res = await fetch(`/api/deals/${selectedDeal.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivityForm),
      });
      if (!res.ok) throw new Error("Failed");
      setNewActivityForm({ activityType: "CALL", description: "" });
      // Refresh deal detail
      const dealRes = await fetch(`/api/deals/${selectedDeal.id}`);
      const updated = await dealRes.json();
      setSelectedDeal(updated);
      mutate();
      showToast("活動を記録しました", "success");
    } catch {
      showToast("記録に失敗しました", "error");
    }
  };

  const handleDelete = async (deal: Deal) => {
    if (!confirm(`「${deal.title}」を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetailModal(false);
      mutate();
      showToast("案件を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  const openDetail = async (deal: Deal) => {
    const res = await fetch(`/api/deals/${deal.id}`);
    const full = await res.json();
    setSelectedDeal(full);
    setShowDetailModal(true);
  };

  const divisionCounts = {
    MR: allDeals.filter((d) => d.division === "MR").length,
    CR: allDeals.filter((d) => d.division === "CR").length,
  };

  return (
    <>
      <Header title="案件管理" />
      <div className="p-4 md:p-6 space-y-4">
        {/* ツールバー */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text" placeholder="案件名、取引先で検索..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-secondary rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2 rounded-md transition-colors ${viewMode === "kanban" ? "bg-surface shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
                title="カンバン"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-surface shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
                title="リスト"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />案件登録
            </button>
            </div>
          </div>
          <DivisionFilter value={divisionFilter} onChange={setDivisionFilter} counts={divisionCounts} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : viewMode === "kanban" ? (
          /* カンバン表示 */
          <div className="pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {stages.map((stage) => {
                const stageDeals = allDeals.filter((d) => d.stage === stage.value);
                const totalAmount = stageDeals.reduce((sum, d) => sum + (d.expectedAmount ?? 0), 0);
                return (
                  <div key={stage.value} className="min-w-0">
                    <div className={`px-2 py-1.5 rounded-t-lg border ${stage.color} flex items-center justify-between`}>
                      <span className="text-xs font-medium truncate">{stage.label}</span>
                      <span className="text-[10px] shrink-0 ml-1">{stageDeals.length}件</span>
                    </div>
                    {totalAmount > 0 && (
                      <div className="px-2 py-1 text-[10px] text-text-secondary bg-surface-secondary border-x border-border truncate">
                        ¥{totalAmount.toLocaleString()}
                      </div>
                    )}
                    <div className="space-y-1.5 p-1.5 bg-surface-secondary/50 border-x border-b border-border rounded-b-lg min-h-[80px]">
                      {stageDeals.map((deal) => (
                        <button
                          key={deal.id}
                          onClick={() => openDetail(deal)}
                          className="w-full p-2 bg-surface rounded-lg border border-border hover:border-primary-300 hover:shadow-sm transition-all text-left"
                        >
                          <div className="flex items-center gap-1 justify-between">
                            <p className="text-xs font-medium text-text truncate">{deal.title}</p>
                            {deal.division && <DivisionBadge division={deal.division} />}
                          </div>
                          {deal.partner && (
                            <p className="text-[10px] text-text-secondary mt-0.5 truncate">{deal.partner.name}</p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            {deal.expectedAmount ? (
                              <span className="text-[10px] font-medium text-text">¥{deal.expectedAmount.toLocaleString()}</span>
                            ) : <span />}
                            {deal.assignee && (
                              <span className="text-[10px] text-text-tertiary truncate ml-1">{deal.assignee}</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {stageDeals.length === 0 && (
                        <p className="text-[10px] text-text-tertiary text-center py-3">案件なし</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 失注セクション */}
            {(() => {
              const lostDeals = allDeals.filter((d) => d.stage === "LOST");
              if (lostDeals.length === 0) return null;
              return (
                <div className="mt-4">
                  <div className={`px-3 py-2 rounded-t-lg border ${lostStage.color} flex items-center justify-between`}>
                    <span className="text-sm font-medium">{lostStage.label}</span>
                    <span className="text-xs">{lostDeals.length}件</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2 bg-red-50/30 border-x border-b border-red-200 rounded-b-lg">
                    {lostDeals.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => openDetail(deal)}
                        className="p-3 bg-surface rounded-lg border border-border hover:border-red-300 text-left"
                      >
                        <p className="text-sm text-text truncate">{deal.title}</p>
                        <p className="text-xs text-text-tertiary mt-1">{deal.lostReason ?? "-"}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* リスト表示 */
          <div className="bg-surface rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">案件番号</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">案件名</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">取引先</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary">区分</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary">ステージ</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">見込金額</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">担当</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">開始日</th>
                </tr>
              </thead>
              <tbody>
                {allDeals.map((deal) => {
                  const stage = stageMap[deal.stage] ?? stageMap.LEAD;
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => openDetail(deal)}
                      className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-primary-600">{deal.dealNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text">{deal.title}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{deal.partner?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {deal.division ? <DivisionBadge division={deal.division} /> : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${stage.color}`}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text text-right">
                        {deal.expectedAmount ? `¥${deal.expectedAmount.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{deal.assignee ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {new Date(deal.startDate).toLocaleDateString("ja-JP")}
                      </td>
                    </tr>
                  );
                })}
                {allDeals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">
                      案件データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新規登録モーダル */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="案件登録"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">登録する</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="案件名" required>
            <FormInput placeholder="例: A社 再生原料取引" value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="取引先">
              <FormSelect
                placeholder="選択"
                value={newForm.partnerId}
                onChange={(e) => setNewForm({ ...newForm, partnerId: e.target.value })}
                options={(partners ?? []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))}
              />
            </FormField>
            <FormField label="区分">
              <FormSelect
                placeholder="選択"
                value={newForm.division}
                onChange={(e) => setNewForm({ ...newForm, division: e.target.value })}
                options={[{ value: "MR", label: "MR" }, { value: "CR", label: "CR" }]}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="見込金額">
              <FormInput type="number" placeholder="円" value={newForm.expectedAmount} onChange={(e) => setNewForm({ ...newForm, expectedAmount: e.target.value })} />
            </FormField>
            <FormField label="受注確率(%)">
              <FormInput type="number" placeholder="0-100" value={newForm.probability} onChange={(e) => setNewForm({ ...newForm, probability: e.target.value })} />
            </FormField>
          </div>
          <FormField label="担当者">
            <FormInput placeholder="担当者名" value={newForm.assignee} onChange={(e) => setNewForm({ ...newForm, assignee: e.target.value })} />
          </FormField>
          <FormField label="備考">
            <FormInput placeholder="備考" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedDeal ? `${selectedDeal.dealNumber} - ${selectedDeal.title}` : ""}
        footer={
          selectedDeal && (
            <>
              <button onClick={() => handleDelete(selectedDeal)} className="flex items-center gap-1 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />削除
              </button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
            </>
          )
        }
      >
        {selectedDeal && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* ステージ & バッジ */}
            <div className="flex items-center gap-3">
              {selectedDeal.division && <DivisionBadge division={selectedDeal.division} />}
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${stageMap[selectedDeal.stage]?.color ?? ""}`}>
                {stageMap[selectedDeal.stage]?.label ?? selectedDeal.stage}
              </span>
            </div>

            {/* ステージ変更 */}
            <div>
              <p className="text-xs text-text-tertiary mb-2">ステージ変更</p>
              <div className="flex flex-wrap gap-1.5">
                {allStages.map((s) => (
                  <button
                    key={s.value}
                    disabled={s.value === selectedDeal.stage}
                    onClick={() => handleStageChange(selectedDeal, s.value)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      s.value === selectedDeal.stage
                        ? `${s.color} font-bold`
                        : "border-border text-text-secondary hover:border-primary-300"
                    }`}
                  >
                    {s.value !== selectedDeal.stage && <ArrowRight className="w-3 h-3 inline mr-0.5" />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 案件情報 */}
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-text-tertiary">取引先</p><p className="text-sm text-text">{selectedDeal.partner?.name ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">担当者</p><p className="text-sm text-text">{selectedDeal.assignee ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">見込金額</p><p className="text-sm text-text">{selectedDeal.expectedAmount ? `¥${selectedDeal.expectedAmount.toLocaleString()}` : "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">受注確率</p><p className="text-sm text-text">{selectedDeal.probability != null ? `${selectedDeal.probability}%` : "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">開始日</p><p className="text-sm text-text">{new Date(selectedDeal.startDate).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">予定完了日</p><p className="text-sm text-text">{selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString("ja-JP") : "-"}</p></div>
              {selectedDeal.ndaDate && (
                <div><p className="text-xs text-text-tertiary">NDA締結日</p><p className="text-sm text-text">{new Date(selectedDeal.ndaDate).toLocaleDateString("ja-JP")}</p></div>
              )}
              {selectedDeal.lostReason && (
                <div className="col-span-2"><p className="text-xs text-text-tertiary">失注理由</p><p className="text-sm text-red-600">{selectedDeal.lostReason}</p></div>
              )}
            </div>
            {selectedDeal.note && (
              <div><p className="text-xs text-text-tertiary">備考</p><p className="text-sm text-text">{selectedDeal.note}</p></div>
            )}

            {/* アクティビティ追加 */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-text mb-2">活動記録</p>
              <div className="flex gap-2">
                <select
                  value={newActivityForm.activityType}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, activityType: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-border rounded-lg bg-surface"
                >
                  {activityTypes.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="内容を入力..."
                  value={newActivityForm.description}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, description: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddActivity(); }}
                />
                <button
                  onClick={handleAddActivity}
                  disabled={!newActivityForm.description}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  追加
                </button>
              </div>
            </div>

            {/* アクティビティタイムライン */}
            {selectedDeal.activities && selectedDeal.activities.length > 0 && (
              <div className="space-y-2">
                {selectedDeal.activities.map((act) => {
                  const typeInfo = activityTypeMap[act.activityType];
                  const Icon = typeInfo?.icon ?? StickyNote;
                  const isStageChange = act.activityType === "STAGE_CHANGE";
                  return (
                    <div key={act.id} className={`flex items-start gap-3 p-2 rounded-lg ${isStageChange ? "bg-amber-50" : "bg-surface-secondary"}`}>
                      <div className={`p-1.5 rounded-full ${isStageChange ? "bg-amber-200" : "bg-surface-tertiary"}`}>
                        {isStageChange ? <ArrowRight className="w-3.5 h-3.5 text-amber-700" /> : <Icon className="w-3.5 h-3.5 text-text-tertiary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text">{act.description}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {isStageChange ? "ステージ変更" : typeInfo?.label ?? act.activityType}
                          {" ・ "}
                          {new Date(act.activityDate).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedDeal && <RecordComments targetType="Deal" targetId={selectedDeal.id} />}
          </div>
        )}
      </Modal>
    </>
  );
}
