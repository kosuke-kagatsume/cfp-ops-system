"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { partners, partnerTypeLabels } from "@/lib/dummy-data";
import { Plus, Download, Search, MoreHorizontal, CheckCircle, Edit, Trash2, Eye } from "lucide-react";
import { useState } from "react";

export default function PartnersPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = partners.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedPartner = partners.find((p) => p.id === showDetailModal);

  return (
    <>
      <Header title="取引先マスタ" />
      <div className="p-6 space-y-4">
        {/* ツールバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="コード、名称で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              onClick={() => showToast("CSVファイルをダウンロードしました", "success")}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV出力
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
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
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
              {filtered.map((partner) => (
                <tr key={partner.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{partner.code}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetailModal(partner.id)} className="text-left hover:underline">
                      <p className="text-sm font-medium text-text">{partner.name}</p>
                      <p className="text-xs text-text-tertiary">{partner.address}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      partner.type === "customer" ? "bg-blue-50 text-blue-700"
                        : partner.type === "supplier" ? "bg-amber-50 text-amber-700"
                        : "bg-purple-50 text-purple-700"
                    }`}>
                      {partnerTypeLabels[partner.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{partner.closingDay}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{partner.tel}</td>
                  <td className="px-4 py-3 text-center">
                    {partner.isIscCertified ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      partner.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {partner.status === "active" ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === partner.id ? null : partner.id)}
                      className="p-1 hover:bg-surface-tertiary rounded transition-colors"
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
                          onClick={() => { showToast("編集画面を開きます（開発中）", "info"); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"
                        >
                          <Edit className="w-4 h-4" /> 編集
                        </button>
                        <button
                          onClick={() => { showToast("削除機能は開発中です", "warning"); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-tertiary"
                        >
                          <Trash2 className="w-4 h-4" /> 削除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
            <p className="text-xs text-text-tertiary">{filtered.length}件 / {partners.length}件</p>
            <div className="flex items-center gap-1">
              <button onClick={() => showToast("先頭ページです", "info")} className="px-3 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-tertiary">前へ</button>
              <button className="px-3 py-1 text-xs bg-primary-600 text-text-inverse rounded">1</button>
              <button onClick={() => showToast("最終ページです", "info")} className="px-3 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-tertiary">次へ</button>
            </div>
          </div>
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
              onClick={() => { setShowNewModal(false); showToast("取引先を登録しました（モック）", "success"); }}
              className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              登録する
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="取引先コード" required>
            <FormInput placeholder="例: C-005" />
          </FormField>
          <FormField label="取引先名" required>
            <FormInput placeholder="例: 株式会社〇〇" />
          </FormField>
          <FormField label="取引先名カナ">
            <FormInput placeholder="例: カブシキガイシャマルマル" />
          </FormField>
          <FormField label="種別" required>
            <FormSelect
              placeholder="選択してください"
              options={[
                { value: "customer", label: "顧客" },
                { value: "supplier", label: "仕入先" },
                { value: "carrier", label: "運送会社" },
                { value: "mixed", label: "複合" },
              ]}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="締日" required>
              <FormSelect
                placeholder="選択"
                options={[
                  { value: "15", label: "15日" },
                  { value: "20", label: "20日" },
                  { value: "末日", label: "末日" },
                ]}
              />
            </FormField>
            <FormField label="通貨">
              <FormSelect
                placeholder="選択"
                options={[
                  { value: "JPY", label: "JPY" },
                  { value: "USD", label: "USD" },
                  { value: "SGD", label: "SGD" },
                ]}
              />
            </FormField>
          </div>
          <FormField label="住所">
            <FormInput placeholder="例: 東京都中央区日本橋1-1-1" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="電話番号">
              <FormInput placeholder="例: 03-1234-5678" />
            </FormField>
            <FormField label="FAX">
              <FormInput placeholder="例: 03-1234-5679" />
            </FormField>
          </div>
          <FormField label="メールアドレス">
            <FormInput type="email" placeholder="例: info@example.co.jp" />
          </FormField>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="iscc" className="rounded border-border" />
            <label htmlFor="iscc" className="text-sm text-text">ISCC PLUS認証取得済み</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary">コード</p>
                <p className="text-sm font-mono font-medium text-text">{selectedPartner.code}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">種別</p>
                <p className="text-sm text-text">{partnerTypeLabels[selectedPartner.type]}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">取引先名</p>
              <p className="text-sm font-medium text-text">{selectedPartner.name}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{selectedPartner.nameKana}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">住所</p>
              <p className="text-sm text-text">{selectedPartner.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary">電話番号</p>
                <p className="text-sm text-text">{selectedPartner.tel}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">締日</p>
                <p className="text-sm text-text">{selectedPartner.closingDay}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary">ISCC認証</p>
                <p className="text-sm text-text">{selectedPartner.isIscCertified ? "認証済み" : "なし"}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">ステータス</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedPartner.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {selectedPartner.status === "active" ? "有効" : "無効"}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
