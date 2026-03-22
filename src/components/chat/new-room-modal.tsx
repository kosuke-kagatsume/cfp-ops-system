"use client";

import { X, Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

type User = {
  id: string;
  name: string;
};

type RecordResult = {
  targetType: string;
  targetId: string;
  label: string;
  number: string;
};

const TARGET_TYPES = [
  { value: "Deal", label: "案件" },
  { value: "Purchase", label: "仕入伝票" },
  { value: "Shipment", label: "出荷伝票" },
  { value: "SalesOrder", label: "受注伝票" },
  { value: "Invoice", label: "請求書" },
  { value: "Quotation", label: "見積書" },
  { value: "Contract", label: "契約書" },
  { value: "ProcessingOrder", label: "加工指図" },
  { value: "Expense", label: "経費" },
];

export function NewRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (roomId: string) => void;
}) {
  const [tab, setTab] = useState<"general" | "record">("general");

  // General talk state
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState<"GENERAL" | "TEAM" | "ANNOUNCEMENT">("GENERAL");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Record talk state
  const [targetType, setTargetType] = useState("Deal");
  const [recordSearch, setRecordSearch] = useState("");
  const [records, setRecords] = useState<RecordResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetch("/api/settings/users")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.users ?? [];
        setUsers(list.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, []);

  // Search records when targetType or search changes
  const searchRecords = useCallback(async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ targetType });
      if (recordSearch) params.set("search", recordSearch);
      const res = await fetch(`/api/chat/records?${params}`);
      if (res.ok) setRecords(await res.json());
    } catch {
      // silent
    } finally {
      setIsSearching(false);
    }
  }, [targetType, recordSearch]);

  useEffect(() => {
    if (tab === "record") {
      const timer = setTimeout(searchRecords, 300);
      return () => clearTimeout(timer);
    }
  }, [tab, searchRecords]);

  const handleCreateGeneral = async () => {
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

  const handleSelectRecord = (record: RecordResult) => {
    onCreated(`record:${record.targetType}:${record.targetId}`);
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

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("general")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === "general"
                ? "text-primary-700 border-b-2 border-primary-600"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            一般トーク
          </button>
          <button
            onClick={() => setTab("record")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === "record"
                ? "text-primary-700 border-b-2 border-primary-600"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            伝票トーク
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {tab === "general" ? (
            <>
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
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">伝票種別</label>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => { setTargetType(t.value); setRecordSearch(""); }}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        targetType === t.value
                          ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                          : "border-border text-text-secondary hover:bg-surface-tertiary"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">伝票を検索</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                  <input
                    type="text"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder="伝票番号や名称で検索..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {isSearching ? (
                    <p className="px-3 py-4 text-xs text-text-tertiary text-center">検索中...</p>
                  ) : records.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-text-tertiary text-center">
                      {TARGET_TYPES.find((t) => t.value === targetType)?.label}が見つかりません
                    </p>
                  ) : (
                    records.map((r) => (
                      <button
                        key={`${r.targetType}:${r.targetId}`}
                        onClick={() => handleSelectRecord(r)}
                        className="w-full text-left px-3 py-2.5 hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-text truncate">{r.label}</span>
                          <span className="text-xs text-text-tertiary shrink-0">{r.number}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {tab === "general" && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreateGeneral}
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors"
            >
              作成
            </button>
          </div>
        )}
        {tab === "record" && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
