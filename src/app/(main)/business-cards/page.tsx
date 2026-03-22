"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { RecordComments } from "@/components/record-comments";
import { useToast } from "@/components/toast";
import {
  Plus, Upload, Loader2, Search, ArrowRightLeft,
  Pencil, Trash2, Eye, Handshake,
} from "lucide-react";
import { useState, useRef } from "react";

type BusinessCard = {
  id: string;
  companyName: string | null;
  department: string | null;
  position: string | null;
  personName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  address: string | null;
  website: string | null;
  imageUrl: string | null;
  note: string | null;
  partnerId: string | null;
  contactId: string | null;
  status: string;
  createdAt: string;
  partner: { id: string; code: string; name: string } | null;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: "新規", color: "bg-blue-100 text-blue-700" },
  CONTACTED: { label: "連絡済", color: "bg-yellow-100 text-yellow-700" },
  CONVERTED: { label: "顧客変換済", color: "bg-green-100 text-green-700" },
  ARCHIVED: { label: "アーカイブ", color: "bg-gray-100 text-gray-600" },
};

export default function BusinessCardsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter) queryParams.set("status", statusFilter);

  const { items, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<BusinessCard>(
    `/api/business-cards?${queryParams.toString()}`
  );

  const cards = items ?? [];

  // OCRアップロード
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/business-cards", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setShowOcrModal(false);
      setSelectedCard(data);
      setShowEditModal(true);
      mutate();
      showToast("名刺をOCR読み取りしました", "success");
    } catch {
      showToast("アップロードに失敗しました", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // 手動保存（編集）
  const handleSave = async () => {
    if (!selectedCard) return;
    try {
      const res = await fetch(`/api/business-cards/${selectedCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: selectedCard.companyName,
          department: selectedCard.department,
          position: selectedCard.position,
          personName: selectedCard.personName,
          email: selectedCard.email,
          phone: selectedCard.phone,
          mobile: selectedCard.mobile,
          fax: selectedCard.fax,
          address: selectedCard.address,
          website: selectedCard.website,
          note: selectedCard.note,
          status: selectedCard.status,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("保存しました", "success");
    } catch {
      showToast("保存に失敗しました", "error");
    }
  };

  // 顧客変換
  const handleConvert = async (card: BusinessCard) => {
    if (!confirm(`${card.personName} を取引先に変換しますか？`)) return;
    setIsConverting(true);
    try {
      const res = await fetch(`/api/business-cards/${card.id}/convert`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      setShowDetailModal(false);
      mutate();
      showToast("取引先に変換しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "変換に失敗しました", "error");
    } finally {
      setIsConverting(false);
    }
  };

  // 削除
  const handleDelete = async (card: BusinessCard) => {
    if (!confirm(`${card.personName} の名刺を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/business-cards/${card.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setShowDetailModal(false);
      mutate();
      showToast("削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  // 案件化
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const handleCreateDeal = async (card: BusinessCard) => {
    if (!confirm(`${card.personName} の名刺から案件を作成しますか？`)) return;
    setIsCreatingDeal(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${card.companyName ?? card.personName} 案件`,
          partnerId: card.partnerId || undefined,
          businessCardId: card.id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      // Update card status to CONTACTED
      await fetch(`/api/business-cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONTACTED" }),
      });
      setShowDetailModal(false);
      mutate();
      showToast("案件を作成しました", "success");
    } catch {
      showToast("案件作成に失敗しました", "error");
    } finally {
      setIsCreatingDeal(false);
    }
  };

  const updateField = (field: string, value: string) => {
    if (!selectedCard) return;
    setSelectedCard({ ...selectedCard, [field]: value || null });
  };

  return (
    <>
      <Header title="名刺管理" />
      <div className="p-4 md:p-6 space-y-4">
        {/* ツールバー */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="会社名・氏名で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface"
            >
              <option value="">全ステータス</option>
              <option value="NEW">新規</option>
              <option value="CONTACTED">連絡済</option>
              <option value="CONVERTED">顧客変換済</option>
              <option value="ARCHIVED">アーカイブ</option>
            </select>
          </div>
          <button
            onClick={() => setShowOcrModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Upload className="w-4 h-4" />名刺登録
          </button>
        </div>

        {/* テーブル */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">会社名</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">氏名</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden md:table-cell">役職</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden lg:table-cell">メール</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden lg:table-cell">電話</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">ステータス</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden md:table-cell">登録日</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cards.map((card) => {
                  const st = statusLabels[card.status] ?? statusLabels.NEW;
                  return (
                    <tr key={card.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-text">{card.companyName ?? "-"}</td>
                      <td className="px-4 py-3 font-medium text-text">{card.personName}</td>
                      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{card.position ?? "-"}</td>
                      <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">{card.email ?? "-"}</td>
                      <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">{card.phone ?? card.mobile ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                        {new Date(card.createdAt).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedCard(card); setShowDetailModal(true); }}
                            className="p-1.5 hover:bg-surface-tertiary rounded"
                            title="詳細"
                          >
                            <Eye className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button
                            onClick={() => { setSelectedCard(card); setShowEditModal(true); }}
                            className="p-1.5 hover:bg-surface-tertiary rounded"
                            title="編集"
                          >
                            <Pencil className="w-4 h-4 text-text-secondary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {cards.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-text-tertiary">
                      名刺データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination total={total} page={page} limit={limit} onPageChange={onPageChange} />
      </div>

      {/* OCR登録モーダル */}
      <Modal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        title="名刺登録（OCR）"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            名刺の写真をアップロードすると、AIが自動で情報を読み取ります。
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-border rounded-xl hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="text-sm text-text-secondary">OCR解析中...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-text-tertiary" />
                  <span className="text-sm text-text-secondary">画像をアップロード（カメラ / ファイル）</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="名刺詳細"
        footer={
          selectedCard && (
            <>
              {selectedCard.status !== "CONVERTED" && (
                <>
                  <button
                    onClick={() => handleCreateDeal(selectedCard)}
                    disabled={isCreatingDeal}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Handshake className="w-4 h-4" />
                    {isCreatingDeal ? "作成中..." : "案件化"}
                  </button>
                  <button
                    onClick={() => handleConvert(selectedCard)}
                    disabled={isConverting}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    {isConverting ? "変換中..." : "取引先に変換"}
                  </button>
                </>
              )}
              <button
                onClick={() => { setShowDetailModal(false); setSelectedCard(selectedCard); setShowEditModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary"
              >
                <Pencil className="w-4 h-4" />編集
              </button>
              <button
                onClick={() => handleDelete(selectedCard)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />削除
              </button>
            </>
          )
        }
      >
        {selectedCard && (
          <div className="space-y-3">
            {selectedCard.imageUrl && !selectedCard.imageUrl.startsWith("data:") ? null : selectedCard.imageUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedCard.imageUrl} alt="名刺画像" className="max-h-48 rounded-lg border border-border" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="会社名" value={selectedCard.companyName} />
              <DetailItem label="部署" value={selectedCard.department} />
              <DetailItem label="役職" value={selectedCard.position} />
              <DetailItem label="氏名" value={selectedCard.personName} />
              <DetailItem label="メール" value={selectedCard.email} />
              <DetailItem label="電話" value={selectedCard.phone} />
              <DetailItem label="携帯" value={selectedCard.mobile} />
              <DetailItem label="FAX" value={selectedCard.fax} />
              <DetailItem label="住所" value={selectedCard.address} span={2} />
              <DetailItem label="Webサイト" value={selectedCard.website} span={2} />
            </div>
            {selectedCard.partner && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium">紐づき取引先</p>
                <p className="text-sm font-medium text-green-800">{selectedCard.partner.code} - {selectedCard.partner.name}</p>
              </div>
            )}
            {selectedCard.note && (
              <div className="mt-2">
                <p className="text-xs text-text-tertiary">メモ</p>
                <p className="text-sm text-text">{selectedCard.note}</p>
              </div>
            )}
            {selectedCard && <RecordComments targetType="BusinessCard" targetId={selectedCard.id} />}
          </div>
        )}
      </Modal>

      {/* 編集モーダル */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="名刺編集"
        footer={
          <>
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">保存</button>
          </>
        }
      >
        {selectedCard && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <FormField label="会社名"><FormInput value={selectedCard.companyName ?? ""} onChange={(e) => updateField("companyName", e.target.value)} /></FormField>
            <FormField label="部署"><FormInput value={selectedCard.department ?? ""} onChange={(e) => updateField("department", e.target.value)} /></FormField>
            <FormField label="役職"><FormInput value={selectedCard.position ?? ""} onChange={(e) => updateField("position", e.target.value)} /></FormField>
            <FormField label="氏名" required><FormInput value={selectedCard.personName} onChange={(e) => updateField("personName", e.target.value)} /></FormField>
            <FormField label="メール"><FormInput type="email" value={selectedCard.email ?? ""} onChange={(e) => updateField("email", e.target.value)} /></FormField>
            <FormField label="電話"><FormInput value={selectedCard.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} /></FormField>
            <FormField label="携帯"><FormInput value={selectedCard.mobile ?? ""} onChange={(e) => updateField("mobile", e.target.value)} /></FormField>
            <FormField label="FAX"><FormInput value={selectedCard.fax ?? ""} onChange={(e) => updateField("fax", e.target.value)} /></FormField>
            <FormField label="住所"><FormInput value={selectedCard.address ?? ""} onChange={(e) => updateField("address", e.target.value)} /></FormField>
            <FormField label="Webサイト"><FormInput value={selectedCard.website ?? ""} onChange={(e) => updateField("website", e.target.value)} /></FormField>
            <FormField label="メモ"><FormInput value={selectedCard.note ?? ""} onChange={(e) => updateField("note", e.target.value)} /></FormField>
            <FormField label="ステータス">
              <FormSelect
                value={selectedCard.status}
                onChange={(e) => updateField("status", e.target.value)}
                options={[
                  { value: "NEW", label: "新規" },
                  { value: "CONTACTED", label: "連絡済" },
                  { value: "CONVERTED", label: "顧客変換済" },
                  { value: "ARCHIVED", label: "アーカイブ" },
                ]}
              />
            </FormField>
          </div>
        )}
      </Modal>
    </>
  );
}

function DetailItem({ label, value, span }: { label: string; value: string | null; span?: number }) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="text-sm text-text">{value || "-"}</p>
    </div>
  );
}
