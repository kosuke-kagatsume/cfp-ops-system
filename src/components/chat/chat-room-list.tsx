"use client";

import { Search, Plus, Megaphone, Users, FileText } from "lucide-react";
import { useState } from "react";

type UnifiedRoom = {
  id: string;
  type: "room" | "record";
  name: string;
  roomType?: string;
  targetType?: string;
  targetId?: string;
  lastMessage: { body: string; authorName: string; createdAt: string } | null;
  unreadCount: number;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return "たった今";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function getRoomIcon(room: UnifiedRoom) {
  if (room.type === "record") return <FileText className="w-4 h-4 text-text-tertiary" />;
  if (room.roomType === "ANNOUNCEMENT") return <Megaphone className="w-4 h-4 text-warning" />;
  if (room.roomType === "TEAM") return <Users className="w-4 h-4 text-primary-500" />;
  return <Megaphone className="w-4 h-4 text-primary-600" />;
}

export function ChatRoomList({
  rooms,
  selectedId,
  onSelect,
  onNewRoom,
}: {
  rooms: UnifiedRoom[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewRoom: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "room" | "record">("all");

  const filtered = rooms.filter((r) => {
    if (filter === "room" && r.type !== "room") return false;
    if (filter === "record" && r.type !== "record") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.lastMessage?.body.toLowerCase().includes(q) ||
        r.targetId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text">トーク</h2>
          <button
            onClick={onNewRoom}
            className="p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
            title="新規トーク"
          >
            <Plus className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            placeholder="検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-surface-secondary focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "room", "record"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                filter === f
                  ? "bg-primary-100 text-primary-700 font-medium"
                  : "text-text-tertiary hover:bg-surface-tertiary"
              }`}
            >
              {f === "all" ? "すべて" : f === "room" ? "一般" : "伝票"}
            </button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <p className="text-xs">トークはありません</p>
          </div>
        ) : (
          filtered.map((room) => {
            const isSelected = room.id === selectedId;
            const hasUnread = room.unreadCount > 0;

            return (
              <button
                key={room.id}
                onClick={() => onSelect(room.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-border transition-colors ${
                  isSelected
                    ? "bg-primary-50"
                    : "hover:bg-surface-secondary"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getRoomIcon(room)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${
                          hasUnread ? "font-bold text-text" : "text-text"
                        }`}
                      >
                        {room.type === "record" ? `${room.name} ${room.targetId}` : room.name}
                      </span>
                      {room.lastMessage && (
                        <span className="text-[10px] text-text-tertiary shrink-0">
                          {timeAgo(room.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-text-tertiary truncate">
                          {room.lastMessage.authorName}: {room.lastMessage.body}
                        </p>
                        {hasUnread && (
                          <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1 shrink-0">
                            {room.unreadCount > 9 ? "9+" : room.unreadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
