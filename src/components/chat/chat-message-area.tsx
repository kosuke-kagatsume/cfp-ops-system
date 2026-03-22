"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { ChatMessageInput } from "./chat-message-input";
import { ChatRoomHeader } from "./chat-room-header";

type Message = {
  id: string;
  body: string;
  authorName: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

type MessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
};

type RoomInfo = {
  id: string;
  type: "room" | "record";
  name: string;
  roomType?: string;
  targetType?: string;
  targetId?: string;
  memberCount?: number;
};

const CURRENT_USER = "福田 奈美絵";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return "たった今";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;
  return new Date(dateStr).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "今日";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "昨日";
  return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
}

export function ChatMessageArea({ room }: { room: RoomInfo }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  const encodedId = encodeURIComponent(room.id);
  const { data, mutate } = useSWR<MessagesResponse>(
    `/api/chat/rooms/${encodedId}/messages?limit=100`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const messages = data?.messages ?? [];

  // Auto scroll on new messages
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [room.id]);

  // Mark as read when opening / new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      fetch(`/api/chat/rooms/${encodedId}/read`, { method: "PUT" }).catch(() => {});
    }
  }, [encodedId, messages.length]);

  const handleSend = async (body: string) => {
    await fetch(`/api/chat/rooms/${encodedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    mutate();
  };

  // Group messages by date
  let lastDate = "";

  return (
    <div className="flex flex-col h-full">
      <ChatRoomHeader room={room} />

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <p className="text-sm">メッセージはまだありません</p>
          </div>
        ) : (
          messages.map((msg) => {
            const msgDate = formatDate(msg.createdAt);
            const showDateSep = msgDate !== lastDate;
            lastDate = msgDate;
            const isOwn = msg.authorName === CURRENT_USER;

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center justify-center py-2">
                    <span className="text-[10px] text-text-tertiary bg-surface-secondary px-3 py-0.5 rounded-full">
                      {msgDate}
                    </span>
                  </div>
                )}
                <div className={`flex gap-2.5 py-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium text-primary-700">
                        {msg.authorName.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                    {!isOwn && (
                      <p className="text-[10px] font-medium text-text-secondary mb-0.5">
                        {msg.authorName}
                      </p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? "bg-primary-600 text-white rounded-tr-sm"
                          : "bg-surface-tertiary text-text rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    </div>
                    <p className={`text-[10px] text-text-tertiary mt-0.5 ${isOwn ? "text-right" : ""}`}>
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatMessageInput onSend={handleSend} />
    </div>
  );
}
