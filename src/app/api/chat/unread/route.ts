import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

const CURRENT_USER_NAME = "福田 奈美絵";

// GET: 合計未読数
export const GET = withErrorHandler(async () => {
  const currentUser = await prisma.user.findFirst({
    where: { name: CURRENT_USER_NAME },
    select: { id: true },
  });

  if (!currentUser) {
    return NextResponse.json({ unreadCount: 0 }, { headers: cacheHeaders("REALTIME") });
  }

  const userId = currentUser.id;

  // 1. 一般トーク未読数
  const rooms = await prisma.chatRoom.findMany({
    where: { isArchived: false },
    select: { id: true },
  });

  const roomCursors = await prisma.chatReadCursor.findMany({
    where: { userId, roomId: { not: null } },
  });
  const cursorMap = new Map(roomCursors.map((c) => [c.roomId, c.lastReadAt]));

  let roomUnread = 0;
  for (const room of rooms) {
    const lastRead = cursorMap.get(room.id);
    const unreadMessages = await prisma.chatMessage.count({
      where: {
        roomId: room.id,
        ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
      },
    });
    if (unreadMessages > 0) roomUnread++;
  }

  // 2. 伝票トーク未読数
  const recordCursors = await prisma.chatReadCursor.findMany({
    where: { userId, targetType: { not: null } },
  });
  const recordCursorMap = new Map(
    recordCursors.map((c) => [`${c.targetType}:${c.targetId}`, c.lastReadAt])
  );

  // Get all distinct record threads
  const threads = await prisma.$queryRaw<
    Array<{ targetType: string; targetId: string; lastCreatedAt: Date }>
  >`
    SELECT DISTINCT ON ("targetType", "targetId")
      "targetType", "targetId", "createdAt" as "lastCreatedAt"
    FROM "RecordComment"
    ORDER BY "targetType", "targetId", "createdAt" DESC
  `;

  let recordUnread = 0;
  for (const t of threads) {
    const lastRead = recordCursorMap.get(`${t.targetType}:${t.targetId}`);
    if (!lastRead || t.lastCreatedAt > lastRead) {
      recordUnread++;
    }
  }

  return NextResponse.json(
    { unreadCount: roomUnread + recordUnread },
    { headers: cacheHeaders("REALTIME") }
  );
});
