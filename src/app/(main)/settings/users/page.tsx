"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { users, roleLabels } from "@/lib/dummy-data";
import { Plus, Search, MoreHorizontal, Shield, Eye, Edit, UserX, UserCheck } from "lucide-react";
import { useState } from "react";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedUser = users.find((u) => u.id === showDetailModal);

  return (
    <>
      <Header title="ユーザー管理" />
      <div className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Microsoft Entra ID (Azure AD) SSO</p>
            <p className="text-xs text-blue-600 mt-0.5">ユーザーはMicrosoft 365アカウントでログインします。ここではロール割当とアクセス管理を行います。</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" placeholder="名前、メールで検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">全ロール</option>
              {Object.entries(roleLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
          </div>
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />ユーザー追加
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ユーザー</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">メール</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ロール</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">会社</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">最終ログイン</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setShowDetailModal(user.id)} className="flex items-center gap-3 hover:underline">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">{user.name.split(" ").map((n) => n[0]).join("")}</span>
                      </div>
                      <span className="text-sm font-medium text-text">{user.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      user.role === "admin" ? "bg-red-50 text-red-700" : user.role === "sales" ? "bg-blue-50 text-blue-700"
                        : user.role === "accounting" ? "bg-emerald-50 text-emerald-700" : user.role === "factory" ? "bg-amber-50 text-amber-700"
                        : user.role === "manager" ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700"
                    }`}>{roleLabels[user.role]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{user.company}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${user.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {user.status === "active" ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary">{user.lastLogin}</td>
                  <td className="px-4 py-3 relative">
                    <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                    </button>
                    {menuOpen === user.id && (
                      <div className="absolute right-4 top-12 bg-surface rounded-lg border border-border shadow-lg py-1 z-10 w-40">
                        <button onClick={() => { setShowDetailModal(user.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"><Eye className="w-4 h-4" /> 詳細</button>
                        <button onClick={() => { showToast("ロール変更（開発中）", "info"); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"><Edit className="w-4 h-4" /> ロール変更</button>
                        <button onClick={() => { showToast(user.status === "active" ? "ユーザーを無効化しました（モック）" : "ユーザーを有効化しました（モック）", user.status === "active" ? "warning" : "success"); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary">
                          {user.status === "active" ? <><UserX className="w-4 h-4" /> 無効化</> : <><UserCheck className="w-4 h-4" /> 有効化</>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="ユーザー追加"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
          <button onClick={() => { setShowNewModal(false); showToast("ユーザーを追加しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">追加する</button>
        </>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">Microsoft 365のメールアドレスを入力してください。Azure ADからユーザー情報が自動取得されます。</p>
          </div>
          <FormField label="メールアドレス" required><FormInput type="email" placeholder="例: tanaka@cfp-corp.co.jp" /></FormField>
          <FormField label="ロール" required>
            <FormSelect placeholder="選択" options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="会社" required>
            <FormSelect placeholder="選択" options={[{ value: "CFP", label: "CFP" }, { value: "RE", label: "RE" }, { value: "CTS", label: "CTS" }]} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetailModal} onClose={() => setShowDetailModal(null)}
        title={selectedUser ? `ユーザー詳細: ${selectedUser.name}` : ""}
        footer={<button onClick={() => setShowDetailModal(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-lg font-medium text-primary-700">{selectedUser.name.split(" ").map((n) => n[0]).join("")}</span>
              </div>
              <div>
                <p className="text-base font-bold text-text">{selectedUser.name}</p>
                <p className="text-sm text-text-secondary">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-text-tertiary">ロール</p><p className="text-sm text-text">{roleLabels[selectedUser.role]}</p></div>
              <div><p className="text-xs text-text-tertiary">会社</p><p className="text-sm text-text">{selectedUser.company}</p></div>
              <div><p className="text-xs text-text-tertiary">ステータス</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${selectedUser.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {selectedUser.status === "active" ? "有効" : "無効"}
                </span>
              </div>
              <div><p className="text-xs text-text-tertiary">最終ログイン</p><p className="text-sm text-text">{selectedUser.lastLogin}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
