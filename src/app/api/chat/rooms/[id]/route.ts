import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

type RouteParams = { params: Promise<{ id: string }> };

// GET: ルーム詳細
export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  const room = await prisma.chatRoom.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { messages: true } },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(room, { headers: cacheHeaders("REALTIME") });
});

// PUT: ルーム更新
export const PUT = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;
  const body = await request.json();
  const { name, description, isArchived } = body;

  const room = await prisma.chatRoom.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isArchived !== undefined && { isArchived }),
    },
  });

  return NextResponse.json(room);
});

// DELETE: ルームアーカイブ
export const DELETE = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  await prisma.chatRoom.update({
    where: { id },
    data: { isArchived: true },
  });

  return NextResponse.json({ success: true });
});
