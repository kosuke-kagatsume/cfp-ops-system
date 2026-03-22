import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

type RouteParams = { params: Promise<{ id: string }> };

// PUT: メンバー追加・削除
export const PUT = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;
  const body = await request.json();
  const { memberIds } = body as { memberIds: string[] };

  if (!memberIds || !Array.isArray(memberIds)) {
    return NextResponse.json({ error: "memberIds array is required" }, { status: 400 });
  }

  // Get current members
  const currentMembers = await prisma.chatRoomMember.findMany({
    where: { roomId: id },
    select: { userId: true, role: true },
  });

  const currentIds = new Set(currentMembers.map((m) => m.userId));
  const newIds = new Set(memberIds);

  // Keep ADMINs that aren't in new list (don't remove admins)
  const admins = currentMembers.filter((m) => m.role === "ADMIN").map((m) => m.userId);

  // Remove members not in new list (except admins)
  const toRemove = [...currentIds].filter((id) => !newIds.has(id) && !admins.includes(id));
  // Add new members
  const toAdd = [...newIds].filter((id) => !currentIds.has(id));

  await prisma.$transaction([
    ...(toRemove.length > 0
      ? [prisma.chatRoomMember.deleteMany({ where: { roomId: id, userId: { in: toRemove } } })]
      : []),
    ...toAdd.map((userId) =>
      prisma.chatRoomMember.create({ data: { roomId: id, userId, role: "MEMBER" } })
    ),
  ]);

  const updated = await prisma.chatRoomMember.findMany({
    where: { roomId: id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(updated);
});
