"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Plus, Search, MoreHorizontal, Shield, Eye, Edit, UserX, UserCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type RoleOption = { id: string; name: string; description: string | null };

type UserEntry = {
  id: string;
  email: string;
  name: string;
  nameKana: string | null;
  department: string | null;
  position: string | null;
  isActive: boolean;
  roleId: string | null;
  role: { id: string; name: string; description: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

const roleLabels: Record<string, string> = {
  admin: "管理者",
  sales: "営業",
  accounting: "経理",
  factory: "工場",
  manager: "管理",
  readonly: "閲覧",
};

function getRoleLabel(user: UserEntry): string {
  if (user.role?.name) {
    return roleLabels[user.role.name] ?? user.role.name;
  }
  return "未設定";
}

function getRoleKey(user: UserEntry): string {
  return user.role?.name ?? "readonly";
}

function getRoleColor(roleKey: string): string {
  switch (roleKey) {
    case "admin": return "bg-red-50 text-red-700";
    case "sales": return "bg-blue-50 text-blue-700";
    case "accounting": return "bg-emerald-50 text-emerald-700";
    case "factory": return "bg-amber-50 text-amber-700";
    case "manager": return "bg-purple-50 text-purple-700";
    default: return "bg-gray-50 text-gray-700";
  }
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const { showToast } = useToast();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (roleFilter !== "all") params.set("role", roleFilter);

  const { items: users, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<UserEntry>(
    `/api/settings/users?${params.toString(
  )}`
  );

  const allUsers = users ?? [];
  const selectedUser = allUsers.find((u) => u.id === showDetailModal);

  const [newForm, setNewForm] = useState({ email: "", name: "", roleId: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", department: "", position: "", roleId: "", isActive: true });

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newForm.email, name: newForm.name, roleId: newForm.roleId || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ email: "", name: "", roleId: "" });
      mutate();
      showToast("ユーザーを追加しました", "success");
    } catch { showToast("追加に失敗しました", "error"); }
  };

  const openEdit = (user: UserEntry) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, department: user.department ?? "", position: user.position ?? "", roleId: user.roleId ?? "", isActive: user.isActive });
    setShowDetailModal(null);
    setMenuOpen(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      const res = await fetch(`/api/settings/users/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, email: editForm.email, department: editForm.department || null, position: editForm.position || null, roleId: editForm.roleId || null, isActive: editForm.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowEditModal(false);
      mutate();
      showToast("ユーザー情報を更新しました", "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

  const toggleActive = async (user: UserEntry) => {
    try {
      const res = await fetch(`/api/settings/users/${user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      setMenuOpen(null);
      mutate();
      showToast(user.isActive ? "ユーザーを無効化しました" : "ユーザーを有効化しました", user.isActive ? "warning" : "success");
    } catch { showToast("更新に失敗しました", "error"); }
  };

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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ユーザー</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">メール</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ロール</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">部署</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase">ステータス</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">更新日</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => {
                  const roleKey = getRoleKey(user);
                  return (
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
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(roleKey)}`}>{getRoleLabel(user)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{user.department ?? "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {user.isActive ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-tertiary">{new Date(user.updatedAt).toLocaleDateString("ja-JP")}</td>
                      <td className="px-4 py-3 relative">
                        <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="p-1 hover:bg-surface-tertiary rounded transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                        </button>
                        {menuOpen === user.id && (
                          <div className="absolute right-4 top-12 bg-surface rounded-lg border border-border shadow-lg py-1 z-10 w-40">
                            <button onClick={() => { setShowDetailModal(user.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"><Eye className="w-4 h-4" /> 詳細</button>
                            <button onClick={() => openEdit(user)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"><Edit className="w-4 h-4" /> 編集</button>
                            <button onClick={() => toggleActive(user)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary">
                              {user.isActive ? <><UserX className="w-4 h-4" /> 無効化</> : <><UserCheck className="w-4 h-4" /> 有効化</>}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          
              <div className="px-4 py-3 border-t border-border">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
</div>
        )}
      </div>

      {/* 新規登録モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="ユーザー追加"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors">追加する</button>
        </>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">Microsoft 365のメールアドレスを入力してください。Azure ADからユーザー情報が自動取得されます。</p>
          </div>
          <FormField label="名前" required><FormInput placeholder="例: 田中太郎" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} /></FormField>
          <FormField label="メールアドレス" required><FormInput type="email" placeholder="例: tanaka@cfp-corp.co.jp" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} /></FormField>
          <FormField label="ロール" required>
            <FormSelect placeholder="選択" value={newForm.roleId} onChange={(e) => setNewForm({ ...newForm, roleId: e.target.value })} options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="ユーザー編集"
        footer={<>
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">更新する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="名前" required><FormInput value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></FormField>
          <FormField label="メールアドレス" required><FormInput type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></FormField>
          <FormField label="部署"><FormInput value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} /></FormField>
          <FormField label="役職"><FormInput value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} /></FormField>
          <FormField label="ロール">
            <FormSelect value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })} options={Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </FormField>
          <FormField label="ステータス">
            <FormSelect value={editForm.isActive ? "true" : "false"} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })} options={[
              { value: "true", label: "有効" }, { value: "false", label: "無効" },
            ]} />
          </FormField>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      <Modal isOpen={!!showDetailModal} onClose={() => setShowDetailModal(null)}
        title={selectedUser ? `ユーザー詳細: ${selectedUser.name}` : ""}
        footer={<>
          <button onClick={() => selectedUser && openEdit(selectedUser)} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">編集</button>
          <button onClick={() => setShowDetailModal(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">閉じる</button>
        </>}
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
              <div><p className="text-xs text-text-tertiary">ロール</p><p className="text-sm text-text">{getRoleLabel(selectedUser)}</p></div>
              <div><p className="text-xs text-text-tertiary">部署</p><p className="text-sm text-text">{selectedUser.department ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">役職</p><p className="text-sm text-text">{selectedUser.position ?? "-"}</p></div>
              <div><p className="text-xs text-text-tertiary">ステータス</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${selectedUser.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {selectedUser.isActive ? "有効" : "無効"}
                </span>
              </div>
              <div><p className="text-xs text-text-tertiary">作成日</p><p className="text-sm text-text">{new Date(selectedUser.createdAt).toLocaleDateString("ja-JP")}</p></div>
              <div><p className="text-xs text-text-tertiary">更新日</p><p className="text-sm text-text">{new Date(selectedUser.updatedAt).toLocaleDateString("ja-JP")}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
