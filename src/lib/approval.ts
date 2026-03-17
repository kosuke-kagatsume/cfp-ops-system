import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";

/** Amount threshold above which CEO/director approval is required */
const CEO_THRESHOLD = 1_000_000; // 100万円

/**
 * Create an approval request with steps based on the category.
 * Basic flow: Manager (step 1) -> CEO/Director (step 2, if amount > threshold)
 *
 * Returns the created approval request ID.
 */
export async function createApprovalFlow(params: {
  category: "ORDER" | "INVOICE" | "PAYMENT" | "EXPENSE" | "PRICE_CHANGE" | "OTHER_AC";
  targetType: string;
  targetId: string;
  requesterId: string;
  title: string;
  description?: string;
  amount?: number;
}): Promise<string> {
  const requestNumber = await getNextNumber("APR");

  // Find approvers by role name
  const managerRole = await prisma.role.findFirst({
    where: { name: { contains: "マネージャー", mode: "insensitive" } },
    include: { users: { where: { isActive: true }, take: 1 } },
  });

  const directorRole = await prisma.role.findFirst({
    where: {
      OR: [
        { name: { contains: "社長", mode: "insensitive" } },
        { name: { contains: "取締役", mode: "insensitive" } },
        { name: { contains: "director", mode: "insensitive" } },
      ],
    },
    include: { users: { where: { isActive: true }, take: 1 } },
  });

  type StepInput = { stepOrder: number; approverId: string; status: "PENDING" };
  const steps: StepInput[] = [];

  // Step 1: Manager approval
  if (managerRole?.users[0]) {
    steps.push({
      stepOrder: 1,
      approverId: managerRole.users[0].id,
      status: "PENDING",
    });
  }

  // Step 2: CEO/Director approval for high-value requests
  if (
    (params.amount ?? 0) > CEO_THRESHOLD &&
    directorRole?.users[0]
  ) {
    steps.push({
      stepOrder: 2,
      approverId: directorRole.users[0].id,
      status: "PENDING",
    });
  }

  const record = await prisma.approvalRequest.create({
    data: {
      requestNumber,
      category: params.category,
      targetType: params.targetType,
      targetId: params.targetId,
      title: params.title,
      description: params.description ?? null,
      status: "PENDING",
      createdBy: params.requesterId,
      steps: steps.length > 0 ? { create: steps } : undefined,
    },
  });

  return record.id;
}
