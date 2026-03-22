import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

const CURRENT_USER_NAME = "福田 奈美絵";

type RouteParams = { params: Promise<{ id: string }> };

// PUT: 既読カーソル更新
export const PUT = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id: rawId } = await context.params;

  const currentUser = await prisma.user.findFirst({
    where: { name: CURRENT_USER_NAME },
    select: { id: true },
  });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();

  if (rawId.startsWith("record:")) {
    // 伝票トーク
    const parts = rawId.split(":");
    const targetType = parts[1];
    const targetId = parts.slice(2).join(":");

    await prisma.chatReadCursor.upsert({
      where: {
        userId_targetType_targetId: {
          userId: currentUser.id,
          targetType,
          targetId,
        },
      },
      update: { lastReadAt: now },
      create: {
        userId: currentUser.id,
        targetType,
        targetId,
        lastReadAt: now,
      },
    });
  } else {
    // 一般トーク
    const roomId = rawId.startsWith("room:") ? rawId.slice(5) : rawId;

    await prisma.chatReadCursor.upsert({
      where: {
        userId_roomId: {
          userId: currentUser.id,
          roomId,
        },
      },
      update: { lastReadAt: now },
      create: {
        userId: currentUser.id,
        roomId,
        lastReadAt: now,
      },
    });
  }

  return NextResponse.json({ success: true });
});
