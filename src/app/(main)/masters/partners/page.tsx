"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { RecordComments } from "@/components/record-comments";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/toast";
import { usePaginated } from "@/lib/use-paginated";
import { ImportDialog } from "@/components/import-dialog";
import { Plus, Download, Upload, Search, MoreHorizontal, CheckCircle, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useState } from "react";

type Partner = {
  id: string;
  code: string;
  name: string;
  nameKana: string | null;
  isCustomer: boolean;
  isSupplier: boolean;
  isCarrier: boolean;
  closingDay: string | null;
  tel: string | null;
  fax: string | null;
  email: string | null;
  address: string | null;
  prefecture: string | null;
  city: string | null;
  isIsccCertified: boolean;
  isActive: boolean;
  isOverseas: boolean;
};

function getPartnerType(p: Partner): string {
  if (p.isCustomer && p.isSupplier) return "mixed";
  if (p.isCustomer) return "customer";
  if (p.isSupplier) return "supplier";
  if (p.isCarrier) return "carrier";
  return "other";
}

const typeLabels: Record<string, string> = {
  customer: "顧客",
  supplier: "仕入先",
  carrier: "運送会社",
  mixed: "複合",
  other: "その他",
};

const closingDayLabels: Record<string, string> = {
  DAY_5: "5日",
  DAY_10: "10日",
  DAY_15: "15日",
  DAY_20: "20日",
  DAY_25: "25日",
  END_OF_MONTH: "末日",
};

export default function PartnersPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { showToast } = useToast();

  // Build query params
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (typeFilter !== "all") params.set("type", typeFilter);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { items: partners, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<Partner>(
    `/api/masters/partners?${params.toString()}`
  );

  const selectedPartner = partners.find((p) => p.id === showDetailModal);

  // 新規登録
  const [newForm, setNewForm] = useState({
    code: "", name: "", nameKana: "", type: "",
    closingDay: "", currency: "JPY",
    address: "", tel: "", fax: "", email: "",
    isIsccCertified: false,
  });

  // 編集用
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    code: "", name: "", nameKana: "", type: "",
    closingDay: "", currency: "JPY",
    address: "", tel: "", fax: "", email: "",
    isIsccCertified: false, isActive: true,
  });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/masters/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newForm,
          isCustomer: newForm.type === "customer" || newForm.type === "mixed",
          isSupplier: newForm.type === "supplier" || newForm.type === "mixed",
          isCarrier: newForm.type === "carrier",
          closingDay: newForm.closingDay || undefined,
          currency: newForm.currency || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowNewModal(false);
      setNewForm({ code: "", name: "", nameKana: "", type: "", closingDay: "", currency: "JPY", address: "", tel: "", fax: "", email: "", isIsccCertified: false });
      mutate();
      showToast("取引先を登録しました", "success");
    } catch {
      showToast("登録に失敗しました", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この取引先を削除しますか？")) return;
    try {
      await fetch(`/api/masters/partners/${id}`, { method: "DELETE" });
      mutate();
      showToast("取引先を削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
    }
    setMenuOpen(null);
  };

  const openEdit = (partner: Partner) => {
    const pType = getPartnerType(partner);
    setEditId(partner.id);
    setEditForm({
      code: partner.code,
      name: partner.name,
      nameKana: partner.nameKana ?? "",
      type: pType,
      closingDay: partner.closingDay ?? "",
      currency: "JPY",
      address: partner.address ?? "",
      tel: partner.tel ?? "",
      fax: partner.fax ?? "",
      email: partner.email ?? "",
      isIsccCertified: partner.isIsccCertified,
      isActive: partner.isActive,
    });
    setShowEditModal(true);
    setMenuOpen(null);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/masters/partners/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          isCustomer: editForm.type === "customer" || editForm.type === "mixed",
          isSupplier: editForm.type === "supplier" || editForm.type === "mixed",
          isCarrier: editForm.type === "carrier",
          closingDay: editForm.closingDay || undefined,
          currency: editForm.currency || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setShowEditModal(false);
      setEditId(null);
      mutate();
      showToast("取引先を更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  return (
    <>
      <Header title="取引先マスタ" />
      <div className="p-4 md:p-6 space-y-4">
        {/* ツールバー */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="コード、名称で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全種別</option>
              <option value="customer">顧客</option>
              <option value="supplier">仕入先</option>
              <option value="carrier">運送会社</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全ステータス</option>
              <option value="active">有効</option>
              <option value="inactive">無効</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetch("/api/export/excel?type=partners").then(r => r.blob()).then(blob => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "取引先一覧.xlsx"; a.click();
                  URL.revokeObjectURL(url);
                  showToast("Excelファイルをダウンロードしました", "success");
                }).catch(() => showToast("ダウンロードに失敗しました", "error"));
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel出力
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              <Upload className="w-4 h-4" />
              インポート
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新規登録
            </button>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
            </div>
          ) : (
            <>
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">コード</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">取引先名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">種別</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">締日</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">電話番号</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ISCC</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => {
                    const pType = getPartnerType(partner);
                    return (
                      <tr key={partner.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-text-secondary">{partner.code}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setShowDetailModal(partner.id)} className="text-left hover:underline">
                            <p className="text-sm font-medium text-text">{partner.name}</p>
                            <p className="text-xs text-text-tertiary">{[partner.prefecture, partner.city, partner.address].filter(Boolean).join("") || "-"}</p>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            pType === "customer" ? "bg-blue-50 text-blue-700"
                              : pType === "supplier" ? "bg-amber-50 text-amber-700"
                              : pType === "carrier" ? "bg-purple-50 text-purple-700"
                              : "bg-gray-50 text-gray-700"
                          }`}>
                            {typeLabels[pType]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {partner.closingDay ? closingDayLabels[partner.closingDay] ?? partner.closingDay : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{partner.tel ?? "-"}</td>
                        <td className="px-4 py-3 text-center">
                          {partner.isIsccCertified ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-text-tertiary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            partner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {partner.isActive ? "有効" : "無効"}
                          </span>
                        </td>
                        <td className="px-4 py-3 relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === partner.id ? null : partner.id)}
                            className="p-2 hover:bg-surface-tertiary rounded transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                          </button>
                          {menuOpen === partner.id && (
                            <div className="absolute right-4 top-12 bg-surface rounded-lg border border-border shadow-lg py-1 z-10 w-36">
                              <button
                                onClick={() => { setShowDetailModal(partner.id); setMenuOpen(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"
                              >
                                <Eye className="w-4 h-4" /> 詳細
                              </button>
                              <button
                                onClick={() => openEdit(partner)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"
                              >
                                <Edit className="w-4 h-4" /> 編集
                              </button>
                              <button
                                onClick={() => handleDelete(partner.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-tertiary"
                              >
                                <Trash2 className="w-4 h-4" /> 削除
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {partners.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-tertiary">
                        取引先が登録されていません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
            </>
          )}
        </div>
      </div>

      {/* 新規登録モーダル */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="取引先 新規登録"
        footer={
          <>
            <button
              onClick={() => setShowNewModal(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              登録する
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="取引先コード" required>
            <FormInput placeholder="例: C-005" value={newForm.code} onChange={(e) => setNewForm({ ...newForm, code: e.target.value })} />
          </FormField>
          <FormField label="取引先名" required>
            <FormInput placeholder="例: 株式会社〇〇" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
          </FormField>
          <FormField label="取引先名カナ">
            <FormInput placeholder="例: カブシキガイシャマルマル" value={newForm.nameKana} onChange={(e) => setNewForm({ ...newForm, nameKana: e.target.value })} />
          </FormField>
          <FormField label="種別" required>
            <FormSelect
              placeholder="選択してください"
              value={newForm.type}
              onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
              options={[
                { value: "customer", label: "顧客" },
                { value: "supplier", label: "仕入先" },
                { value: "carrier", label: "運送会社" },
                { value: "mixed", label: "複合" },
              ]}
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="締日">
              <FormSelect
                placeholder="選択"
                value={newForm.closingDay}
                onChange={(e) => setNewForm({ ...newForm, closingDay: e.target.value })}
                options={[
                  { value: "DAY_15", label: "15日" },
                  { value: "DAY_20", label: "20日" },
                  { value: "END_OF_MONTH", label: "末日" },
                ]}
              />
            </FormField>
            <FormField label="通貨">
              <FormSelect
                placeholder="選択"
                value={newForm.currency}
                onChange={(e) => setNewForm({ ...newForm, currency: e.target.value })}
                options={[
                  { value: "JPY", label: "JPY" },
                  { value: "USD", label: "USD" },
                  { value: "SGD", label: "SGD" },
                ]}
              />
            </FormField>
          </div>
          <FormField label="住所">
            <FormInput placeholder="例: 東京都中央区日本橋1-1-1" value={newForm.address} onChange={(e) => setNewForm({ ...newForm, address: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="電話番号">
              <FormInput placeholder="例: 03-1234-5678" value={newForm.tel} onChange={(e) => setNewForm({ ...newForm, tel: e.target.value })} />
            </FormField>
            <FormField label="FAX">
              <FormInput placeholder="例: 03-1234-5679" value={newForm.fax} onChange={(e) => setNewForm({ ...newForm, fax: e.target.value })} />
            </FormField>
          </div>
          <FormField label="メールアドレス">
            <FormInput type="email" placeholder="例: info@example.co.jp" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} />
          </FormField>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="iscc" className="rounded border-border" checked={newForm.isIsccCertified} onChange={(e) => setNewForm({ ...newForm, isIsccCertified: e.target.checked })} />
            <label htmlFor="iscc" className="text-sm text-text">ISCC PLUS認証取得済み</label>
          </div>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="取引先 編集"
        footer={
          <>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              更新する
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="取引先コード">
            <FormInput value={editForm.code} onChange={() => {}} />
          </FormField>
          <FormField label="取引先名" required>
            <FormInput value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </FormField>
          <FormField label="取引先名カナ">
            <FormInput value={editForm.nameKana} onChange={(e) => setEditForm({ ...editForm, nameKana: e.target.value })} />
          </FormField>
          <FormField label="種別" required>
            <FormSelect
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              options={[
                { value: "customer", label: "顧客" },
                { value: "supplier", label: "仕入先" },
                { value: "carrier", label: "運送会社" },
                { value: "mixed", label: "複合" },
              ]}
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="締日">
              <FormSelect
                placeholder="選択"
                value={editForm.closingDay}
                onChange={(e) => setEditForm({ ...editForm, closingDay: e.target.value })}
                options={[
                  { value: "DAY_15", label: "15日" },
                  { value: "DAY_20", label: "20日" },
                  { value: "END_OF_MONTH", label: "末日" },
                ]}
              />
            </FormField>
            <FormField label="通貨">
              <FormSelect
                value={editForm.currency}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                options={[
                  { value: "JPY", label: "JPY" },
                  { value: "USD", label: "USD" },
                  { value: "SGD", label: "SGD" },
                ]}
              />
            </FormField>
          </div>
          <FormField label="住所">
            <FormInput value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="電話番号">
              <FormInput value={editForm.tel} onChange={(e) => setEditForm({ ...editForm, tel: e.target.value })} />
            </FormField>
            <FormField label="FAX">
              <FormInput value={editForm.fax} onChange={(e) => setEditForm({ ...editForm, fax: e.target.value })} />
            </FormField>
          </div>
          <FormField label="メールアドレス">
            <FormInput type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </FormField>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="edit-iscc" className="rounded border-border" checked={editForm.isIsccCertified} onChange={(e) => setEditForm({ ...editForm, isIsccCertified: e.target.checked })} />
            <label htmlFor="edit-iscc" className="text-sm text-text">ISCC PLUS認証取得済み</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="edit-active" className="rounded border-border" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
            <label htmlFor="edit-active" className="text-sm text-text">有効</label>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal
        isOpen={!!showDetailModal}
        onClose={() => setShowDetailModal(null)}
        title={selectedPartner ? `取引先詳細: ${selectedPartner.name}` : ""}
        footer={
          <button
            onClick={() => setShowDetailModal(null)}
            className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            閉じる
          </button>
        }
      >
        {selectedPartner && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary">コード</p>
                <p className="text-sm font-mono font-medium text-text">{selectedPartner.code}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">種別</p>
                <p className="text-sm text-text">{typeLabels[getPartnerType(selectedPartner)]}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">取引先名</p>
              <p className="text-sm font-medium text-text">{selectedPartner.name}</p>
              {selectedPartner.nameKana && <p className="text-xs text-text-tertiary mt-0.5">{selectedPartner.nameKana}</p>}
            </div>
            <div>
              <p className="text-xs text-text-tertiary">住所</p>
              <p className="text-sm text-text">{[selectedPartner.prefecture, selectedPartner.city, selectedPartner.address].filter(Boolean).join("") || "-"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary">電話番号</p>
                <p className="text-sm text-text">{selectedPartner.tel ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">締日</p>
                <p className="text-sm text-text">{selectedPartner.closingDay ? closingDayLabels[selectedPartner.closingDay] ?? selectedPartner.closingDay : "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary">ISCC認証</p>
                <p className="text-sm text-text">{selectedPartner.isIsccCertified ? "認証済み" : "なし"}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">ステータス</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedPartner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {selectedPartner.isActive ? "有効" : "無効"}
                </span>
              </div>
            </div>
            {selectedPartner && <RecordComments targetType="BusinessPartner" targetId={selectedPartner.id} />}
          </div>
        )}
      </Modal>

      <ImportDialog
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="取引先インポート"
        endpoint="/api/import/masters"
        type="partners"
        onSuccess={() => mutate()}
      />
    </>
  );
}
