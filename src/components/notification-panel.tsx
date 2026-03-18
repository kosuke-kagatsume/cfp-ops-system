"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Bell } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

type NotificationResponse = {
  items: Notification[];
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
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

export function NotificationBell() {
  const { data } = useSWR<NotificationResponse>("/api/notifications?limit=1", fetcher, {
    refreshInterval: 30000,
  });

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <>
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </>
  );
}

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<NotificationResponse>("/api/notifications?limit=20", fetcher, {
    refreshInterval: 30000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleReadAll = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    mutate();
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await fetch(`/api/notifications/${notification.id}`, { method: "PUT" });
      mutate();
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onClose();
  };

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-secondary">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text">通知</h3>
          {unreadCount > 0 && (
            <span className="bg-danger/10 text-danger text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}件
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
          >
            <Check className="w-3 h-3" />
            すべて既読
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">通知はありません</p>
          </div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className="w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-surface-secondary transition-colors flex items-start gap-3"
            >
              {!n.isRead && (
                <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 shrink-0" />
              )}
              {n.isRead && <span className="w-2 h-2 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text">{n.title}</p>
                <p className="text-xs text-text-secondary truncate">{n.message}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
