import { prisma } from "@/lib/db";
import { createApprovalFlow } from "@/lib/approval";
import type { ApprovalCategory } from "@prisma/client";

/**
 * Check if a record's linked approval request is fully approved.
 * Returns { approved: true } if approved or if no approval exists.
 */
export async function requireApproval(
  targetType: string,
  targetId: string
): Promise<{ approved: boolean }> {
  const approval = await prisma.approvalRequest.findFirst({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
  });

  if (!approval) return { approved: true };
  if (approval.status === "APPROVED") return { approved: true };

  return { approved: false };
}

/**
 * Create an approval flow and link it to a newly created record.
 * Returns the approval request ID.
 */
export async function createAndLinkApproval(params: {
  recordId: string;
  tableName: string;
  category: ApprovalCategory;
  title: string;
  description?: string;
  amount?: number;
  requesterId?: string;
}): Promise<string> {
  const approvalId = await createApprovalFlow({
    category: params.category,
    targetType: params.tableName,
    targetId: params.recordId,
    requesterId: params.requesterId ?? "system",
    title: params.title,
    description: params.description,
    amount: params.amount,
  });

  return approvalId;
}

/** Map of target types to their Prisma model names and FK fields */
const TARGET_MODEL_MAP: Record<string, { model: string; field: string }> = {
  Invoice: { model: "invoice", field: "approvalRequestId" },
  PaymentReceived: { model: "paymentReceived", field: "approvalRequestId" },
  PaymentPayable: { model: "paymentPayable", field: "approvalRequestId" },
  Shipment: { model: "shipment", field: "approvalRequestId" },
};

/**
 * Link an approval request to a record by setting the approvalRequestId FK.
 */
export async function linkApprovalToRecord(
  targetType: string,
  targetId: string,
  approvalRequestId: string
): Promise<void> {
  const mapping = TARGET_MODEL_MAP[targetType];
  if (!mapping) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelDelegate = (prisma as any)[mapping.model];
  if (modelDelegate?.update) {
    await modelDelegate.update({
      where: { id: targetId },
      data: { [mapping.field]: approvalRequestId },
    });
  }
}
