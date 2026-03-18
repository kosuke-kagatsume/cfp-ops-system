import { prisma } from "@/lib/db";
import { notifyApprovalActioned } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Special: approve/reject actions
  if (body.action === "approve" || body.action === "reject") {
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
        console.error("Failed to create notification:", e);
      }
    }

    return NextResponse.json(record);
  }

  // Regular update
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

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Delete steps first
  await prisma.approvalStep.deleteMany({ where: { requestId: id } });
  await prisma.approvalRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
