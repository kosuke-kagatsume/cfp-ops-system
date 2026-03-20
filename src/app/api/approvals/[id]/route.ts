import { prisma } from "@/lib/db";
import { notifyApprovalActioned } from "@/lib/notifications";
import { validateBody } from "@/lib/validate";
import { approvalAction, approvalUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import * as Sentry from "@sentry/nextjs";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.approvalRequest.findUnique({
    where: { id },
    include: {
      steps: {
        include: {
          approver: { select: { id: true, name: true } },
        },
        orderBy: { stepOrder: "asc" },
      },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const raw = await request.json();

  // Special: approve/reject actions
  if (raw.action === "approve" || raw.action === "reject") {
    const actionResult = approvalAction.safeParse(raw);
    if (!actionResult.success) {
      const messages = (actionResult.error.issues as any[]).map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return NextResponse.json(
        { error: "バリデーションエラー", details: messages },
        { status: 400 }
      );
    }
    const body = actionResult.data as any;
    const newStatus = body.action === "approve" ? "APPROVED" : "REJECTED";

    // Update the approval request status
    const record = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: newStatus,
        // Update the current pending step
        steps: body.stepId
          ? {
              update: {
                where: { id: body.stepId },
                data: {
                  status: newStatus,
                  comment: body.comment || null,
                  actionAt: new Date(),
                },
              },
            }
          : undefined,
      },
      include: {
        steps: {
          include: {
            approver: { select: { id: true, name: true } },
          },
          orderBy: { stepOrder: "asc" },
        },
      },
    });

    // Notify the applicant
    if (record.createdBy) {
      try {
        await notifyApprovalActioned({
          id: record.id,
          title: record.title,
          requestNumber: record.requestNumber,
          createdBy: record.createdBy,
          action: body.action,
        });
      } catch (e) {
        Sentry.captureException(e);
      }
    }

    return NextResponse.json(record);
  }

  // Regular update
  const updateResult = approvalUpdate.safeParse(raw);
  if (!updateResult.success) {
    const messages = (updateResult.error.issues as any[]).map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    return NextResponse.json(
      { error: "バリデーションエラー", details: messages },
      { status: 400 }
    );
  }
  const body = updateResult.data as any;

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.status !== undefined) data.status = body.status;

  const record = await prisma.approvalRequest.update({
    where: { id },
    data,
    include: {
      steps: {
        include: {
          approver: { select: { id: true, name: true } },
        },
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  await createAuditLog({ action: "UPDATE", tableName: "ApprovalRequest", recordId: id });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // Delete steps first
  await createAuditLog({ action: "DELETE", tableName: "ApprovalRequest", recordId: id });
  // Delete steps first
  await prisma.approvalStep.deleteMany({ where: { requestId: id } });
  await prisma.approvalRequest.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
