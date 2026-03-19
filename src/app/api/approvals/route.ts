import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { notifyApprovalCreated } from "@/lib/notifications";
import { validateBody } from "@/lib/validate";
import { approvalCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { requestNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.approvalRequest.findMany({
    where,
    include: {
      steps: {
        include: {
          approver: { select: { id: true, name: true } },
        },
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.approvalRequest.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: data, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(data, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, approvalCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const requestNumber = await getNextNumber("APR");

  const record = await prisma.approvalRequest.create({
    data: {
      requestNumber,
      category: body.category,
      targetType: body.targetType,
      targetId: body.targetId,
      title: body.title,
      description: body.description,
      status: "PENDING",
      createdBy: body.createdBy,
      steps: body.steps
        ? {
            create: body.steps.map((s: { stepOrder: number; approverId: string }) => ({
              stepOrder: s.stepOrder,
              approverId: s.approverId,
              status: "PENDING",
            })),
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

  // Notify approvers
  try {
    await notifyApprovalCreated(record);
  } catch (e) {
    console.error("Failed to create notifications:", e);
  }

  return NextResponse.json(record, { status: 201 });
}
