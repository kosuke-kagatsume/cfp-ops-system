import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { dealUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_request: NextRequest, ctx: Params) => {
  const { id } = await ctx.params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, code: true, name: true } },
      activities: { orderBy: { activityDate: "desc" } },
    },
  });

  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
});

export const PUT = withErrorHandler(async (request: NextRequest, ctx: Params) => {
  const { id } = await ctx.params;
  const result = await validateBody(request, dealUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  // Check if stage is changing
  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stageChanged = body.stage && body.stage !== existing.stage;

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.partnerId !== undefined) updateData.partnerId = body.partnerId || null;
  if (body.contactId !== undefined) updateData.contactId = body.contactId || null;
  if (body.division !== undefined) updateData.division = body.division || null;
  if (body.expectedAmount !== undefined) updateData.expectedAmount = body.expectedAmount;
  if (body.probability !== undefined) updateData.probability = body.probability;
  if (body.expectedCloseDate !== undefined) updateData.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate as string) : null;
  if (body.ndaDate !== undefined) updateData.ndaDate = body.ndaDate ? new Date(body.ndaDate as string) : null;
  if (body.ndaFileUrl !== undefined) updateData.ndaFileUrl = body.ndaFileUrl;
  if (body.note !== undefined) updateData.note = body.note;
  if (body.assignee !== undefined) updateData.assignee = body.assignee;
  if (body.lostReason !== undefined) updateData.lostReason = body.lostReason;
  if (body.stage !== undefined) updateData.stage = body.stage;
  if (body.closedDate !== undefined) updateData.closedDate = body.closedDate ? new Date(body.closedDate as string) : null;

  // Auto-set closedDate for WON/LOST
  if (body.stage === "WON" || body.stage === "LOST") {
    updateData.closedDate = updateData.closedDate ?? new Date();
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: updateData,
    include: {
      partner: { select: { id: true, code: true, name: true } },
      activities: { orderBy: { activityDate: "desc" } },
    },
  });

  // Auto-create stage change activity
  if (stageChanged) {
    await prisma.dealActivity.create({
      data: {
        dealId: id,
        activityType: "STAGE_CHANGE",
        description: `ステージ変更: ${existing.stage} → ${body.stage}`,
        activityDate: new Date(),
      },
    });
  }

  await createAuditLog({ action: "UPDATE", tableName: "Deal", recordId: id, newData: deal });

  return NextResponse.json(deal);
});

export const DELETE = withErrorHandler(async (_request: NextRequest, ctx: Params) => {
  const { id } = await ctx.params;

  await prisma.deal.delete({ where: { id } });
  await createAuditLog({ action: "DELETE", tableName: "Deal", recordId: id });

  return NextResponse.json({ success: true });
});
