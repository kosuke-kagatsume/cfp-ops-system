import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { dealCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const stage = searchParams.get("stage");
  const division = searchParams.get("division");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { dealNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { partner: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (stage) where.stage = stage;
  if (division) where.division = division;

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        partner: { select: { id: true, code: true, name: true } },
        activities: {
          orderBy: { activityDate: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deal.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(items, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, dealCreate);
  if ("error" in result) return result.error;
  const body = result.data;

  const dealNumber = await getNextNumber("DL");

  const deal = await prisma.deal.create({
    data: {
      dealNumber,
      title: body.title,
      partnerId: body.partnerId || undefined,
      contactId: body.contactId || undefined,
      businessCardId: body.businessCardId || undefined,
      division: body.division as "MR" | "CR" | undefined,
      expectedAmount: body.expectedAmount,
      probability: body.probability,
      startDate: body.startDate ? new Date(body.startDate as string) : new Date(),
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate as string) : undefined,
      ndaDate: body.ndaDate ? new Date(body.ndaDate as string) : undefined,
      ndaFileUrl: body.ndaFileUrl,
      note: body.note,
      assignee: body.assignee,
    },
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "Deal", recordId: deal.id, newData: deal });

  return NextResponse.json(deal, { status: 201 });
});
