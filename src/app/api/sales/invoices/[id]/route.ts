import { prisma } from "@/lib/db";
import { calculateInvoiceBalance } from "@/lib/invoice";
import { validateBody } from "@/lib/validate";
import { invoiceUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";
import { requireApproval } from "@/lib/approval-guard";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      revenues: { select: { id: true, revenueNumber: true, amount: true } },
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
  const result = await validateBody(request, invoiceUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  // 承認ゲート: ステータス変更時は承認必須
  if (body.status !== undefined) {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (existing && body.status !== existing.status && existing.status === "DRAFT") {
      const { approved } = await requireApproval("Invoice", id);
      if (!approved) {
        return NextResponse.json({ error: "承認が完了していません" }, { status: 403 });
      }
    }
  }

  const data: Record<string, unknown> = {};
  if (body.customerId !== undefined) data.customerId = body.customerId;
  if (body.billingDate !== undefined) data.billingDate = new Date(body.billingDate);
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.closingDay !== undefined) data.closingDay = body.closingDay;
  if (body.status !== undefined) data.status = body.status;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.note !== undefined) data.note = body.note;

  // Recalculate carry-forward balance if relevant fields are provided
  if (body.prevBalance !== undefined) data.prevBalance = body.prevBalance;
  if (body.paymentReceived !== undefined) data.paymentReceived = body.paymentReceived;
  if (body.subtotal !== undefined) data.subtotal = body.subtotal;
  if (body.taxAmount !== undefined) data.taxAmount = body.taxAmount;

  // Save field-level updates first
  await prisma.invoice.update({ where: { id }, data });

  // Recalculate carry-forward balance using centralized logic
  await calculateInvoiceBalance(id);

  const record = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      revenues: { select: { id: true, revenueNumber: true, amount: true } },
    },
  });

  await createAuditLog({ action: "UPDATE", tableName: "Invoice", recordId: id });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "Invoice", recordId: id });
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
