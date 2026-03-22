"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { ChatRoomList } from "@/components/chat/chat-room-list";
import { ChatMessageArea } from "@/components/chat/chat-message-area";
import { NewRoomModal } from "@/components/chat/new-room-modal";

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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ChatContent() {
  const searchParams = useSearchParams();
  const openParam = searchParams.get("open");

  const [selectedId, setSelectedId] = useState<string | null>(openParam);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "messages">("list");

  const { data: rooms, mutate } = useSWR<UnifiedRoom[]>(
    "/api/chat/rooms",
    fetcher,
    { refreshInterval: 10000 }
  );

  // Handle deep link
  useEffect(() => {
    if (openParam && openParam !== selectedId) {
      setSelectedId(openParam);
      setMobileView("messages");
    }
  }, [openParam, selectedId]);

  const roomList = rooms ?? [];
  const selectedRoom = roomList.find((r) => r.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView("messages");
  };

  const handleBack = () => {
    setMobileView("list");
  };

  const handleNewRoom = () => setShowNewRoom(true);

  const handleRoomCreated = (roomId: string) => {
    setShowNewRoom(false);
    setSelectedId(roomId);
    setMobileView("messages");
    mutate();
  };

  // Build room info for message area
  const roomInfo = selectedRoom
    ? {
        id: selectedRoom.id,
        type: selectedRoom.type,
        name: selectedRoom.name,
        roomType: selectedRoom.roomType,
        targetType: selectedRoom.targetType,
        targetId: selectedRoom.targetId,
      }
    : null;

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col">
      {/* Desktop: 2-column layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Room list */}
        <div className="w-[280px] shrink-0">
          <ChatRoomList
            rooms={roomList}
            selectedId={selectedId}
            onSelect={handleSelect}
            onNewRoom={handleNewRoom}
          />
        </div>

        {/* Message area */}
        <div className="flex-1 min-w-0">
          {roomInfo ? (
            <ChatMessageArea room={roomInfo} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">トークを選択してください</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: 1-column switchable */}
      <div className="md:hidden flex-1 overflow-hidden">
        {mobileView === "list" ? (
          <ChatRoomList
            rooms={roomList}
            selectedId={selectedId}
            onSelect={handleSelect}
            onNewRoom={handleNewRoom}
          />
        ) : roomInfo ? (
          <div className="flex flex-col h-full">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-surface-secondary border-b border-border"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>
            <div className="flex-1 overflow-hidden">
              <ChatMessageArea room={roomInfo} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <p className="text-sm">トークを選択してください</p>
          </div>
        )}
      </div>

      {showNewRoom && (
        <NewRoomModal
          onClose={() => setShowNewRoom(false)}
          onCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
