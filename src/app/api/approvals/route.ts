import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

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

  const data = await prisma.approvalRequest.findMany({
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
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

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

  return NextResponse.json(record, { status: 201 });
}
