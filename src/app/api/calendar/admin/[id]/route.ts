import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { adminCalendarEventUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, adminCalendarEventUpdate);
  if ("error" in result) return result.error;
  const body = result.data as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate as string);
  if (body.category !== undefined) data.category = body.category;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.assignee !== undefined) data.assignee = body.assignee ?? null;
  if (body.note !== undefined) data.note = body.note ?? null;
  if (body.isCompleted !== undefined) {
    data.isCompleted = body.isCompleted;
    if (body.isCompleted) {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
      data.completedBy = null;
    }
  }

  const record = await prisma.adminCalendarEvent.update({
    where: { id },
    data,
  });

  await createAuditLog({ action: "UPDATE", tableName: "AdminCalendarEvent", recordId: id, newData: record });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "AdminCalendarEvent", recordId: id });
  await prisma.adminCalendarEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
