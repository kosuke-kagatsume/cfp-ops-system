import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { getNextNumber } from "@/lib/auto-number";

const CURRENT_USER_NAME = "福田 奈美絵";

function getTargetLabel(targetType: string): string {
  const labels: Record<string, string> = {
    Deal: "案件", Purchase: "仕入伝票", Shipment: "出荷伝票",
    SalesOrder: "受注伝票", Invoice: "請求書", ProcessingOrder: "加工指図",
    CrMaterial: "CR原料受入", CrProductionOrder: "CR製造指図",
    OilShipment: "CR出荷(油化)", Contract: "契約書",
    Quotation: "見積書", BusinessPartner: "取引先", BusinessCard: "名刺",
  };
  return labels[targetType] ?? targetType;
}

// GET: 統合ルーム一覧（一般トーク + 伝票トーク）
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all"; // all, room, record

  // Get current user for unread counts
  const currentUser = await prisma.user.findFirst({
    where: { name: CURRENT_USER_NAME },
    select: { id: true },
  });
  const userId = currentUser?.id;

  // 1. 一般トーク（ChatRoom）
  let rooms: Array<{
    id: string;
    type: "room";
    name: string;
    roomType: string;
    lastMessage: { body: string; authorName: string; createdAt: string } | null;
    unreadCount: number;
  }> = [];

  if (filter === "all" || filter === "room") {
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        isArchived: false,
        ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get read cursors for rooms
    const roomCursors = userId
      ? await prisma.chatReadCursor.findMany({
          where: { userId, roomId: { in: chatRooms.map((r) => r.id) } },
        })
      : [];
    const cursorMap = new Map(roomCursors.map((c) => [c.roomId, c.lastReadAt]));

    rooms = chatRooms.map((room) => {
      const lastMsg = room.messages[0] ?? null;
      const lastRead = cursorMap.get(room.id);
      let unreadCount = 0;
      if (lastMsg && userId) {
        if (!lastRead || lastMsg.createdAt > lastRead) {
          // Count messages after lastRead
          unreadCount = lastRead
            ? room.messages.filter((m) => m.createdAt > lastRead).length || 1
            : room._count.messages;
        }
      }
      return {
        id: `room:${room.id}`,
        type: "room" as const,
        name: room.name,
        roomType: room.roomType,
        lastMessage: lastMsg
          ? { body: lastMsg.body, authorName: lastMsg.authorName, createdAt: lastMsg.createdAt.toISOString() }
          : null,
        unreadCount,
      };
    });
  }

  // 2. 伝票トーク（RecordComment集約）
  let recordRooms: Array<{
    id: string;
    type: "record";
    name: string;
    targetType: string;
    targetId: string;
    lastMessage: { body: string; authorName: string; createdAt: string } | null;
    unreadCount: number;
  }> = [];

  if (filter === "all" || filter === "record") {
    // Get distinct targetType+targetId combinations with latest comment
    const distinctTargets = await prisma.$queryRaw<
      Array<{
        targetType: string;
        targetId: string;
        lastBody: string;
        lastAuthor: string;
        lastCreatedAt: Date;
        commentCount: bigint;
      }>
    >`
      SELECT
        rc."targetType",
        rc."targetId",
        latest.body as "lastBody",
        latest."authorName" as "lastAuthor",
        latest."createdAt" as "lastCreatedAt",
        COUNT(rc.id) as "commentCount"
      FROM "RecordComment" rc
      INNER JOIN (
        SELECT DISTINCT ON ("targetType", "targetId")
          "targetType", "targetId", body, "authorName", "createdAt"
        FROM "RecordComment"
        ORDER BY "targetType", "targetId", "createdAt" DESC
      ) latest ON rc."targetType" = latest."targetType" AND rc."targetId" = latest."targetId"
      GROUP BY rc."targetType", rc."targetId", latest.body, latest."authorName", latest."createdAt"
      ORDER BY latest."createdAt" DESC
    `;

    // Get read cursors for record types
    const recordCursors = userId
      ? await prisma.chatReadCursor.findMany({
          where: { userId, targetType: { not: null } },
        })
      : [];
    const recordCursorMap = new Map(
      recordCursors.map((c) => [`${c.targetType}:${c.targetId}`, c.lastReadAt])
    );

    recordRooms = distinctTargets
      .filter((t) => {
        if (!search) return true;
        const label = getTargetLabel(t.targetType);
        return label.includes(search) || t.targetId.includes(search);
      })
      .map((t) => {
        const lastRead = recordCursorMap.get(`${t.targetType}:${t.targetId}`);
        let unreadCount = 0;
        if (userId && (!lastRead || t.lastCreatedAt > lastRead)) {
          unreadCount = Number(t.commentCount); // simplified
        }
        return {
          id: `record:${t.targetType}:${t.targetId}`,
          type: "record" as const,
          name: `${getTargetLabel(t.targetType)}`,
          targetType: t.targetType,
          targetId: t.targetId,
          lastMessage: {
            body: t.lastBody,
            authorName: t.lastAuthor,
            createdAt: t.lastCreatedAt.toISOString(),
          },
          unreadCount,
        };
      });
  }

  // 3. 統合して lastMessage.createdAt 降順でソート
  const unified = [...rooms, ...recordRooms].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? "";
    const bTime = b.lastMessage?.createdAt ?? "";
    return bTime.localeCompare(aTime);
  });

  return NextResponse.json(unified, { headers: cacheHeaders("REALTIME") });
});

// POST: 一般トーク作成
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { name, roomType, description, memberIds } = body;

  if (!name || !roomType) {
    return NextResponse.json({ error: "name and roomType are required" }, { status: 400 });
  }

  const currentUser = await prisma.user.findFirst({
    where: { name: CURRENT_USER_NAME },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const roomNumber = await getNextNumber("CHT");

  const room = await prisma.chatRoom.create({
    data: {
      roomNumber,
      name,
      roomType,
      description: description || null,
      createdById: currentUser.id,
      members: {
        create: [
          { userId: currentUser.id, role: "ADMIN" },
          ...((memberIds ?? []) as string[])
            .filter((id: string) => id !== currentUser.id)
            .map((id: string) => ({ userId: id, role: "MEMBER" })),
        ],
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(room, { status: 201 });
});
