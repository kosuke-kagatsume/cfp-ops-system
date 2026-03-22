"use client";

import { Megaphone, Users, FileText, ExternalLink } from "lucide-react";

type RoomInfo = {
  id: string;
  type: "room" | "record";
  name: string;
  roomType?: string;
  targetType?: string;
  targetId?: string;
  memberCount?: number;
};

function getTargetLink(targetType: string, _targetId: string): string {
  const links: Record<string, string> = {
    Deal: "/deals", Purchase: "/purchases", Shipment: "/shipments",
    SalesOrder: "/sales/orders", Invoice: "/sales/invoices",
    ProcessingOrder: "/processing", CrMaterial: "/cr/materials",
    CrProductionOrder: "/cr/production-orders", OilShipment: "/cr/oil-shipments",
    Contract: "/contracts", Quotation: "/sales/quotations",
    BusinessPartner: "/masters/partners", BusinessCard: "/business-cards",
  };
  return links[targetType] ?? "/";
}

export function ChatRoomHeader({ room }: { room: RoomInfo }) {
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {room.type === "record" ? (
          <FileText className="w-5 h-5 text-text-tertiary shrink-0" />
        ) : room.roomType === "ANNOUNCEMENT" ? (
          <Megaphone className="w-5 h-5 text-warning shrink-0" />
        ) : room.roomType === "TEAM" ? (
          <Users className="w-5 h-5 text-primary-500 shrink-0" />
        ) : (
          <Megaphone className="w-5 h-5 text-primary-600 shrink-0" />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text truncate">
            {room.type === "record" ? `${room.name} ${room.targetId}` : room.name}
          </h3>
          {room.type === "room" && room.memberCount !== undefined && (
            <p className="text-[10px] text-text-tertiary">{room.memberCount}人のメンバー</p>
          )}
        </div>
      </div>

      {room.type === "record" && room.targetType && room.targetId && (
        <a
          href={getTargetLink(room.targetType, room.targetId)}
          className="flex items-center gap-1 text-xs text-primary-600 hover:underline shrink-0"
        >
          伝票を見る
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
