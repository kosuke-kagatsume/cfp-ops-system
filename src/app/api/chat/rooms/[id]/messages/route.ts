import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

const CURRENT_USER_NAME = "福田 奈美絵";

type RouteParams = { params: Promise<{ id: string }> };

// GET: メッセージ一覧（カーソルベースページネーション）
export const GET = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { id: rawId } = await context.params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  // Parse id: "room:uuid" or "record:Type:uuid"
  if (rawId.startsWith("record:")) {
    // 伝票トーク → RecordComment
    const parts = rawId.split(":");
    const targetType = parts[1];
    const targetId = parts.slice(2).join(":");

    const comments = await prisma.recordComment.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "asc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit,
    });

    return NextResponse.json(
      {
        messages: comments.map((c) => ({
          id: c.id,
          body: c.body,
          authorName: c.authorName,
          authorId: c.authorId,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        nextCursor: comments.length === limit ? comments[comments.length - 1].id : null,
      },
      { headers: cacheHeaders("REALTIME") }
    );
  }

  // 一般トーク → ChatMessage
  const roomId = rawId.startsWith("room:") ? rawId.slice(5) : rawId;

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit,
  });

  return NextResponse.json(
    {
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        authorName: m.authorName,
        authorId: m.authorId,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
    },
    { headers: cacheHeaders("REALTIME") }
  );
});

// POST: メッセージ投稿
export const POST = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { id: rawId } = await context.params;
  const body = await request.json();
  const { body: messageBody } = body;

  if (!messageBody?.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const currentUser = await prisma.user.findFirst({
    where: { name: CURRENT_USER_NAME },
    select: { id: true, name: true },
  });

  const authorName = currentUser?.name ?? CURRENT_USER_NAME;
  const authorId = currentUser?.id ?? null;

  if (rawId.startsWith("record:")) {
    // 伝票トーク → RecordComment
    const parts = rawId.split(":");
    const targetType = parts[1];
    const targetId = parts.slice(2).join(":");

    const comment = await prisma.recordComment.create({
      data: {
        targetType,
        targetId,
        body: messageBody.trim(),
        authorName,
        authorId,
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        body: comment.body,
        authorName: comment.authorName,
        authorId: comment.authorId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  }

  // 一般トーク → ChatMessage
  const roomId = rawId.startsWith("room:") ? rawId.slice(5) : rawId;

  const message = await prisma.chatMessage.create({
    data: {
      roomId,
      body: messageBody.trim(),
      authorName,
      authorId,
    },
  });

  // Update room's updatedAt
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(
    {
      id: message.id,
      body: message.body,
      authorName: message.authorName,
      authorId: message.authorId,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    },
    { status: 201 }
  );
});
