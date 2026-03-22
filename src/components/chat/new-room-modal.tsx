"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
};

export function NewRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (roomId: string) => void;
}) {
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState<"GENERAL" | "TEAM" | "ANNOUNCEMENT">("GENERAL");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/settings/users")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.users ?? [];
        setUsers(list.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          roomType,
          description: description.trim() || undefined,
          memberIds: selectedUserIds,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const room = await res.json();
      onCreated(`room:${room.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-text">新規トーク作成</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-tertiary rounded">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">トーク名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 全社連絡、MRチーム"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">種別</label>
            <div className="flex gap-2">
              {([
                { value: "GENERAL", label: "全社連絡" },
                { value: "TEAM", label: "チーム" },
                { value: "ANNOUNCEMENT", label: "告知" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRoomType(opt.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    roomType === opt.value
                      ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                      : "border-border text-text-secondary hover:bg-surface-tertiary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">説明（任意）</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="トークの説明..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              メンバー ({selectedUserIds.length}人選択)
            </label>
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text">{u.name}</span>
                </label>
              ))}
              {users.length === 0 && (
                <p className="px-3 py-2 text-xs text-text-tertiary">ユーザーを読み込み中...</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors"
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
}
