import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { contractCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { contractNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { partner: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
    where,
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
    orderBy: { startDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.contract.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: contracts, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(contracts, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, contractCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const contractNumber = await getNextNumber("CNT");

  const record = await prisma.contract.create({
    data: {
      contractNumber,
      partnerId: body.partnerId,
      title: body.title,
      contractType: body.contractType,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      autoRenewal: body.autoRenewal ?? false,
      renewalNoticeDays: body.renewalNoticeDays,
      status: body.status ?? "DRAFT",
      filePath: body.filePath,
      note: body.note,
    },
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
