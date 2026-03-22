import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
  }

  const comments = await prisma.recordComment.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments, { headers: cacheHeaders("REALTIME") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { targetType, targetId, body: commentBody, authorName } = body;

  if (!targetType || !targetId || !commentBody) {
    return NextResponse.json({ error: "targetType, targetId, body are required" }, { status: 400 });
  }

  const comment = await prisma.recordComment.create({
    data: {
      targetType,
      targetId,
      body: commentBody,
      authorName: authorName || "ユーザー",
    },
  });

  // Notify other commenters on this thread
  try {
    const existingComments = await prisma.recordComment.findMany({
      where: { targetType, targetId, NOT: { authorName: comment.authorName } },
      select: { authorName: true },
      distinct: ["authorName"],
    });

    if (existingComments.length > 0) {
      // Get all users to find matching userIds
      const users = await prisma.user.findMany({
        where: { name: { in: existingComments.map((c) => c.authorName) } },
        select: { id: true, name: true },
      });

      const targetLabel = getTargetLabel(targetType);
      const link = getTargetLink(targetType, targetId);

      await Promise.all(
        users.map((user) =>
          prisma.notification.create({
            data: {
              userId: user.id,
              title: "コメント通知",
              message: `${comment.authorName}が${targetLabel}にコメントしました`,
              link,
            },
          })
        )
      );
    }
  } catch {
    // Notification failure should not block comment creation
  }

  return NextResponse.json(comment, { status: 201 });
});

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
